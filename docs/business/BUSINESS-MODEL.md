# Quetrex Business Model

**Version:** 1.0.0
**Last Updated:** 2025-11-28
**Status:** Approved
**Decision Made By:** Glen Barnhardt

---

## Executive Summary

Quetrex operates as a **zero-risk platform model** where users own and pay for their own infrastructure. Quetrex provides the orchestration platform and earns revenue through:

1. **Platform subscription fees** (recurring)
2. **Hetzner affiliate referrals** (one-time bonus)

This model eliminates infrastructure billing risk, ensures ToS compliance, and maintains 96%+ profit margins.

---

## Model Overview

### What Users Pay For (Direct to Providers)

| Service | Provider | Cost | Quetrex Role |
|---------|----------|------|--------------|
| AI Runner Server | Hetzner | ~$4-8/mo | Referral link (€10 bonus) |
| AI Subscription | Anthropic | $100-200/mo | OAuth connection |
| Code Repository | GitHub | $0-4/mo | OAuth connection |

### What Users Pay Quetrex

| Service | Cost | Description |
|---------|------|-------------|
| Platform Fee | $49/mo | Dashboard, orchestration, automation |

### Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Wallet                          │
└──────────┬──────────────┬──────────────┬───────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Hetzner  │   │Anthropic │   │ Quetrex  │
    │ ~$4-8/mo │   │$100-200  │   │ $49/mo   │
    └──────────┘   └──────────┘   └──────────┘
           │                            │
           │ €10 referral bonus         │ Platform revenue
           └────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Quetrex Revenue │
              └─────────────────┘
```

---

## Why This Model

### Zero Infrastructure Risk

| Scenario | Traditional Model | Quetrex Model |
|----------|-------------------|---------------|
| User doesn't pay | You're stuck with server bill | Their server, their problem |
| User's card declines | Chase payment, eat costs | Revoke dashboard access only |
| User wants refund | Refund + lost server costs | Refund platform fee only |
| Scaling costs | You pay upfront | Users pay their own |

### ToS Compliance

| Concern | Solution |
|---------|----------|
| Anthropic account sharing | Each user = their own account |
| API key exposure | Users auth directly, keys stay with them |
| Usage attribution | Each runner = one user's subscription |

### High Margins

```
Revenue:        $49.00/user/month
- Stripe (2.9%): $1.42
- Infrastructure: $0.15 (amortized)
─────────────────────────────
Net:            $47.43/user/month

Margin:         97%
```

---

## Revenue Streams

### 1. Platform Subscription (Recurring)

| Tier | Price | Features |
|------|-------|----------|
| Pro | $49/mo | 1 user, unlimited projects, all features |
| Team | $99/mo | 5 users, shared projects, team dashboard |
| Agency | $199/mo | 10 users, client workspaces, white-label reports |
| Enterprise | Custom | SSO, audit logs, SLA, dedicated support |

### 2. Hetzner Referral (One-Time)

| Event | Bonus |
|-------|-------|
| User signs up via referral link | €10 (~$11) to Quetrex |
| New user receives | €20 credit (~5 months free CX22) |

**Referral eligibility:** Quetrex must have paid 3+ Hetzner invoices or $100+ total.

### 3. Future Revenue Opportunities

| Opportunity | Timeline | Potential |
|-------------|----------|-----------|
| Anthropic affiliate (if offered) | TBD | $10-50/user |
| Premium support plans | Year 2 | $50-200/mo |
| Plugin marketplace (rev share) | Year 2-3 | 15-30% of sales |
| Enterprise consulting | Year 3+ | $150-300/hr |
| White-label licensing | Year 4+ | $500-5000/mo |

---

## Pricing Strategy

### Pro Tier - $49/month

**Target:** Solo developers, indie hackers, freelancers

**Includes:**
- Quetrex dashboard access
- Unlimited projects
- All 13 specialized agents (orchestrator, test-writer, security-auditor, etc.)
- Runner automation scripts (Terraform)
- GitHub integration
- Voice interface
- Community support
- Design system tools (Maya)

**Does NOT include (user provides):**
- Hetzner account + server (~$4-8/mo)
- Anthropic Max subscription ($100-200/mo)
- GitHub account

### Team Tier - $99/month

**Target:** Small teams, startups

**Includes everything in Pro, plus:**
- Up to 5 team members
- Shared project dashboard
- Team activity feed
- Role-based permissions
- Priority email support

### Agency Tier - $199/month

**Target:** Agencies managing client projects

**Includes everything in Team, plus:**
- Up to 10 team members
- Client workspace separation
- White-label reports
- API access
- Dedicated support channel

### Enterprise Tier - Custom Pricing

**Target:** Large organizations

**Includes everything in Agency, plus:**
- Unlimited users
- SSO/SAML integration
- Audit logs
- Custom SLA
- Dedicated success manager
- On-premise deployment option

---

## User Responsibilities

Users are responsible for:

| Responsibility | Details |
|----------------|---------|
| Hetzner account | Create, fund, maintain |
| Hetzner billing | Pay directly to Hetzner |
| Anthropic subscription | Max ($100-200) or Team Premium ($150) |
| Anthropic billing | Pay directly to Anthropic |
| GitHub account | Free or paid, their choice |
| Server maintenance | Updates handled by Quetrex automation |
| Data backups | Automated via Quetrex scripts, storage on their Hetzner |

---

## Quetrex Responsibilities

Quetrex provides:

| Responsibility | Details |
|----------------|---------|
| Platform dashboard | Web interface for project management |
| Automation scripts | Terraform/Ansible for server provisioning |
| Runner software | Docker container, auto-updates |
| GitHub integration | Issue watching, PR creation |
| Voice interface | AI conversation for project planning |
| Design tools | Maya design specialist agent |
| Documentation | Setup guides, troubleshooting |
| Support | Community (free), Email (paid tiers) |

Quetrex does NOT:

| Exclusion | Reason |
|-----------|--------|
| Pay for user infrastructure | Zero-risk model |
| Store user credentials long-term | Security, ToS compliance |
| Access user Anthropic account | Users connect directly |
| Guarantee uptime of user servers | User's infrastructure |

---

## Technical Architecture

### Self-Hosted Runner Model

```
┌─────────────────────────────────────────────────────────────┐
│                 User's Hetzner Account                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              User's VPS (CX22 ~$4/mo)                   ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │            Docker Container: Runner                 │││
│  │  │                                                     │││
│  │  │  • Claude Code CLI                                  │││
│  │  │  • User's Anthropic session                        │││
│  │  │  • GitHub integration                              │││
│  │  │  • Reports to Quetrex dashboard                    │││
│  │  └─────────────────────────────────────────────────────┘││
│  │                                                          ││
│  │  Storage: Project files, .{project}/ directories        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Status updates, logs
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Quetrex Platform                             │
│                                                              │
│  • Dashboard (project status, queue, history)               │
│  • Voice interface (planning, specs)                        │
│  • Design tools (Maya agent)                                │
│  • Billing (Stripe - platform fee only)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Quetrex Infrastructure (Minimal)

