# Visual Design Updates - CIO Recommendations

This document summarizes the visual design updates made to incorporate the new security, cost governance, and system health features.

## Updated Files

### 1. `docs/24-dashboard-visual-mockups.md`

**New Navigation Items (Sidebar):**
- 💰 **Costs** - Quick access to budget and token tracking
- 🔄 **Health** - System health and circuit breaker monitoring

**New Dashboard Home Widgets:**
```
┌────────────────────────────────────────────────────────────┐
│  💰 Monthly Budget: $342.50 / $500.00 (68.5%)              │
│  🔄 Circuit Breaker: ✅ CLOSED (System Healthy)            │
└────────────────────────────────────────────────────────────┘
```

Shows at-a-glance budget status and system health on the main dashboard.

---

## New Visual Mockups Added

### Section 15: Analytics Dashboard with Cost Tracking

**Features:**
- **Budget Overview Card**
  - Monthly budget limit ($500)
  - Current spending ($342.50)
  - Remaining budget ($157.50)
  - Visual progress bar (68.5%)
  - Alert threshold indicator (80%)
  - Daily burn rate & 7-day average
  - Projected month-end spending

- **Cost Breakdown**
  - Cost by phase (PLAN: 25.5%, CODE: 50%, TEST: 15%, REVIEW: 9.5%)
  - Token usage metrics (Input: 12.5M, Output: 3.8M)
  - Most expensive tasks list
  - Average cost per task ($1.46)

- **Daily Spending Trend Chart**
  - Line graph showing daily spending over 30 days
  - Identifies spending spikes
  - Helps predict budget exhaustion

**Visual Elements:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  💰 Monthly Budget & Token Usage                                 ┃
┃                                                                   ┃
┃  Budget: $500.00  │  Spent: $342.50  │  Remaining: $157.50      ┃
┃                                                                   ┃
┃  [████████████████████████████░░░░░░░░░░] 68.5%                 ┃
┃                                                                   ┃
┃  ⚠️  Threshold: 80% ($400) - On track                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

### Section 16: System Health & Circuit Breaker Monitoring

**Features:**
- **Circuit Breaker Status Cards**
  - Three state views: CLOSED (✅), HALF_OPEN (🟡), OPEN (🔴)
  - Consecutive failure counter (0-5)
  - Countdown timer for recovery attempts
  - Last state change timestamp
  - Failure reason display
  - Manual override buttons

- **Recent System Events Timeline**
  - Circuit breaker state changes
  - Task rollback events
  - System recovery notifications
  - Clickable details links

- **Rollback Statistics Dashboard**
  - Total automatic rollbacks
  - Success/failure counts
  - Success rate percentage
  - Manual intervention tracking

- **Error Rate Visualization**
  - Bar chart showing error rate over last hour
  - Helps identify problem periods

- **Active Task Monitoring**
  - Real-time list of running tasks
  - Execution duration tracking
  - Long-running task alerts (>30 min)
  - Quick stop buttons

**Visual Elements:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🔄 Circuit Breaker Status                                        ┃
┃                                                                   ┃
┃  State: ✅ CLOSED        Consecutive Failures: 0 / 5            ┃
┃                                                                   ┃
┃  System is operating normally. Task execution is active.         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Recent System Events:
┌───────────────────────────────────────────────────────────────────┐
│ ✅ Circuit breaker closed                          2m ago         │
│    System recovered after HALF_OPEN test succeeded               │
├───────────────────────────────────────────────────────────────────┤
│ ♻️  Task rollback completed                        8m ago         │
│    Task #T042 rolled back to clean state                         │
└───────────────────────────────────────────────────────────────────┘
```

---

### Section 17: Security Settings - Keychain & Audit

**Features:**
- **Device Management Interface**
  - List of all registered devices (3 shown)
  - OS-specific keychain indicators:
    - 💻 macOS Keychain
    - 🖥️ Windows Credential Manager
    - 🐧 GNOME Keyring (libsecret)
  - Registration timestamp
  - Last used timestamp
  - Key ID display
  - Encryption status badges (✅)
  - Per-device actions (Rotate Key, Revoke Access)

- **Security Preferences Toggles**
  - [✅] Use OS Keychain encryption (Recommended)
  - [✅] Automatic key rotation reminders (90 days)
  - [✅] Require MFA for sensitive operations

- **Immutable Audit Log Viewer**
  - Event type icons (🔐 🔄 ♻️ 🔴 💰)
  - Timestamp (relative and absolute)
  - Event details
  - User and IP tracking
  - 🔒 Immutability indicator on each record
  - Export and filter controls
  - Prominent notice about append-only nature

**Visual Elements:**
```
🔐 Authentication Keys

┌─────────────────────────────────────────────────────────────┐
│  💻 MacBook Pro (work-laptop)                              │
│  🔒 Secured with macOS Keychain                            │
│                                                             │
│  • Registered: Oct 1, 2024 at 2:30 PM                      │
│  • Last used: 2 minutes ago                                │
│  • Key ID: key_a1b2c3d4e5                                  │
│  • Storage: Encrypted in Keychain ✅                       │
│                                                             │
│  [Rotate Key] [Revoke Access]                              │
└─────────────────────────────────────────────────────────────┘

📋 Audit Log (Immutable)

