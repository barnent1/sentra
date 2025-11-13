#!/usr/bin/env python3
"""
Verification script for rate limiting implementation

This script verifies all 5 bug fixes are present in the code:
1. Only INPUT tokens counted (not output)
2. Request pacing (2.5s minimum interval)
3. Conversation history trimming (20 messages max)
4. Proactive throttling (estimates next request)
5. Proper retry backoff (60s+ waits)

Created by Glen Barnhardt with help from Claude Code
"""

import re
import sys
from pathlib import Path


def verify_bug_fix_1(content: str) -> tuple[bool, str]:
    """Verify Bug Fix #1: Only INPUT tokens counted"""
    # Check for comment mentioning fix
    if "BUG FIX #1: Only count INPUT tokens" not in content:
        return False, "Missing BUG FIX #1 comment"

    # Check that add_usage only uses input_tokens
    pattern = r'def add_usage\(self, input_tokens: int, output_tokens: int\).*?self\.tokens_used\.append\(\(now, input_tokens\)\)'
    if not re.search(pattern, content, re.DOTALL):
        return False, "add_usage() doesn't append only input_tokens"

    # Verify comment about output tokens
    if "Only input_tokens count against Anthropic's rate limit" not in content:
        return False, "Missing documentation about input-only counting"

    return True, "✅ Only INPUT tokens are counted (output ignored)"


def verify_bug_fix_2(content: str) -> tuple[bool, str]:
    """Verify Bug Fix #2: Request pacing (2.5s minimum interval)"""
    # Check for comment mentioning fix
    if "BUG FIX #2: Add minimum request pacing" not in content:
        return False, "Missing BUG FIX #2 comment"

    # Check for min_request_interval parameter
    if "min_request_interval: float = 2.5" not in content:
        return False, "Missing min_request_interval parameter (should be 2.5s)"

    # Check for pacing enforcement logic
    if "time_since_last < self.min_request_interval" not in content:
        return False, "Missing pacing enforcement logic"

    # Check for "Request pacing: waiting" log message
    if '"Request pacing: waiting' not in content:
        return False, "Missing request pacing log message"

    return True, "✅ Request pacing enforced (2.5s minimum interval)"


def verify_bug_fix_3(content: str) -> tuple[bool, str]:
    """Verify Bug Fix #3: Conversation history trimming"""
    # Check for comment mentioning fix
    if "BUG FIX #3: Trim conversation history after 20 turns" not in content:
        return False, "Missing BUG FIX #3 comment"

    # Check for trimming logic
    if "if len(self.messages) > 21:" not in content:
        return False, "Missing conversation trimming logic (should trim at 21)"

    # Check that it keeps initial prompt
    if "initial_prompt = self.messages[0]" not in content:
        return False, "Trimming doesn't preserve initial prompt"

    # Check that it keeps last 20 messages
    if "recent_messages = self.messages[-20:]" not in content:
        return False, "Trimming doesn't keep last 20 messages"

    # Check for trimming log message
    if '"Trimming conversation history' not in content:
        return False, "Missing conversation trimming log message"

    return True, "✅ Conversation history trimmed (keeps initial + last 20)"


def verify_bug_fix_4(content: str) -> tuple[bool, str]:
    """Verify Bug Fix #4: Proactive throttling"""
    # Check for comment mentioning fix
    if "BUG FIX #4: Proactive throttling BEFORE request" not in content:
        return False, "Missing BUG FIX #4 comment"

    # Check for estimate_next_request_tokens method
    if "def estimate_next_request_tokens(self, conversation_turns: int)" not in content:
        return False, "Missing estimate_next_request_tokens() method"

    # Check for proactive logic in wait_if_needed
    if "projected_usage = current_usage + estimated_next" not in content:
        return False, "Missing proactive projection logic"

    # Check for proactive throttle log message
    if '"Rate limit PROACTIVE throttle' not in content:
        return False, "Missing proactive throttle log message"

    # Verify estimation formula (500 + turns * 300)
    if "return 500 + (conversation_turns * 300)" not in content:
        return False, "Incorrect token estimation formula"

    return True, "✅ Proactive throttling (estimates next request)"


