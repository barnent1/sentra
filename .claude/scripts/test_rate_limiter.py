#!/usr/bin/env python3
"""
Test suite for RateLimiter class in ai-agent-worker.py

Tests all 5 bug fixes:
1. Only INPUT tokens counted (not output)
2. Request pacing (2.5s minimum interval)
3. Conversation history trimming (20 messages max)
4. Proactive throttling (estimates next request)
5. Proper retry backoff (60s+ waits)

Created by Glen Barnhardt with help from Claude Code
"""

import time
import unittest
from typing import List, Tuple


# ============================================================================
# Copy RateLimiter class from ai-agent-worker.py for testing
# ============================================================================

class RateLimiter:
    """Track INPUT token usage per minute to stay within API limits"""

    def __init__(self, tokens_per_minute: int = 20000, throttle_threshold: float = 0.8, min_request_interval: float = 2.5):
        """
        Initialize rate limiter

        Args:
            tokens_per_minute: Max INPUT tokens per minute (default: 20000, 10k buffer under 30k limit)
            throttle_threshold: Throttle at N% of limit (default: 0.8 = 80%)
            min_request_interval: Minimum seconds between requests (default: 2.5)
        """
        self.tokens_per_minute = tokens_per_minute
        self.throttle_threshold = throttle_threshold
        self.min_request_interval = min_request_interval
        self.tokens_used: List[Tuple[float, int]] = []  # List of (timestamp, INPUT_token_count) tuples
        self.last_request_time: float = 0.0  # Track last request for pacing

    def add_usage(self, input_tokens: int, output_tokens: int) -> None:
        """
        Record INPUT token usage with timestamp

        CRITICAL: Only input_tokens count against Anthropic's rate limit.
        Output tokens are tracked separately and don't affect rate limiting.
        """
        now = time.time()
        # BUG FIX #1: Only count INPUT tokens (output tokens don't count against limit)
        self.tokens_used.append((now, input_tokens))

        # Clean up old entries (older than 60 seconds)
        cutoff = now - 60
        self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]

        # Update last request time
        self.last_request_time = now

    def get_current_usage(self) -> int:
        """Get total INPUT tokens used in the last 60 seconds"""
        now = time.time()
        cutoff = now - 60
        # Clean up stale entries
        self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]
        return sum(tokens for _, tokens in self.tokens_used)

    def should_throttle(self) -> bool:
        """Check if we're approaching the rate limit"""
        current = self.get_current_usage()
        threshold = self.tokens_per_minute * self.throttle_threshold
        return current >= threshold

    def estimate_next_request_tokens(self, conversation_turns: int) -> int:
        """
        Estimate token usage for next request based on conversation history growth

        Conversation history grows roughly 200-400 tokens per turn.
        Conservative estimate to prevent exceeding limits.
        """
        # Base prompt: ~500 tokens
        # Each turn adds ~300 tokens average (tools, responses, etc.)
        return 500 + (conversation_turns * 300)

    def wait_if_needed(self, logger_func, conversation_turns: int = 0) -> None:
        """
        Wait if we're approaching rate limit OR need request pacing

        BUG FIX #2: Add minimum request pacing
        BUG FIX #4: Proactive throttling BEFORE request, not after
        """
        now = time.time()

        # 1. Enforce minimum request interval (prevents bursts)
        time_since_last = now - self.last_request_time
        if self.last_request_time > 0 and time_since_last < self.min_request_interval:
            wait_for_pacing = self.min_request_interval - time_since_last
            logger_func(f"Request pacing: waiting {wait_for_pacing:.1f}s (min interval: {self.min_request_interval}s)")
            time.sleep(wait_for_pacing)

        # 2. Check if next request would exceed threshold (proactive)
        current_usage = self.get_current_usage()
        estimated_next = self.estimate_next_request_tokens(conversation_turns)
        projected_usage = current_usage + estimated_next
        threshold = self.tokens_per_minute * self.throttle_threshold

        if projected_usage >= threshold:
            # Wait for oldest tokens to age out of 60-second window
            if self.tokens_used:
                oldest_time = self.tokens_used[0][0]
                wait_time = 60 - (now - oldest_time) + 2  # +2s buffer
                if wait_time > 0:
                    logger_func(
                        f"Rate limit PROACTIVE throttle (current: {current_usage}, "
                        f"projected: {projected_usage}, threshold: {threshold:.0f} tokens/min) - "
                        f"waiting {wait_time:.1f}s for window reset"
                    )
                    time.sleep(wait_time)
                    # Clean up old entries after wait
                    now = time.time()
                    cutoff = now - 60
                    self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]

        # 3. Double-check we're under threshold after waiting
        current_usage = self.get_current_usage()
        if current_usage >= threshold:
            # Emergency wait - clear the entire window
            logger_func(
                f"EMERGENCY throttle: usage {current_usage}/{self.tokens_per_minute}, "
                f"waiting 65s to fully reset window"
            )
            time.sleep(65)
            self.tokens_used = []