```
Hetzner CX32 (~$9/mo)
├── Next.js web application
├── PostgreSQL (user accounts, project configs)
├── Redis (sessions, queues)
└── API endpoints for runner communication

Hetzner Storage Box BX10 (~$3/mo)
└── Database backups

Total Quetrex infrastructure: ~$12/month
```

---

## Onboarding Flow

### Step 1: Sign Up for Quetrex

```
┌─────────────────────────────────────────────────────────────┐
│                Create Your Account                           │
│                                                              │
│  Email:    [________________________]                       │
│  Password: [________________________]                       │
│                                                              │
│  [Create Account]                                           │
│                                                              │
│  ─────────────── or ───────────────                         │
│                                                              │
│  [Sign up with GitHub]                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Connect GitHub

```
┌─────────────────────────────────────────────────────────────┐
│           Connect Your GitHub Account                        │
│                                                              │
│  Quetrex needs access to:                                   │
│  • Read repositories                                        │
│  • Create issues and pull requests                          │
│  • Manage webhooks                                          │
│                                                              │
│  [Connect GitHub]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Connect Anthropic

```
┌─────────────────────────────────────────────────────────────┐
│           Connect Your Anthropic Account                     │
│                                                              │
│  Your AI runner uses your Anthropic subscription.           │
│                                                              │
│  Requirements:                                              │
│  • Claude Max ($100-200/mo) OR                             │
│  • Claude Team Premium Seat ($150/mo)                      │
│                                                              │
│  Don't have one? [Sign up for Claude Max]                  │
│                                                              │
│  [Connect Anthropic Account]                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 4: Set Up Runner Server

```
┌─────────────────────────────────────────────────────────────┐
│           Set Up Your Runner Server                          │
│                                                              │
│  Your AI runner needs a server to live on.                  │
│  We recommend Hetzner Cloud (~$4/month).                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ✨ New to Hetzner?                                     ││
│  │                                                          ││
│  │  [Create Hetzner Account - Get €20 Free!]               ││
│  │                                                          ││
│  │  That's ~5 months of free server hosting.               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Already have Hetzner? [Connect Existing Account]           │
│                                                              │
│  ────────────────────────────────────────────────────────── │
│                                                              │
│  After creating your Hetzner account:                       │
│                                                              │
│  1. Go to Security → API Tokens                             │
│  2. Create token with Read & Write access                   │
│  3. Paste it below                                          │
│                                                              │
│  API Token: [________________________________] [Validate]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 5: Provision Server (Automatic)