┌───────────────────────────────────────────────────────────────────┐
│ 🔐 key_generated                               2m ago             │
│    New device "MacBook Pro" registered                            │
│    User: john.doe@company.com  IP: 192.168.1.42                   │
│    🔒 Record immutable - cannot be modified                       │
├───────────────────────────────────────────────────────────────────┤
│ ♻️  task_rollback                              8m ago             │
│    Task #T042 automatically rolled back due to agent error       │
│    Reason: Test failures · Worktree: .sentra/worktrees/task-042   │
│    🔒 Record immutable - cannot be modified                       │
└───────────────────────────────────────────────────────────────────┘

ℹ️  Audit logs are append-only and cryptographically immutable.
   Records cannot be modified or deleted, even by administrators.
```

---

## Design Consistency

All new mockups maintain:
- ✅ Dark violet theme (#8b5cf6)
- ✅ Glassmorphism effects
- ✅ Consistent color palette (slate backgrounds, green success, red error, amber warning)
- ✅ Unicode box-drawing characters for visual structure
- ✅ Icon consistency (💰 for costs, 🔄 for health, 🔒 for security)
- ✅ Clear visual hierarchy
- ✅ Accessibility considerations (color-blind friendly, clear labels)

---

## User Experience Improvements

### 1. At-a-Glance System Status
Users can now see critical system information on the dashboard home:
- Budget utilization percentage
- Circuit breaker state
- No need to navigate to separate pages

### 2. Proactive Alerting
Visual indicators show:
- ⚠️ Budget threshold warnings (80%)
- 🔴 Circuit breaker open state
- ♻️ Automatic rollback events

### 3. Security Transparency
Users can clearly see:
- Which devices have access
- How keys are encrypted (OS keychain)
- Complete audit trail of all security events
- Immutability guarantees

### 4. Cost Control
Detailed visibility into:
- Where money is being spent (by phase)
- Which tasks are most expensive
- Projected month-end spending
- Daily burn rate trends

---

## Implementation Notes

### Responsive Behavior

All new sections adapt to smaller screens:
- Budget card shows simplified metrics on mobile
- Circuit breaker status uses stacked layout
- Device cards stack vertically
- Charts become scrollable on narrow viewports

### Interactive Elements

**Budget Dashboard:**
- Click phase bars to drill into specific phase costs
- Hover over daily trend to see exact amounts
- Export button for CSV download

**System Health:**
- Refresh button for real-time updates (auto-refresh every 5s)
- "Force Reset Circuit" requires confirmation dialog
- "View Error Logs" filters audit log to errors only

**Security Settings:**
- "Rotate Key" shows wizard with security prompts
- "Revoke Access" requires MFA if enabled
- Audit log filter dropdown (event type, date range)
- Export formats: CSV, JSON, PDF

### Animations

Following existing Framer Motion patterns:
- Budget progress bar animates on page load
- Circuit breaker state transitions fade/scale
- Rollback events slide in from right
- Device cards have hover lift effect

---

## Developer Handoff Notes

### API Endpoints Needed

**Cost Tracking:**
- `GET /api/projects/:id/costs` - Budget and spending data
- `GET /api/projects/:id/costs/daily` - Daily trend data
- `GET /api/projects/:id/costs/by-phase` - Phase breakdown

**System Health:**
- `GET /api/system/health` - Circuit breaker status
- `GET /api/system/events` - Recent system events
- `GET /api/system/rollbacks` - Rollback statistics
- `POST /api/system/circuit-breaker/reset` - Manual reset

**Security:**
- `GET /api/auth/devices` - List registered devices
- `POST /api/auth/devices/:id/rotate` - Rotate device key
- `POST /api/auth/devices/:id/revoke` - Revoke device access
- `GET /api/audit` - Immutable audit log
- `GET /api/audit/export` - Export audit records

### Real-Time Updates

Use WebSocket connections for:
- Circuit breaker state changes
- Active task monitoring (execution duration)
- New audit log entries
- Budget spending updates

### Data Refresh Rates

- Budget data: Every 30 seconds
- Circuit breaker: Every 5 seconds (when OPEN or HALF_OPEN)
- Active tasks: Every 10 seconds
- Audit log: Real-time (WebSocket)

---

## Testing Checklist

- [ ] Budget progress bar shows correct percentage
- [ ] Circuit breaker state transitions work correctly
- [ ] Rollback statistics calculate accurately
- [ ] Keychain indicators show correct OS
- [ ] Audit log shows immutability markers
- [ ] Export functions generate valid files
- [ ] All links navigate correctly
- [ ] Mobile responsive layouts work
- [ ] Animations perform smoothly
- [ ] Real-time updates don't cause layout shifts
- [ ] Color contrast meets WCAG AA standards

---

## Future Enhancements

Based on the visual designs, future iterations could include:

1. **Cost Forecasting**
   - AI-predicted spending trajectory
   - "What-if" budget scenarios

2. **Circuit Breaker History**
   - Timeline view of past incidents
   - Pattern detection for recurring issues

3. **Advanced Audit Filtering**
   - Multi-criteria search
   - Saved filter presets
   - Scheduled exports

4. **Device Security Scores**
   - Risk assessment per device
   - Recommendations for key rotation

---

*All visual mockups follow the established Sentra design system and maintain consistency with existing dashboard components.*