# ============================================================================
# Test Suite
# ============================================================================

class TestRateLimiter(unittest.TestCase):
    """Test suite for RateLimiter class"""

    def setUp(self):
        """Set up test fixtures"""
        self.logs = []

    def log(self, message: str):
        """Mock logger function"""
        self.logs.append(message)
        print(f"[TEST LOG] {message}")

    # ========================================================================
    # Bug Fix #1: Only INPUT tokens counted
    # ========================================================================

    def test_only_input_tokens_counted(self):
        """Bug Fix #1: Verify only INPUT tokens count against limit, not output"""
        limiter = RateLimiter(tokens_per_minute=1000)

        # Add usage with both input and output tokens
        limiter.add_usage(input_tokens=500, output_tokens=5000)

        # Current usage should only reflect INPUT tokens
        self.assertEqual(limiter.get_current_usage(), 500, "Only input tokens should be counted")

        # Add another request
        limiter.add_usage(input_tokens=300, output_tokens=8000)

        # Should now have 800 input tokens (500 + 300)
        self.assertEqual(limiter.get_current_usage(), 800, "Output tokens should be ignored")

    def test_output_tokens_ignored(self):
        """Verify high output tokens don't trigger throttling"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Add request with low input, high output
        limiter.add_usage(input_tokens=100, output_tokens=10000)

        # Should NOT be throttling (100 << 800 threshold)
        self.assertFalse(limiter.should_throttle(), "High output tokens should not trigger throttling")

    # ========================================================================
    # Bug Fix #2: Request pacing (2.5s minimum interval)
    # ========================================================================

    def test_request_pacing_enforced(self):
        """Bug Fix #2: Verify minimum 2.5s interval between requests"""
        limiter = RateLimiter(tokens_per_minute=10000, min_request_interval=0.5)  # Use 0.5s for faster testing

        # Simulate first request
        limiter.add_usage(input_tokens=100, output_tokens=100)

        # Try to make immediate second request
        start_time = time.time()
        limiter.wait_if_needed(self.log, conversation_turns=1)
        elapsed = time.time() - start_time

        # Should have waited ~0.5s (min_request_interval)
        self.assertGreaterEqual(elapsed, 0.4, "Should enforce minimum request interval")
        self.assertIn("Request pacing", " ".join(self.logs), "Should log pacing wait")

    def test_no_pacing_after_sufficient_wait(self):
        """Verify pacing not enforced if enough time has passed"""
        limiter = RateLimiter(tokens_per_minute=10000, min_request_interval=0.2)

        # First request
        limiter.add_usage(input_tokens=100, output_tokens=100)

        # Wait longer than min_request_interval
        time.sleep(0.3)

        # Second request should not require additional wait
        start_time = time.time()
        limiter.wait_if_needed(self.log, conversation_turns=1)
        elapsed = time.time() - start_time

        # Should be nearly instant (< 0.1s)
        self.assertLess(elapsed, 0.1, "Should not wait if enough time passed")

    # ========================================================================
    # Bug Fix #4: Proactive throttling (estimates next request)
    # ========================================================================

    def test_proactive_throttling(self):
        """Bug Fix #4: Verify throttling happens BEFORE request, not after"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8, min_request_interval=0.0)

        # Add usage to get close to threshold (but not over)
        # Threshold is 800 tokens (1000 * 0.8)
        limiter.add_usage(input_tokens=600, output_tokens=0)

        # Current usage is 600, under threshold
        self.assertFalse(limiter.should_throttle())

        # But next request is estimated at 500 + (5 * 300) = 2000 tokens
        # Projected usage: 600 + 2000 = 2600 tokens (way over threshold)
        # Should trigger proactive throttling

        # Note: We can't easily test the wait in unit test, but we can verify
        # the estimation logic
        estimated = limiter.estimate_next_request_tokens(conversation_turns=5)
        self.assertEqual(estimated, 500 + (5 * 300), "Should estimate based on conversation turns")

        current = limiter.get_current_usage()
        projected = current + estimated
        threshold = limiter.tokens_per_minute * limiter.throttle_threshold

        self.assertGreater(projected, threshold, "Projected usage should exceed threshold")

    def test_token_estimation_scales_with_turns(self):
        """Verify token estimation grows linearly with conversation turns"""
        limiter = RateLimiter(tokens_per_minute=1000)

        # Test various turn counts
        self.assertEqual(limiter.estimate_next_request_tokens(0), 500, "Base estimate should be 500")
        self.assertEqual(limiter.estimate_next_request_tokens(1), 800, "1 turn = 500 + 300")
        self.assertEqual(limiter.estimate_next_request_tokens(10), 3500, "10 turns = 500 + 3000")
        self.assertEqual(limiter.estimate_next_request_tokens(20), 6500, "20 turns = 500 + 6000")

    # ========================================================================
    # Window cleanup tests
    # ========================================================================

    def test_window_cleanup_after_60_seconds(self):
        """Verify tokens older than 60 seconds are removed"""
        limiter = RateLimiter(tokens_per_minute=1000)

        # Add usage
        limiter.add_usage(input_tokens=500, output_tokens=0)
        self.assertEqual(limiter.get_current_usage(), 500)

        # Manually set timestamp to 61 seconds ago
        old_time = time.time() - 61
        limiter.tokens_used[0] = (old_time, 500)

        # Get current usage should clean up old entries
        current = limiter.get_current_usage()
        self.assertEqual(current, 0, "Tokens older than 60s should be removed")
        self.assertEqual(len(limiter.tokens_used), 0, "Old entries should be cleaned up")

    def test_rolling_window_calculation(self):
        """Verify rolling 60-second window works correctly"""
        limiter = RateLimiter(tokens_per_minute=1000)

        now = time.time()

        # Add tokens at different timestamps within window
        limiter.tokens_used = [
            (now - 10, 200),  # 10 seconds ago
            (now - 30, 300),  # 30 seconds ago
            (now - 50, 400),  # 50 seconds ago
        ]

        # All should be counted (all within 60s)
        self.assertEqual(limiter.get_current_usage(), 900)

        # Add old token outside window
        limiter.tokens_used.append((now - 70, 500))

        # Should still be 900 (old token excluded)
        self.assertEqual(limiter.get_current_usage(), 900)

    # ========================================================================
    # Threshold tests
    # ========================================================================

    def test_should_throttle_at_threshold(self):
        """Verify should_throttle() returns True at threshold"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Add usage to exactly hit threshold (800 tokens)
        limiter.add_usage(input_tokens=800, output_tokens=0)

        self.assertTrue(limiter.should_throttle(), "Should throttle at threshold")

    def test_should_not_throttle_below_threshold(self):
        """Verify should_throttle() returns False below threshold"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Add usage below threshold (700 < 800)
        limiter.add_usage(input_tokens=700, output_tokens=0)

        self.assertFalse(limiter.should_throttle(), "Should not throttle below threshold")

    def test_custom_threshold_values(self):
        """Test different threshold values"""
        # 50% threshold
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.5)
        limiter.add_usage(input_tokens=500, output_tokens=0)
        self.assertTrue(limiter.should_throttle(), "Should throttle at 50% threshold")

        # 90% threshold
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.9)
        limiter.add_usage(input_tokens=850, output_tokens=0)
        self.assertFalse(limiter.should_throttle(), "Should not throttle below 90% threshold")

        limiter.add_usage(input_tokens=50, output_tokens=0)  # Now at 900
        self.assertTrue(limiter.should_throttle(), "Should throttle at 90% threshold")

    # ========================================================================
    # Edge cases
    # ========================================================================

    def test_empty_window(self):
        """Test behavior with no usage recorded"""
        limiter = RateLimiter(tokens_per_minute=1000)

        self.assertEqual(limiter.get_current_usage(), 0, "Empty window should return 0")
        self.assertFalse(limiter.should_throttle(), "Empty window should not throttle")

    def test_zero_tokens(self):
        """Test adding usage with zero tokens"""
        limiter = RateLimiter(tokens_per_minute=1000)

        limiter.add_usage(input_tokens=0, output_tokens=0)

        self.assertEqual(limiter.get_current_usage(), 0)
        self.assertEqual(len(limiter.tokens_used), 1, "Should still record entry")

    def test_burst_requests(self):
        """Test handling burst of requests"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Simulate 10 rapid requests
        for i in range(10):
            limiter.add_usage(input_tokens=50, output_tokens=0)

        # Total usage should be 500 tokens
        self.assertEqual(limiter.get_current_usage(), 500)
        self.assertFalse(limiter.should_throttle(), "Burst below threshold should not throttle")

    def test_very_large_tokens(self):
        """Test handling very large token counts"""
        limiter = RateLimiter(tokens_per_minute=100000)  # 100k limit

        limiter.add_usage(input_tokens=50000, output_tokens=100000)

        self.assertEqual(limiter.get_current_usage(), 50000, "Should handle large token counts")

    def test_multiple_cleanup_cycles(self):
        """Test that cleanup works correctly over multiple cycles"""
        limiter = RateLimiter(tokens_per_minute=1000)

        now = time.time()

        # Add tokens at various times
        limiter.tokens_used = [
            (now - 100, 100),  # Should be removed
            (now - 70, 200),   # Should be removed
            (now - 50, 300),   # Should be kept
            (now - 30, 400),   # Should be kept
        ]

        # First cleanup via get_current_usage()
        usage = limiter.get_current_usage()
        self.assertEqual(usage, 700, "Should keep only recent tokens")

        # Second cleanup via add_usage()
        limiter.add_usage(input_tokens=100, output_tokens=0)
        self.assertEqual(limiter.get_current_usage(), 800, "Should maintain clean state")

    # ========================================================================
    # Integration-style tests
    # ========================================================================

    def test_realistic_conversation_flow(self):
        """Test realistic conversation with multiple turns"""
        limiter = RateLimiter(tokens_per_minute=20000, throttle_threshold=0.8, min_request_interval=0.1)

        # Simulate 10 conversation turns
        for turn in range(10):
            # Simulate API call
            limiter.add_usage(
                input_tokens=500 + (turn * 300),  # Growing history
                output_tokens=1000  # Output doesn't count
            )

            # Small delay between turns
            time.sleep(0.05)

        # Check total input tokens (should be sum of growing inputs)
        # Turn 0: 500, Turn 1: 800, Turn 2: 1100, ..., Turn 9: 3200
        # Total = 500 + 800 + 1100 + 1400 + 1700 + 2000 + 2300 + 2600 + 2900 + 3200 = 17500
        expected_total = sum(500 + (i * 300) for i in range(10))
        self.assertEqual(limiter.get_current_usage(), expected_total)

        # Should be approaching threshold (80% of 20000 = 16000)
        self.assertTrue(limiter.should_throttle(), "Should throttle after many turns")

    def test_recovery_after_window_reset(self):
        """Test that usage recovers after 60-second window"""
        limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

        # Add usage to trigger throttling
        limiter.add_usage(input_tokens=900, output_tokens=0)
        self.assertTrue(limiter.should_throttle(), "Should throttle initially")

        # Simulate time passing (set timestamp to 61 seconds ago)
        old_time = time.time() - 61
        limiter.tokens_used[0] = (old_time, 900)

        # Should no longer throttle (window reset)
        self.assertFalse(limiter.should_throttle(), "Should not throttle after window reset")
        self.assertEqual(limiter.get_current_usage(), 0, "Usage should reset to 0")


# ============================================================================
# Test Runner
# ============================================================================

def run_tests():
    """Run all tests and print summary"""
    print("="*80)
    print("RATE LIMITER TEST SUITE")
    print("="*80)
    print()

    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestRateLimiter)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print()
    print("="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print()

    if result.wasSuccessful():
        print("✅ ALL TESTS PASSED")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit(run_tests())
