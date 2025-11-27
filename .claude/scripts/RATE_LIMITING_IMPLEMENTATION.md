# Rate Limiting Implementation

**Author:** Glen Barnhardt with help from Claude Code
**Date:** 2025-11-12
**Issue:** Prevent Anthropic API 429 rate limit errors

## Problem

The AI agent worker was hitting Anthropic API rate limits (30,000 input tokens per minute), causing failures with error:
```
Error code: 429 - rate_limit_error: This request would exceed the rate limit
for your organization of 30,000 input tokens per minute.
```

## Solution

Implemented comprehensive rate limiting and retry logic with:

1. **Token usage tracking** - Rolling 60-second window
2. **Proactive throttling** - Wait before hitting limit (at 80% by default)
3. **Exponential backoff retry** - Retry 3 times on 429 errors with increasing delays
4. **Configurable limits** - Environment variables for tuning

## Implementation Details

### 1. RateLimiter Class (`ai-agent-worker.py:114-164`)

```python
class RateLimiter:
    """Track token usage per minute to stay within API limits"""

    def __init__(self, tokens_per_minute=25000, throttle_threshold=0.8):
        # Track (timestamp, token_count) tuples
        self.tokens_used: List[Tuple[float, int]] = []

    def add_usage(self, input_tokens, output_tokens):
        # Record usage, clean up old entries (>60s)

    def should_throttle(self):
        # Check if at 80% of limit

    def wait_if_needed(self, logger_func):
        # Wait until oldest entry ages out
```

**Key Features:**
- Tracks both input and output tokens
- Automatically cleans up entries older than 60 seconds
- Configurable throttle threshold (default: 80%)

### 2. Retry Logic with Exponential Backoff

```python
def _call_claude_with_retry(self, messages, tools, max_tokens=4096):
    for attempt in range(self.rate_limit_retries):
        try:
            # Check rate limit BEFORE calling
            self.rate_limiter.wait_if_needed(self.log)

            response = self.client.messages.create(...)

            # Track usage AFTER successful call
            self.rate_limiter.add_usage(
                usage.input_tokens,
                usage.output_tokens
            )

            return response

        except anthropic.RateLimitError as e:
            # Exponential backoff: 5s, 10s, 20s
            wait_time = (2 ** attempt) * 5
            time.sleep(wait_time)
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: After 5 seconds
- Attempt 3: After 10 seconds
- Attempt 4: After 20 seconds (if max_retries=4)

### 3. Configuration (Environment Variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_RATE_LIMIT_TPM` | 25000 | Max tokens per minute (under 30k limit) |
| `CLAUDE_RATE_LIMIT_RETRIES` | 3 | Max retry attempts on 429 errors |
| `CLAUDE_RATE_LIMIT_THRESHOLD` | 0.8 | Throttle at N% of limit (80%) |
| `TEST_RATE_LIMIT` | false | Enable test mode (1000 TPM limit) |

**Why 25,000 TPM?**
- Anthropic limit: 30,000 TPM
- Buffer: 5,000 tokens (16.7%)
- Prevents hitting the hard limit
- Accounts for slight timing variations

### 4. Logging

Rate limit status is logged:
- **At startup**: Configuration details
- **Every 5 turns**: Current usage percentage
- **When throttling**: Wait time and current usage
- **On 429 error**: Retry attempt details

Example logs:
```
Rate limiting: 25000 tokens/min, throttle at 80%, max 3 retries
Rate limit status: 18500/25000 tokens/min (74.0%)
Rate limit approaching (20100/25000 tokens/min, 80.4%), waiting 42.3s
Rate limit hit (current usage: 28000/25000 tokens/min), retrying in 5s (attempt 1/3)
```

### 5. Workflow Integration (`.github/workflows/ai-agent.yml`)

Added environment variables:
```yaml
env:
  CLAUDE_RATE_LIMIT_TPM: '25000'
  CLAUDE_RATE_LIMIT_RETRIES: '3'
  CLAUDE_RATE_LIMIT_THRESHOLD: '0.8'
```

## Testing

### Unit Tests (`test-rate-limiter.py`)

Five comprehensive tests verify:
1. ✓ Basic token tracking
2. ✓ Throttle threshold triggers correctly
3. ✓ 60-second window cleanup
4. ✓ No unnecessary waiting
5. ✓ Realistic multi-call scenario

