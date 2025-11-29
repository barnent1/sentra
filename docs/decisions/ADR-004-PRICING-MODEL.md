# ADR-004: Pricing Model and Trial Strategy

**Status:** Accepted
**Date:** 2025-11-28
**Updated:** 2025-11-28
**Decision Maker:** Glen Barnhardt

---

## Context

Quetrex needs a pricing strategy that:
1. Allows users to try the product before committing
2. Converts trial users to paying customers
3. Doesn't feel manipulative with artificial limitations
4. Reflects the true value of an AI development team
5. Positions Quetrex as a professional tool, not a cheap utility

## Decision

**14-day free trial with full access, then $49/month for Pro tier.**

No crippled free tier. No artificial feature limitations. No "upgrade to unlock."

### Pricing Rationale

Quetrex is not a simple tool - it's an **AI development team**:
- 13 specialized agents (architecture, testing, security, design)
- Multi-agent workflows with quality enforcement
- GitHub automation with runner infrastructure
- Design system generation
- TDD enforcement

**Comparable products:**
- ChatGPT Plus: $20/mo (just chat)
- GitHub Copilot: $19-39/mo (just autocomplete)
- Cursor: $20/mo (AI editor)
- ClickFunnels: $99/mo (funnel builder)

$49/mo positions Quetrex as a professional tool while remaining accessible.

### Trial Terms

| Aspect | Policy |
|--------|--------|
| Duration | 14 days |
| Access | Full - all agents, commands, hooks, features |
| Credit card required | No (at trial start) |
| Credit card required | Yes (to continue after trial) |
| Data retention | Exported on request if not converting |

### Pricing Tiers

| Tier | Price | Included |
|------|-------|----------|
| **Pro** | $49/mo | 1 user, unlimited projects, all features |
| **Team** | $99/mo | 5 users, shared projects, team dashboard |
| **Agency** | $199/mo | 10 users, client workspaces, white-label reports |
| **Enterprise** | Custom | SSO, audit logs, SLA, dedicated support |

### User's Total Cost Stack

| Service | Provider | Cost | Notes |
|---------|----------|------|-------|
| AI Subscription | Anthropic | $100-200/mo | Required, user's existing cost |
| Runner Hosting | Hetzner | ~$4/mo | €20 credit covers first month |
| **Platform Fee** | **Quetrex** | **$49/mo** | **Our revenue** |
| GitHub | GitHub | $0-4/mo | Optional paid features |

**Total: ~$153-253/mo** for a complete AI development setup.

## Why $49/Month

### Underpricing Hurts

$15/mo signals:
- "Cheap tool, probably not that good"
- "Side project, not a real business"
- Attracts price-sensitive users (high churn)
- Leaves money on the table

### $49/mo Signals

- Professional tool for serious developers
- Worth the investment
- Real company behind it
- Still trivial vs developer hourly rate ($50-200/hr)

### The Math

Someone paying $100-200/mo for Claude won't blink at $49 for tools that make it 10x more useful.

$49 = less than 1 hour of developer time saved per month.

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

### Protection

Both plugin and runner validate subscription status:

```typescript
// Before every agent/command execution
const status = await checkSubscription(userToken);
if (!status.active) {
  showSubscriptionRequired();
  return;
}
```

### Trial State Tracking

```typescript
interface UserSubscription {
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  tier: 'pro' | 'team' | 'agency' | 'enterprise';
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

- Professional positioning attracts serious users
- Higher revenue per user (3x vs $15)
- Lower churn (price-sensitive users self-select out)
- Room for discounts/promotions without going too low
- Simple, honest pricing users respect

### Negative

- Higher price point may reduce trial signups
- Some solo developers may find it expensive
- Competitors could undercut on price

### Mitigations

- 14-day trial lets them prove value before paying
- Annual discount: $39/mo paid yearly ($468/yr vs $588)
- Student/OSS discount: 50% off ($25/mo)
- Money-back guarantee: 30 days, no questions asked

---

## Revenue Projections

### Per-User Revenue

| Tier | Monthly | Annual |
|------|---------|--------|
| Pro | $49 | $588 |
| Team | $99 | $1,188 |
| Agency | $199 | $2,388 |

### At Scale (Assuming 80% Pro, 15% Team, 5% Agency)

| Users | Monthly Revenue | Annual Revenue |
|-------|-----------------|----------------|
| 100 | $5,740 | $68,880 |
| 500 | $28,700 | $344,400 |
| 1,000 | $57,400 | $688,800 |
| 5,000 | $287,000 | $3,444,000 |

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Quetrex Pricing                                            │
│                                                              │
│  ✓ 14-day free trial (full access)                         │
│  ✓ No credit card to start                                 │
│  ✓ Pro: $49/month after trial                              │
│  ✓ Team: $99/month (5 users)                               │
│  ✓ Agency: $199/month (10 users)                           │
│  ✓ All features included at every tier                     │
│  ✓ Cancel anytime                                          │
│                                                              │
│  No artificial limits. No "upgrade to unlock."              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

*Decision finalized by Glen Barnhardt on 2025-11-28*
