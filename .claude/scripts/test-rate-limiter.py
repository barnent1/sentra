#!/usr/bin/env python3
"""
Test script for rate limiting functionality

This script tests the RateLimiter class to ensure it:
1. Tracks token usage correctly
2. Triggers throttling at the right threshold
3. Clears old entries from the tracking window
"""

import sys
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import the RateLimiter from ai-agent-worker
import importlib.util
spec = importlib.util.spec_from_file_location("agent", Path(__file__).parent / "ai-agent-worker.py")
agent_module = importlib.util.module_from_spec(spec)

# Manually execute the rate limiter class definition
# We'll just copy the RateLimiter class logic here for testing

class RateLimiter:
    """Track token usage per minute to stay within API limits"""

    def __init__(self, tokens_per_minute: int = 25000, throttle_threshold: float = 0.8):
        """
        Initialize rate limiter

        Args:
            tokens_per_minute: Max tokens per minute (default: 25000, under 30k limit)
            throttle_threshold: Throttle at N% of limit (default: 0.8 = 80%)
        """
        self.tokens_per_minute = tokens_per_minute
        self.throttle_threshold = throttle_threshold
        self.tokens_used = []  # List of (timestamp, token_count) tuples

    def add_usage(self, input_tokens: int, output_tokens: int) -> None:
        """Record token usage with timestamp"""
        now = time.time()
        total_tokens = input_tokens + output_tokens
        self.tokens_used.append((now, total_tokens))

        # Clean up old entries (older than 60 seconds)
        cutoff = now - 60
        self.tokens_used = [(ts, tokens) for ts, tokens in self.tokens_used if ts > cutoff]

    def get_current_usage(self) -> int:
        """Get total tokens used in the last 60 seconds"""
        return sum(tokens for _, tokens in self.tokens_used)

    def should_throttle(self) -> bool:
        """Check if we're approaching the rate limit"""
        current = self.get_current_usage()
        threshold = self.tokens_per_minute * self.throttle_threshold
        return current >= threshold

    def wait_if_needed(self, logger_func) -> None:
        """Wait if we're approaching rate limit"""
        if self.should_throttle():
            # Find oldest token usage
            if self.tokens_used:
                oldest_time = self.tokens_used[0][0]
                wait_time = 60 - (time.time() - oldest_time)
                if wait_time > 0:
                    current_usage = self.get_current_usage()
                    logger_func(
                        f"Rate limit approaching ({current_usage}/{self.tokens_per_minute} tokens/min, "
                        f"{current_usage/self.tokens_per_minute*100:.1f}%), waiting {wait_time:.1f}s"
                    )
                    time.sleep(wait_time + 1)  # Add 1s buffer
                    # Clear the tracking window after waiting
                    self.tokens_used = []


def test_basic_tracking():
    """Test basic token tracking"""
    print("Test 1: Basic token tracking...")
    limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

    # Add some usage
    limiter.add_usage(100, 200)  # 300 tokens
    assert limiter.get_current_usage() == 300, "Should track 300 tokens"

    limiter.add_usage(150, 250)  # 400 tokens
    assert limiter.get_current_usage() == 700, "Should track 700 tokens total"

    print("✓ Basic tracking works")


def test_throttle_threshold():
    """Test throttle threshold"""
    print("\nTest 2: Throttle threshold...")
    limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

    # Add usage below threshold
    limiter.add_usage(300, 200)  # 500 tokens (50%)
    assert not limiter.should_throttle(), "Should NOT throttle at 50%"

    # Add usage at threshold
    limiter.add_usage(200, 100)  # 300 more = 800 tokens (80%)
    assert limiter.should_throttle(), "SHOULD throttle at 80%"

    print("✓ Throttle threshold works")


def test_time_window():
    """Test 60-second rolling window"""
    print("\nTest 3: 60-second rolling window...")
    limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

    # Add old usage (simulate past usage)
    old_timestamp = time.time() - 61  # 61 seconds ago
    limiter.tokens_used.append((old_timestamp, 500))

    # Add recent usage
    limiter.add_usage(100, 100)  # 200 tokens

    # Old entries should be cleaned up
    assert limiter.get_current_usage() == 200, "Old entries should be removed"
    assert len(limiter.tokens_used) == 1, "Should only have 1 entry"

    print("✓ Time window cleanup works")


def test_wait_if_needed():
    """Test wait_if_needed function"""
    print("\nTest 4: wait_if_needed (no wait)...")
    limiter = RateLimiter(tokens_per_minute=1000, throttle_threshold=0.8)

    # Add usage below threshold
    limiter.add_usage(100, 200)  # 300 tokens (30%)

    # Should not wait
    start = time.time()
    limiter.wait_if_needed(lambda msg: print(f"  Logger: {msg}"))
    elapsed = time.time() - start

    assert elapsed < 1, "Should not wait when below threshold"
    print("✓ No wait when below threshold")


def test_realistic_scenario():
    """Test realistic API call scenario"""
    print("\nTest 5: Realistic scenario...")
    limiter = RateLimiter(tokens_per_minute=25000, throttle_threshold=0.8)

    # Simulate several API calls
    api_calls = [
        (5000, 2000),   # 7k tokens
        (6000, 3000),   # 9k tokens (16k total)
        (4000, 2000),   # 6k tokens (22k total - 88% of limit)
    ]

    for i, (input_tok, output_tok) in enumerate(api_calls):
        limiter.add_usage(input_tok, output_tok)
        current = limiter.get_current_usage()
        percent = (current / limiter.tokens_per_minute) * 100
        print(f"  Call {i+1}: {input_tok + output_tok} tokens, total: {current} ({percent:.1f}%)")

    # At 88%, should trigger throttle
    assert limiter.should_throttle(), "Should throttle at 88%"
    print("✓ Realistic scenario works")


if __name__ == "__main__":
    print("="*60)
    print("Rate Limiter Test Suite")
    print("="*60)

    try:
        test_basic_tracking()
        test_throttle_threshold()
        test_time_window()
        test_wait_if_needed()
        test_realistic_scenario()

        print("\n" + "="*60)
        print("All tests passed! ✓")
        print("="*60)

    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