Run tests:
```bash
python3 .claude/scripts/test-rate-limiter.py
```

All tests pass ✓

### Manual Testing

Enable test mode to verify throttling:
```bash
export TEST_RATE_LIMIT=true  # Uses 1000 TPM limit
python3 .claude/scripts/ai-agent-worker.py <issue_number>
```

## How It Works (Flow Diagram)

```
┌─────────────────────────────────────────────┐
│ Agent wants to call Claude API             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ _call_claude_with_retry()                  │
│ ┌─────────────────────────────────────────┐ │
│ │ For each retry attempt (max 3):         │ │
│ │                                          │ │
│ │ 1. rate_limiter.wait_if_needed()        │ │
│ │    ├─ Get current usage                 │ │
│ │    ├─ If >= 80% of limit:               │ │
│ │    │   └─ Wait until oldest entry       │ │
│ │    │      ages out (60s window)         │ │
│ │    └─ Clear tracking after wait         │ │
│ │                                          │ │
│ │ 2. client.messages.create()             │ │
│ │    ├─ Success: Track usage & return     │ │
│ │    ├─ RateLimitError:                   │ │
│ │    │   └─ Exponential backoff retry     │ │
│ │    └─ Other error: Raise immediately    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ Response returned to conversation loop      │
└─────────────────────────────────────────────┘
```

## Edge Cases Handled

1. **First API call**: No previous usage, passes through immediately
2. **Long-running agents**: Tracking window rolls continuously (60s)
3. **Rapid bursts**: Throttle kicks in, forces wait
4. **Multiple retries**: Exponential backoff prevents tight retry loops
5. **Persistent 429s**: After max retries, fails with clear error message

## Benefits

✓ **Prevents failures**: Proactive throttling avoids hitting hard limit
✓ **Graceful recovery**: Exponential backoff on 429 errors
✓ **Configurable**: Tune limits per environment/organization
✓ **Observable**: Comprehensive logging shows what's happening
✓ **Tested**: Unit tests verify all functionality
✓ **Production-ready**: Used in real GitHub Actions workflows

## Future Improvements

1. **Per-model limits**: Different limits for different Claude models
2. **Output token prediction**: Estimate output tokens to prevent overshooting
3. **Multiple time windows**: Track 1-minute, 5-minute, hourly limits
4. **Rate limit sharing**: Coordinate across multiple concurrent agents
5. **Dynamic throttle**: Adjust threshold based on recent 429 patterns

## Troubleshooting

### Still getting 429 errors?

1. **Check current limit**: Contact Anthropic to verify your org's limit
2. **Lower TPM**: Set `CLAUDE_RATE_LIMIT_TPM=20000` for more headroom
3. **Increase threshold**: Set `CLAUDE_RATE_LIMIT_THRESHOLD=0.7` (throttle at 70%)
4. **Reduce max_tokens**: Lower the max_tokens parameter in API calls
5. **Simplify prompts**: Shorter prompts = fewer input tokens

### Rate limiting too aggressive?

1. **Increase TPM**: Set `CLAUDE_RATE_LIMIT_TPM=28000` (closer to limit)
2. **Raise threshold**: Set `CLAUDE_RATE_LIMIT_THRESHOLD=0.9` (throttle at 90%)
3. **Check logs**: Verify you're actually hitting the threshold

### Testing rate limiting?

1. **Enable test mode**: `export TEST_RATE_LIMIT=true`
2. **Check logs**: Look for "Rate limiting: 1000 tokens/min (TEST MODE)"
3. **Watch for throttle**: Should trigger quickly with low limit

## References

- **Anthropic API Limits**: https://docs.anthropic.com/claude/reference/rate-limits
- **Agent Worker Script**: `/Users/barnent1/Projects/quetrex/.claude/scripts/ai-agent-worker.py`
- **Workflow Config**: `/Users/barnent1/Projects/quetrex/.github/workflows/ai-agent.yml`
- **Test Suite**: `/Users/barnent1/Projects/quetrex/.claude/scripts/test-rate-limiter.py`

---

*This implementation follows Quetrex's Perfect Agentic Structure principles: comprehensive testing, clear logging, graceful error handling, and production-ready code.*