```
┌─────────────────────────────────────────────────────────────┐
│           Provisioning Your Runner...                        │
│                                                              │
│  ✓ Creating CX22 server in Nuremberg                       │
│  ✓ Configuring firewall rules                              │
│  ⟳ Installing Docker and runner software...                │
│  ○ Connecting to your Anthropic account                    │
│  ○ Running health check                                    │
│                                                              │
│  [========================================------] 75%       │
│                                                              │
│  This usually takes 2-3 minutes.                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 6: Ready!

```
┌─────────────────────────────────────────────────────────────┐
│           🎉 You're All Set!                                │
│                                                              │
│  Your AI runner is live and ready.                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Runner Status: 🟢 Online                               ││
│  │  Server: quetrex-runner-abc123.hetzner.cloud           ││
│  │  Region: Nuremberg, Germany                             ││
│  │  Cost: ~$4.35/month (billed by Hetzner)                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Next steps:                                                │
│  • Add your first project                                  │
│  • Create an issue with 'ai-feature' label                 │
│  • Watch your AI build it!                                 │
│                                                              │
│  [Go to Dashboard]        [Add First Project]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Growth Milestones

**Pricing assumptions:** 80% Pro ($49), 15% Team ($99), 5% Agency ($199) = ~$57/user average

### Year 1: Foundation ($32K)

| Quarter | Users | MRR | Focus |
|---------|-------|-----|-------|
| Q1 | 5 | $245 | Beta, iterate |
| Q2 | 20 | $980 | Public launch |
| Q3 | 45 | $2,200 | Early traction |
| Q4 | 80 | $4,600 | Word of mouth |

### Year 2: Traction ($145K)

| Quarter | Users | MRR | Focus |
|---------|-------|-----|-------|
| Q1 | 120 | $6,900 | Improve onboarding |
| Q2 | 180 | $10,300 | Self-serve launch |
| Q3 | 280 | $16,000 | Integrations |
| Q4 | 400 | $23,000 | Community |

### Year 3: Scale ($580K)

| Quarter | Users | MRR | Focus |
|---------|-------|-----|-------|
| Q1 | 550 | $31,500 | Team features |
| Q2 | 750 | $43,000 | Agency tier |
| Q3 | 1,000 | $57,000 | Enterprise |
| Q4 | 1,200 | $69,000 | Go full-time |

### Year 4: Expansion ($1.6M)

| Quarter | Users | MRR | Focus |
|---------|-------|-----|-------|
| Q1 | 1,500 | $86,000 | Enterprise tier |
| Q2 | 1,900 | $109,000 | Sales hire |
| Q3 | 2,400 | $138,000 | Partners |
| Q4 | 3,000 | $172,000 | International |

### Year 5: Maturity ($4.3M)

| Quarter | Users | MRR | Focus |
|---------|-------|-----|-------|
| Q1 | 3,800 | $218,000 | Market leader |
| Q2 | 4,800 | $275,000 | Partnerships |
| Q3 | 6,000 | $344,000 | Global |
| Q4 | 7,500 | $430,000 | Series A or profitable |

### 5-Year Summary

| Year | Users | ARR | Cumulative Revenue |
|------|-------|-----|-------------------|
| 1 | 80 | $55K | $32K |
| 2 | 400 | $276K | $177K |
| 3 | 1,200 | $828K | $757K |
| 4 | 3,000 | $2.1M | $2.4M |
| 5 | 7,500 | $5.2M | $6.7M |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Anthropic pricing changes | Medium | High | Multi-LLM support |
| Hetzner discontinues referrals | Low | Low | Minor revenue impact |
| Competition from GitHub/Microsoft | High | Medium | Focus on agency workflows |
| High churn | Medium | High | Improve onboarding, sticky features |
| Slow user growth | Medium | Medium | Content marketing, partnerships |

---

## Legal Considerations

### Terms of Service Compliance

| Provider | Requirement | Our Compliance |
|----------|-------------|----------------|
| Anthropic | No account sharing | Each user = own account |
| Anthropic | No automated abuse | Rate-limited by subscription |
| Hetzner | Referral rules | No spam, no paid ads with link |
| Stripe | PCI compliance | Use Stripe Elements |

### Data Handling

| Data Type | Storage | Retention |
|-----------|---------|-----------|
| User accounts | Quetrex PostgreSQL | Until deletion request |
| Hetzner API tokens | Encrypted, user's session | Session only (not stored) |
| Anthropic sessions | Never stored | Pass-through only |
| Project configs | Quetrex PostgreSQL | Until project deleted |
| Runner logs | User's server | User controlled |

---

## Appendix: Competitor Comparison

| Feature | Quetrex | GitHub Copilot Workspace | Cursor |
|---------|---------|-------------------------|--------|
| Self-hosted runners | ✅ | ❌ | ❌ |
| Voice interface | ✅ | ❌ | ❌ |
| Design system tools | ✅ | ❌ | ❌ |
| Issue → PR automation | ✅ | ✅ | ❌ |
| Team collaboration | ✅ | ✅ | ✅ |
| Bring your own AI | ✅ | ❌ | Partial |
| Agency workflows | ✅ | ❌ | ❌ |
| Multi-agent workflows | ✅ (13 agents) | ❌ | ❌ |
| Price | $49/mo + AI sub | $19-39/mo | $20-40/mo |

---

*Document created by Glen Barnhardt with Claude Code assistance.*
*Last updated: 2025-11-28*
