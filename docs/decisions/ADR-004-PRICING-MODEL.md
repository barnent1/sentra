# ADR-004: Pricing Model and Trial Strategy

**Status:** Accepted
**Date:** 2025-11-28
**Decision Maker:** Glen Barnhardt

---

## Context

Quetrex needs a pricing strategy that:
1. Allows users to try the product before committing
2. Converts trial users to paying customers
3. Doesn't feel manipulative with artificial limitations
4. Accounts for the fact users already pay for Anthropic ($100-200/mo)

## Decision

**14-day free trial with full access, then $15/month flat rate.**

No crippled free tier. No artificial feature limitations. No "upgrade to unlock."

### Trial Terms

| Aspect | Policy |
|--------|--------|
| Duration | 14 days |
| Access | Full - all agents, commands, hooks, features |
| Credit card required | No (at trial start) |
| Credit card required | Yes (to continue after trial) |
| Data retention | Exported on request if not converting |

### Pricing After Trial

| Tier | Price | Included |
|------|-------|----------|
| Individual | $15/mo | 1 user, unlimited projects, all features |
| Team | $30/mo | 5 users, shared projects |
| Agency | $50/mo | 10 users, client workspaces |
| Enterprise | Custom | SSO, audit logs, SLA |

### User's Total Cost Stack

| Service | Provider | Cost | Notes |
|---------|----------|------|-------|
| AI Subscription | Anthropic | $100-200/mo | Required, user's existing cost |
| Runner Hosting | Hetzner | ~$4/mo | €20 credit covers first month |
| **Platform Fee** | **Quetrex** | **$15/mo** | **Our revenue** |
| GitHub | GitHub | $0-4/mo | Optional paid features |

## Rationale

### Why No Crippled Free Tier

1. **Feels manipulative** - "Upgrade to unlock security-auditor" annoys users
2. **Founder instinct** - Glen expressed personal dislike for this model
3. **Value leakage** - Giving away agents for free undercuts the business
4. **Complexity** - Tracking usage limits adds engineering overhead

### Why 14-Day Trial

1. **Enough time** - Users can build something real and see value
2. **Natural conversion** - They're invested by day 15
3. **Low friction** - No credit card upfront to start
4. **Industry standard** - Users expect and understand trials

### Why $15/Month is Right

1. **Small vs Anthropic bill** - $15 is trivial compared to $100-200/mo AI cost
2. **Clear value** - 13 agents, commands, hooks, automation
3. **Room for tiers** - Team ($30) and Agency ($50) for growth
4. **Sustainable** - 96% margins at scale

## Implementation

### Authentication Flow

```
1. User runs /quetrex-init
2. "Create your free account" → quetrex.app/signup
3. Email verification
4. 14-day trial starts immediately
5. Day 12: "Trial ends in 2 days" reminder
6. Day 14: "Add payment to continue" prompt
7. Day 15: Access suspended until payment
```

### Trial State Tracking

```typescript
interface UserSubscription {
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trialStartedAt: Date;
  trialEndsAt: Date;  // trialStartedAt + 14 days
  subscriptionStartedAt?: Date;
  currentPeriodEnd?: Date;
}
```

### Grace Period

- Trial expires at midnight on day 14
- 3-day grace period with "trial expired" warnings
- Day 18: Full access suspended
- Data retained for 30 days (can reactivate)

## Consequences

### Positive

- Simple, honest pricing users respect
- No engineering complexity for usage tracking
- Clear conversion point drives urgency
- $15/mo is easy decision vs $100+ Anthropic cost

### Negative

- No free tier means some users won't try at all
- Trial abuse possible (new accounts)
- 14 days may not be enough for slow evaluators

### Mitigations

- Trial abuse: Track by email domain, GitHub account, IP patterns
- Slow evaluators: Allow one-time 7-day extension on request
- No free tier: Plugin README clearly states trial available

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Quetrex Pricing                                            │
│                                                              │
│  ✓ 14-day free trial (full access)                         │
│  ✓ No credit card to start                                 │
│  ✓ $15/month after trial                                   │
│  ✓ All features included                                   │
│  ✓ Cancel anytime                                          │
│                                                              │
│  No artificial limits. No "upgrade to unlock."              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

*Decision finalized by Glen Barnhardt on 2025-11-28*