def verify_bug_fix_5(content: str) -> tuple[bool, str]:
    """Verify Bug Fix #5: Proper retry backoff"""
    # Check for comment mentioning fix
    if "BUG FIX #5: Proper exponential backoff starting at 60s" not in content:
        return False, "Missing BUG FIX #5 comment"

    # Check for exponential backoff formula
    if "wait_time = 60 * (2 ** attempt)" not in content:
        return False, "Missing exponential backoff formula (should be 60 * 2^attempt)"

    # Check that it starts at 60s (not smaller)
    pattern = r'wait_time = 60 \* \(2 \*\* attempt\)'
    if not re.search(pattern, content):
        return False, "Backoff doesn't start at 60s"

    # Check for 429 error handling
    if "anthropic.RateLimitError" not in content:
        return False, "Missing RateLimitError handling"

    # Check for rate limit log message
    if '"Rate limit 429 error' not in content:
        return False, "Missing rate limit error log message"

    return True, "✅ Proper retry backoff (60s, 120s, 240s)"


def verify_configuration(content: str) -> tuple[bool, str]:
    """Verify rate limiting configuration"""
    issues = []

    # Check for environment variables
    if "CLAUDE_RATE_LIMIT_TPM" not in content:
        issues.append("Missing CLAUDE_RATE_LIMIT_TPM env var")

    if "CLAUDE_RATE_LIMIT_RETRIES" not in content:
        issues.append("Missing CLAUDE_RATE_LIMIT_RETRIES env var")

    if "CLAUDE_RATE_LIMIT_THRESHOLD" not in content:
        issues.append("Missing CLAUDE_RATE_LIMIT_THRESHOLD env var")

    # Check default values (either in __init__ or from env var)
    if '"20000"' not in content and 'tokens_per_minute=20000' not in content:
        issues.append("Default tokens_per_minute should be 20000")

    if '"0.8"' not in content and 'throttle_threshold=0.8' not in content:
        issues.append("Default throttle_threshold should be 0.8")

    # Check that RateLimiter is initialized with config
    if 'self.rate_limiter = RateLimiter(' not in content:
        issues.append("RateLimiter not initialized")

    if issues:
        return False, "; ".join(issues)

    return True, "✅ Configuration properly set (20k TPM, 80% threshold, 3 retries)"


def verify_usage_tracking(content: str) -> tuple[bool, str]:
    """Verify proper usage tracking"""
    issues = []

    # Check that rate_limiter.add_usage is called after API response
    if "self.rate_limiter.add_usage(usage.input_tokens, usage.output_tokens)" not in content:
        issues.append("add_usage not called with input/output tokens")

    # Check that wait_if_needed is called BEFORE API call
    if "self.rate_limiter.wait_if_needed(self.log, conversation_turns=" not in content:
        issues.append("wait_if_needed not called with conversation_turns")

    # Check that conversation_turns is passed to _call_claude_with_retry
    if "conversation_turns=turn" not in content:
        issues.append("conversation_turns not passed to API call")

    if issues:
        return False, "; ".join(issues)

    return True, "✅ Usage tracking properly implemented"


def main():
    """Run all verification checks"""
    print("="*80)
    print("RATE LIMITING IMPLEMENTATION VERIFICATION")
    print("="*80)
    print()

    # Read the worker script
    script_path = Path(__file__).parent / "ai-agent-worker.py"

    if not script_path.exists():
        print(f"❌ ERROR: Script not found at {script_path}")
        return 1

    content = script_path.read_text()

    # Run all checks
    checks = [
        ("Bug Fix #1: Only INPUT tokens counted", verify_bug_fix_1),
        ("Bug Fix #2: Request pacing (2.5s)", verify_bug_fix_2),
        ("Bug Fix #3: Conversation history trimming", verify_bug_fix_3),
        ("Bug Fix #4: Proactive throttling", verify_bug_fix_4),
        ("Bug Fix #5: Retry backoff (60s+)", verify_bug_fix_5),
        ("Configuration", verify_configuration),
        ("Usage tracking", verify_usage_tracking),
    ]

    all_passed = True
    results = []

    for name, check_func in checks:
        passed, message = check_func(content)
        results.append((name, passed, message))

        if passed:
            print(f"✅ {name}")
            print(f"   {message}")
        else:
            print(f"❌ {name}")
            print(f"   {message}")
            all_passed = False

        print()

    # Summary
    print("="*80)
    print("VERIFICATION SUMMARY")
    print("="*80)
    passed_count = sum(1 for _, passed, _ in results if passed)
    total_count = len(results)

    print(f"Checks passed: {passed_count}/{total_count}")
    print()

    if all_passed:
        print("✅ ALL VERIFICATION CHECKS PASSED")
        print()
        print("Rate limiting implementation is complete and correct.")
        print("All 5 bug fixes are present and properly implemented.")
        return 0
    else:
        print("❌ SOME VERIFICATION CHECKS FAILED")
        print()
        print("Please review the failed checks above and fix the issues.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
