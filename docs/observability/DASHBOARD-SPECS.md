# Observability Dashboard Specifications

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Author:** Glen Barnhardt with Claude Code
**Status:** Design Specification
**Phase:** Phase 4 - Integration & Observability

---

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Architecture](#dashboard-architecture)
3. [Session Metrics](#session-metrics)
4. [E2E Generation Metrics](#e2e-generation-metrics)
5. [Security Metrics](#security-metrics)
6. [Cost Metrics](#cost-metrics)
7. [Performance Metrics](#performance-metrics)
8. [Alert Configuration](#alert-configuration)
9. [UI/UX Specifications](#uiux-specifications)
10. [Data Storage & Retention](#data-storage--retention)
11. [Implementation Timeline](#implementation-timeline)

---

## Overview

### Purpose

The Sentra Observability Dashboard provides real-time visibility into:
- Voice architect session metrics
- E2E test generation performance
- Security event monitoring
- Cost tracking (OpenAI, Anthropic usage)
- System performance and health

### Target Users

1. **Technical Lead (Glen):** High-level metrics, cost tracking, security alerts
2. **Development Team:** Performance metrics, test generation stats
3. **Operations:** System health, error rates, resource usage

### Design Principles

- **Dark theme** - True dark background (not gray)
- **Violet accents** - Primary action color: #7C3AED
- **Real-time updates** - WebSocket or polling (max 10s latency)
- **Mission control aesthetic** - Dense information, actionable insights
- **Mobile responsive** - Works on tablet/phone (read-only)

---

## Dashboard Architecture

### Technology Stack

**Frontend:**
- Next.js App Router (server components where possible)
- TailwindCSS for styling
- Recharts for data visualization
- React Query for data fetching
- Server-Sent Events (SSE) for real-time updates

**Backend:**
- Next.js API routes (Edge functions)
- PostgreSQL (metrics storage)
- Redis (real-time aggregation)
- Drizzle ORM (edge-compatible)

**Data Pipeline:**
```
Events → Redis (real-time) → Aggregator → PostgreSQL (historical)
                ↓
           SSE Stream → Dashboard
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Sentra Observability                                    [Filter] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ Active      │ │ Total E2E   │ │ Cost Today  │ │ Errors     │ │
│ │ Sessions    │ │ Tests Gen'd │ │ $12.45      │ │ 0          │ │
│ │ 3           │ │ 142         │ │             │ │            │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Session Activity (Last 24h)                   [Line Chart]  │ │
│ │                                                              │ │
│ │  10│     ╱╲                                                  │ │
│ │    │    ╱  ╲     ╱╲                                          │ │
│ │   5│   ╱    ╲   ╱  ╲                                         │ │
│ │    │  ╱      ╲ ╱    ╲                                        │ │
│ │   0└──────────────────────────                               │ │
│ │     0h    6h   12h   18h   24h                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────┬───────────────────────────────────────────┤
│ E2E Generation      │ Security Events (Last 1h)                 │
│ ┌─────────────────┐ │ ┌───────────────────────────────────────┐ │
│ │ Template: 85%   │ │ │ 14:32 - Credential request (github)   │ │
│ │ LLM: 15%        │ │ │ 14:31 - Audit log uploaded            │ │
│ │ Success: 98%    │ │ │ 14:30 - Proxy started                 │ │
│ │ Avg time: 2.3s  │ │ │ 14:25 - Container cleanup             │ │
│ └─────────────────┘ │ └───────────────────────────────────────┘ │
└─────────────────────┴───────────────────────────────────────────┘
```

---

## Session Metrics

### Voice Architect Sessions

**Tracked metrics:**

#### Session Overview
- **Total sessions:** Count of all architect sessions created
- **Active sessions:** Currently in-progress sessions
- **Completed sessions:** Sessions marked as "ready for implementation"
- **Average sessions per project:** Sessions needed to reach 90%+ completeness
- **Session duration:** Average time per session (minutes)

#### Completion Metrics
- **Average completion percentage:** Mean completion % across all projects
- **Projects at 90%+ completion:** Count ready for implementation
- **Incomplete projects:** Projects < 90% completion
- **Stalled projects:** No activity in > 7 days

#### Coverage Breakdown
Track % complete for each of 10 coverage areas:
1. Business Requirements
2. User Personas
3. Database Architecture
4. API Design
5. UI/UX Screens
6. Security Model
7. Third-Party Integrations
8. Performance Requirements
9. Deployment Strategy
10. Testing Strategy

**Data structure:**
```typescript
interface SessionMetrics {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  avg_sessions_per_project: number;
  avg_session_duration_minutes: number;

  completion: {
    avg_completion_pct: number;
    ready_for_implementation: number;
    incomplete_projects: number;
    stalled_projects: number;
  };

  coverage_breakdown: {
    business_requirements: number;
    user_personas: number;
    database_architecture: number;
    api_design: number;
    ui_screens: number;
    security_model: number;
    integrations: number;
    performance: number;
    deployment: number;
    testing: number;
  };

  trends: {
    sessions_per_day: Array<{ date: string; count: number }>;
    completion_over_time: Array<{ date: string; avg_pct: number }>;
  };
}
```

**Visualization:**
- **Line chart:** Sessions per day (last 30 days)
- **Progress bars:** Coverage breakdown (10 categories)
- **Pie chart:** Project status distribution (active, completed, stalled)
- **Histogram:** Session duration distribution

---

## E2E Generation Metrics

### Test Generation Performance

**Tracked metrics:**

#### Generation Stats
- **Total tests generated:** Count of all E2E tests created
- **Template vs LLM ratio:** Percentage using templates vs LLM
- **Success rate:** % of generations that compiled without errors
- **Average generation time:** Time to generate test (seconds)
- **Test file size:** Average size of generated test files (KB)

#### Template Usage Breakdown
```typescript
interface TemplateUsage {
  template_name: 'crud-operations' | 'form-validation' | 'modal-workflow' |
                 'navigation' | 'loading-states' | 'visual-regression' | 'llm';
  usage_count: number;
  success_rate: number;
  avg_generation_time_ms: number;
}
```

#### Quality Metrics
- **Test pass rate:** % of generated tests that pass on first run
- **Test failure categories:** Categorize failures (syntax, timeout, selector, assertion)
- **Manual fixes required:** % of tests needing manual intervention
- **Coverage achieved:** % of screens with E2E tests

**Data structure:**
```typescript
interface E2EGenerationMetrics {
  total_tests_generated: number;
  template_vs_llm: {
    template_count: number;
    llm_count: number;
    template_pct: number;
    llm_pct: number;
  };

  success_rate: number;
  avg_generation_time_ms: number;
  avg_test_file_size_kb: number;

  template_breakdown: TemplateUsage[];

  quality: {
    first_run_pass_rate: number;
    failure_categories: {
      syntax_errors: number;
      timeout_errors: number;
      selector_errors: number;
      assertion_errors: number;
    };
    manual_fixes_pct: number;
    screen_coverage_pct: number;
  };

  trends: {
    generated_per_day: Array<{ date: string; count: number }>;
    success_rate_over_time: Array<{ date: string; rate: number }>;
  };
}
```

**Visualization:**
- **Donut chart:** Template vs LLM ratio
- **Bar chart:** Template usage breakdown
- **Line chart:** Generation success rate over time
- **Table:** Recent test generations (last 20)

---

## Security Metrics

### Credential Proxy Monitoring (Phase 2)

**Tracked metrics:**

#### Request Metrics
- **Total credential requests:** All requests to proxy
- **Granted requests:** Successful credential provisions
- **Rejected requests:** Denied requests
- **Rejection reasons:** Breakdown by error code
- **Rejection rate:** % of requests rejected

#### Performance
- **Average response time:** Time to validate and provide credential (ms)
- **p95 response time:** 95th percentile latency
- **p99 response time:** 99th percentile latency
- **Proxy uptime:** % of time proxy is available

#### Security Events
- **Anomaly detections:** Unusual request patterns
  - High request rate (>10/min from single container)
  - Unknown service requests
  - Repeated rejections (>5 from same container)
- **Audit log size:** Total audit log entries
- **Failed validation attempts:** Malformed requests

**Data structure:**
```typescript
interface SecurityMetrics {
  credential_requests: {
    total: number;
    granted: number;
    rejected: number;
    rejection_rate: number;
  };

  rejection_breakdown: {
    unknown_service: number;
    operation_not_allowed: number;
    rate_limit_exceeded: number;
    invalid_request: number;
    internal_error: number;
  };

  performance: {
    avg_response_time_ms: number;
    p95_response_time_ms: number;
    p99_response_time_ms: number;
    proxy_uptime_pct: number;
  };

  security_events: {
    anomalies_detected: number;
    high_rate_attempts: number;
    unknown_service_attempts: number;
    repeated_rejections: number;
    audit_log_entries: number;
  };

  trends: {
    requests_per_hour: Array<{ hour: string; count: number }>;
    rejection_rate_over_time: Array<{ hour: string; rate: number }>;
  };
}
```

**Visualization:**
- **Gauge:** Rejection rate (0-100%)
- **Line chart:** Requests per hour (last 24h)
- **Bar chart:** Rejection reason breakdown
- **Timeline:** Recent security events (last 50)
- **Heatmap:** Request volume by hour of day

**Alerts:**
- Rejection rate > 10% (Warning)
- Rejection rate > 25% (Critical)
- Anomaly detected (Immediate)
- Proxy downtime > 1 minute (Critical)

---

## Cost Metrics

### AI Service Usage Tracking

**Tracked metrics:**

#### OpenAI Usage
- **Total tokens:** Input + output tokens consumed
- **Cost per token tier:** GPT-4, GPT-3.5, Whisper, TTS
- **Daily cost:** Total OpenAI spend today
- **Monthly cost:** Total OpenAI spend this month
- **Projected monthly cost:** Forecast based on current usage

#### Anthropic Usage
- **Total tokens:** Input + output tokens consumed
- **Cost per model:** Claude Opus, Claude Sonnet, Claude Haiku
- **Daily cost:** Total Anthropic spend today
- **Monthly cost:** Total Anthropic spend this month
- **Projected monthly cost:** Forecast

#### Cost Breakdown by Feature
- **Voice architect sessions:** Cost per session (Anthropic Opus)
- **E2E test generation:** Cost per test (Anthropic Sonnet/LLM)
- **Voice interface:** Cost per session (OpenAI Whisper + TTS)
- **Agent execution:** Cost per GitHub issue (Anthropic + OpenAI)

**Data structure:**
```typescript
interface CostMetrics {
  openai: {
    total_tokens: number;
    tokens_by_model: {
      'gpt-4': number;
      'gpt-3.5-turbo': number;
      'whisper-1': number;
      'tts-1': number;
    };
    cost_today: number;
    cost_this_month: number;
    projected_monthly_cost: number;
  };

  anthropic: {
    total_tokens: number;
    tokens_by_model: {
      'claude-opus-4': number;
      'claude-sonnet-4': number;
      'claude-haiku-3': number;
    };
    cost_today: number;
    cost_this_month: number;
    projected_monthly_cost: number;
  };

  feature_breakdown: {
    voice_architect: { sessions: number; total_cost: number; avg_cost_per_session: number };
    e2e_generation: { tests: number; total_cost: number; avg_cost_per_test: number };
    voice_interface: { sessions: number; total_cost: number; avg_cost_per_session: number };
    agent_execution: { issues: number; total_cost: number; avg_cost_per_issue: number };
  };

  trends: {
    cost_per_day: Array<{ date: string; openai: number; anthropic: number }>;
    tokens_per_day: Array<{ date: string; tokens: number }>;
  };
}
```

**Visualization:**
- **Stacked area chart:** Daily cost (OpenAI + Anthropic, last 30 days)
- **Pie chart:** Cost breakdown by feature
- **Number cards:** Today's cost, This month's cost, Projected monthly
- **Bar chart:** Cost per model (last 7 days)

**Alerts:**
- Daily cost > $50 (Warning)
- Daily cost > $100 (Critical)
- Projected monthly cost > $1000 (Warning)

---

## Performance Metrics

### Application Performance

**Tracked metrics:**

#### Response Times
- **API endpoint latency:** Average response time per endpoint
- **p95 latency:** 95th percentile for all endpoints
- **p99 latency:** 99th percentile for all endpoints
- **Slowest endpoints:** Top 10 slowest endpoints

#### Database Performance
- **Query count:** Total database queries executed
- **Slow query count:** Queries > 100ms
- **Connection pool usage:** Active / Total connections
- **Cache hit rate:** Redis cache hit percentage

#### Frontend Performance
- **Page load time:** Average time to load pages
- **Time to Interactive (TTI):** Average TTI across pages
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)

**Data structure:**
```typescript
interface PerformanceMetrics {
  api: {
    avg_response_time_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    slowest_endpoints: Array<{
      endpoint: string;
      method: string;
      avg_time_ms: number;
      call_count: number;
    }>;
  };

  database: {
    query_count: number;
    slow_query_count: number;
    connection_pool: {
      active: number;
      total: number;
      usage_pct: number;
    };
    cache_hit_rate: number;
  };

  frontend: {
    avg_page_load_ms: number;
    avg_tti_ms: number;
    core_web_vitals: {
      lcp: number; // Target: < 2.5s
      fid: number; // Target: < 100ms
      cls: number; // Target: < 0.1
    };
  };

  trends: {
    response_time_over_time: Array<{ timestamp: string; avg_ms: number }>;
    cache_hit_rate_over_time: Array<{ timestamp: string; rate: number }>;
  };
}
```

**Visualization:**
- **Line chart:** API response time over time (last 1h, 1min intervals)
- **Table:** Slowest endpoints
- **Gauge:** Cache hit rate (0-100%)
- **Cards:** Core Web Vitals with pass/fail indicators

---

## Alert Configuration

### Alert Rules

#### Critical Alerts (PagerDuty)
- **Proxy downtime:** Credential proxy not responding for >1 minute
- **Error rate spike:** Error rate >5% for >5 minutes
- **Database down:** Cannot connect to database
- **High cost:** Daily cost >$100
- **Security anomaly:** Unusual credential request pattern detected

#### Warning Alerts (Slack)
- **High rejection rate:** Security proxy rejecting >10% of requests
- **Slow response times:** p95 latency >1s for >10 minutes
- **High database usage:** Connection pool >80% utilized
- **Moderate cost:** Daily cost >$50
- **Test generation failures:** E2E generation success rate <90%

#### Info Alerts (Email)
- **Daily summary:** End-of-day metrics report
- **Weekly summary:** Week-over-week trends
- **Monthly summary:** Cost and usage report

**Alert channels:**
```typescript
interface AlertChannels {
  critical: ['pagerduty', 'slack', 'email'];
  warning: ['slack', 'email'];
  info: ['email'];
}
```

---

## UI/UX Specifications

### Color Palette

**Background:**
- Primary background: `#0A0A0A` (true dark)
- Card background: `#111111`
- Border: `#1E1E1E`

**Text:**
- Primary text: `#FFFFFF`
- Secondary text: `#A0A0A0`
- Muted text: `#707070`

**Accents:**
- Primary (violet): `#7C3AED`
- Success (green): `#10B981`
- Warning (yellow): `#F59E0B`
- Error (red): `#EF4444`
- Info (blue): `#3B82F6`

### Typography

**Font:** Inter (system fallback)

**Sizes:**
- Stat numbers: `text-3xl font-bold` (30px)
- Card headers: `text-xl font-semibold` (20px)
- Body text: `text-sm` (14px)
- Labels: `text-xs uppercase tracking-wide` (12px)

### Component Library

**Stat Card:**
```tsx
<Card className="bg-[#111111] border-[#1E1E1E]">
  <CardHeader className="text-xs uppercase tracking-wide text-[#A0A0A0]">
    Active Sessions
  </CardHeader>
  <CardContent className="text-3xl font-bold text-white">
    3
  </CardContent>
  <CardFooter className="text-xs text-[#707070]">
    +2 from yesterday
  </CardFooter>
</Card>
```

**Chart Colors:**
- Primary line: `#7C3AED` (violet)
- Secondary line: `#3B82F6` (blue)
- Grid lines: `#1E1E1E`
- Tooltip background: `#111111`

### Responsive Breakpoints

- **Desktop:** >= 1024px (4 columns)
- **Tablet:** 768px - 1023px (2 columns)
- **Mobile:** < 768px (1 column, read-only)

---

## Data Storage & Retention

### PostgreSQL Schema

**Tables:**

#### `session_metrics`
```sql
CREATE TABLE session_metrics (
  id SERIAL PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  session_id UUID NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  completion_pct DECIMAL(5, 2),
  coverage JSONB, -- 10 category breakdown
  status VARCHAR(50) -- 'active', 'completed', 'stalled'
);
```

#### `e2e_generation_metrics`
```sql
CREATE TABLE e2e_generation_metrics (
  id SERIAL PRIMARY KEY,
  screen_name VARCHAR(255) NOT NULL,
  template_used VARCHAR(50), -- NULL if LLM
  generation_time_ms INTEGER NOT NULL,
  file_size_kb DECIMAL(10, 2),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL
);
```

#### `security_events`
```sql
CREATE TABLE security_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- 'credential_request', 'anomaly', etc.
  service VARCHAR(50), -- 'github', 'anthropic'
  operation VARCHAR(50),
  status VARCHAR(20), -- 'GRANTED', 'REJECTED'
  rejection_reason TEXT,
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL
);
```

#### `cost_tracking`
```sql
CREATE TABLE cost_tracking (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic'
  model VARCHAR(50) NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  cost_usd DECIMAL(10, 4) NOT NULL,
  feature VARCHAR(50), -- 'voice_architect', 'e2e_generation', etc.
  created_at TIMESTAMP NOT NULL
);
```

### Retention Policies

- **Real-time data (Redis):** 1 hour
- **Recent metrics (PostgreSQL):** 90 days
- **Historical aggregates (PostgreSQL):** 2 years
- **Audit logs:** 365 days (compliance requirement)

### Data Aggregation

**Cron jobs:**
- **Every 1 minute:** Aggregate real-time metrics from Redis → PostgreSQL
- **Every 1 hour:** Calculate hourly aggregates
- **Every 1 day:** Calculate daily aggregates, clean up expired data
- **Every 1 week:** Generate weekly trend reports

---

## Implementation Timeline

### Phase 1: Core Dashboard (Week 1)
- [ ] Create dashboard page (`/app/observability/page.tsx`)
- [ ] Implement stat cards (session, E2E, cost, errors)
- [ ] Set up PostgreSQL schema
- [ ] Create data aggregation jobs

### Phase 2: Session Metrics (Week 1-2)
- [ ] Implement session tracking in voice architect
- [ ] Create session metrics API endpoints
- [ ] Build session activity chart
- [ ] Add coverage breakdown visualization

### Phase 3: E2E Generation Metrics (Week 2)
- [ ] Instrument E2E test generator
- [ ] Track template vs LLM usage
- [ ] Build generation performance charts
- [ ] Add quality metrics tracking

### Phase 4: Security Metrics (Week 2-3)
- [ ] Parse credential proxy audit logs
- [ ] Build security events timeline
- [ ] Implement anomaly detection
- [ ] Configure security alerts

### Phase 5: Cost Tracking (Week 3)
- [ ] Integrate OpenAI usage API
- [ ] Integrate Anthropic usage API
- [ ] Build cost breakdown charts
- [ ] Implement cost projection algorithm

### Phase 6: Alerts & Monitoring (Week 3-4)
- [ ] Configure Slack integration
- [ ] Configure email alerts
- [ ] Set up PagerDuty (optional)
- [ ] Test alert delivery

---

## Success Metrics

**Dashboard adoption:**
- Technical lead checks dashboard daily
- Development team uses metrics for optimization
- Alert response time < 5 minutes

**Data accuracy:**
- Metric discrepancies < 1%
- Real-time update latency < 10 seconds
- Uptime > 99.9%

**Cost optimization:**
- Identify top 3 cost drivers within 1 week
- Reduce unnecessary API usage by 20% within 1 month

---

**Document Owner:** Glen Barnhardt with Claude Code
**Last Updated:** November 23, 2025
**Version:** 1.0
**Status:** Design Specification - Ready for Implementation
