# Multi-Session Architect Guide

**Audience:** Developers using Sentra
**Last Updated:** 2025-11-23

---

## Overview

Sentra's voice architect is designed for **multi-day, multi-week conversations** about complex software projects. Unlike traditional AI assistants that forget everything when you close the tab, Sentra's architect maintains perfect memory across sessions and picks up exactly where you left off.

### Key Features

- **Perfect Memory** - Never re-asks answered questions
- **Session Resume** - Continue conversations after days or weeks
- **Progress Tracking** - Visual indicators show completion status
- **Confidence Scoring** - Objective metrics determine spec readiness
- **Fortune 500 Quality** - Specifications ready for enterprise development teams

---

## How It Works

### The 10-Category Coverage System

Every software project needs answers in 10 key areas. The architect systematically works through each category:

1. **Business Requirements** (15% weight)
   - Target users and problem being solved
   - Core features and success metrics
   - What's explicitly out of scope

2. **Database Architecture** (15% weight)
   - Data models and relationships
   - Indexes and validation rules
   - Migration strategy

3. **API Design** (15% weight)
   - REST/GraphQL endpoints
   - Request/response schemas
   - Authentication and authorization

4. **UI/UX Screens** (15% weight)
   - Screen layouts and navigation
   - User interactions and workflows
   - Responsive design requirements

5. **Security Model** (15% weight)
   - Authentication mechanisms
   - Authorization rules
   - Data encryption and compliance

6. **Third-Party Integrations** (5% weight)
   - External APIs and services
   - SDKs and libraries
   - Webhook handling

7. **Performance Requirements** (5% weight)
   - Response time targets
   - Concurrent user capacity
   - Caching strategy

8. **Deployment Strategy** (5% weight)
   - Infrastructure (cloud provider, containers)
   - CI/CD pipeline
   - Environment configuration

9. **Testing Strategy** (10% weight)
   - Unit test coverage requirements
   - Integration test scenarios
   - E2E test patterns

10. **Error Handling** (implicit in all categories)
    - Edge cases and validation
    - Error recovery
    - User feedback

---

## Starting a New Session

### Step 1: Create Project

1. Navigate to the Sentra dashboard
2. Click **"New Project"**
3. Enter project details:
   - **Name:** e.g., "Bookmark Manager SaaS"
   - **Description:** Brief overview
   - **Repository:** GitHub repository URL (optional)

### Step 2: Start Architect Session

1. Click **"Chat with Architect"** on your project card
2. Click the microphone button (or type if you prefer)
3. Describe your project in natural language:

```
"I want to build a bookmark manager for knowledge workers.
 Users should be able to save bookmarks with tags, search
 across all their bookmarks, and organize them into folders.
 Target 100-1000 bookmarks per user."
```

### Step 3: Answer Questions

The architect will ask clarifying questions in each category:

```
ARCHITECT: "Who is your primary target user? Are they individual
            developers, teams, or enterprise organizations?"

YOU: "Individual knowledge workers - developers, researchers,
      students. Not teams or enterprises for v1."

ARCHITECT: "Great! What problem are you solving for them?"

YOU: "Browser bookmarks are too basic - no tags, no search,
      hard to organize when you have hundreds. Enterprise
      tools like Notion are too complex and expensive."
```

**Tips:**
- Give detailed answers (150-400 characters ideal)
- Be specific about numbers (users, data size, performance)
- Don't hesitate to say "I don't know yet" - the architect will help you figure it out
- You can pause and resume anytime

### Step 4: Track Progress

The architect shows real-time progress:

```
┌────────────────────────────────────────────────────────┐
│ Bookmark Manager SaaS                                   │
├────────────────────────────────────────────────────────┤
│ Overall Completion: 45%    Readiness Score: 68%        │
│                                                          │
│ ✅ Business Requirements      92% Complete              │
│ ✅ Database Architecture      95% Complete              │
│ 🟡 API Design                 78% In Progress           │
│ ⚪ UI/UX Screens              12% Not Started           │
│ ⚪ Security Model              0% Not Started            │
│ ...                                                      │
└────────────────────────────────────────────────────────┘
```

**Status Indicators:**
- ✅ **Complete (90-100%)** - Category fully specified
- 🟡 **In Progress (70-89%)** - More detail needed
- ⚪ **Not Started (0-69%)** - Major gaps remain

---

## Resuming After Days/Weeks

### The Resume Flow

When you return to a paused session:

1. **Load Session State** (< 500ms)
   - Session metadata
   - All 10 category progress scores
   - Last 3 conversation turns
   - Decisions log

2. **Choose Recap Preference**

You'll see three options:

#### Option 1: Detailed Recap

**Best for:** Returning after several days/weeks

```
ARCHITECT: "Welcome back to your Bookmark Manager SaaS session!

Here's what we've accomplished so far:

We defined a bookmark manager for individual knowledge workers
handling 100-1000 bookmarks. The database uses PostgreSQL with
User and Bookmark models, including tags and full-text search.
Authentication uses JWT with bcrypt password hashing.

We still need to discuss API design, security model, and UI/UX
screens.

Your specification is currently 45% complete with a 68% readiness
score.

Completed areas: Business Requirements, Database Architecture
In progress: API Design
Not started: UI/UX Screens, Security Model, Testing Strategy,
Deployment Strategy

Key decisions made:
- PostgreSQL database (not MongoDB)
- JWT authentication with 7-day expiration
- Full-text search using PostgreSQL ts_vector
- Tag-based organization (not folder hierarchy)

Ready to continue? I suggest we focus on API Design next."
```

#### Option 2: Quick Summary

**Best for:** Returning same day or next day

```
ARCHITECT: "Welcome back!

Last session covered business requirements and database
architecture for a bookmark manager SaaS app.

We're 45% complete. Next up: API Design.

Ready to continue?"
```

#### Option 3: Dive Right In

**Best for:** Brief interruption (bathroom break, phone call)

```
ARCHITECT: "Great! Picking up where we left off...

For your REST API, let's start with authentication. What
authentication method do you prefer - JWT tokens, session
cookies, or OAuth?"
```

### What Happens Next

The architect automatically determines the next action:

**Scenario A: You didn't answer the last question**
```
Last turn: "How many users do you expect in the first year?" (architect)

Resume: "Welcome back! I asked: How many users do you expect in
         the first year?"
```

**Scenario B: You answered but session ended before response**
```
Last turn: "Probably around 50-100 users" (you)

Resume: "Great! 50-100 users is a good target for an MVP. That
         influences our scaling decisions. For that size, we can
         start with a single database instance... [continues
         processing your answer]"
```

**Scenario C: Mid-category**
```
Current category: API Design (75% complete)
Last topic: Authentication endpoints

Resume: "Perfect. Now let's talk about your bookmark CRUD endpoints.
         What operations do users need? Create, read, update, delete
         bookmarks?"
```

**Scenario D: Between categories**
```
Last category: Database Architecture (100% complete)
Next category: API Design (0% complete)

Resume: "Excellent! We've fully defined your database architecture.
         Now let's design your API. Will you use REST, GraphQL, or
         a hybrid approach?"
```

---

## Understanding Progress Indicators

### Completion Percentage

Shows what percentage of required questions have been answered in each category.

```
Business Requirements: 80% (4/5 questions answered)
```

**Calculation:**
```
completion = (questions_answered / total_questions) * 100
```

### Confidence Score

Objective measure of specification quality using 4 factors:

```
Business Requirements
├─ Completeness: 80% (4/5 questions answered)
├─ Specificity: 65% (answers average 130 chars, target 200)
├─ Consistency: 100% (no contradictions detected)
└─ Coverage: 80% (4/5 subtopics discussed)

Confidence: 81% = (80×0.4 + 65×0.2 + 100×0.2 + 80×0.2)
Status: 🟡 In Progress
```

**Weights:**
- **Completeness (40%)** - Most important: answered all questions?
- **Specificity (20%)** - Answers detailed enough? (not vague one-liners)
- **Consistency (20%)** - No contradictions or changed requirements?
- **Coverage (20%)** - All subtopics addressed?

### Readiness Score

Overall session readiness (weighted average of all categories):

```
Readiness Score: 73%

= Business Requirements (92%) × 0.15
+ Database Architecture (95%) × 0.15
+ API Design (78%) × 0.15
+ UI/UX Screens (12%) × 0.15
+ Security Model (0%) × 0.15
+ Third-Party (0%) × 0.05
+ Performance (0%) × 0.05
+ Deployment (0%) × 0.05
+ Testing (0%) × 0.10
```

**Glen's Bar:** Must reach **90-95%** before spec generation.

---

## When Specs Are Ready

### The 90% Threshold

Specifications are ready for implementation when:

1. **Overall Readiness** ≥ 90%
2. **All Critical Categories** ≥ 90%
   - Business Requirements
   - Database Architecture
   - API Design
   - Security Model
   - Testing Strategy
3. **No Unresolved Contradictions**

### What Happens at 90%+

```
ARCHITECT: "Congratulations! Your specification has reached 92%
            readiness. All critical categories are complete with
            high confidence scores.

            I'm ready to generate your specification document.
            This will include:

            - Complete technical specification (30-50 pages)
            - Database schema with migrations
            - API endpoint documentation
            - UI screen mockups and workflows
            - Security implementation guide
            - Testing strategy and E2E test generation
            - Deployment checklist

            Generate specification now?"

YOU: "Yes, generate it."

ARCHITECT: [Generates comprehensive spec in 30-60 seconds]

            "Specification complete! Creating GitHub issue and
             starting agent implementation..."
```

### Specification Output

The generated specification includes:

**1. Executive Summary**
- Project overview
- Target users and problem
- Core features
- Success metrics

**2. Technical Architecture**
- System design diagram
- Component breakdown
- Data flow
- Technology stack

**3. Database Design**
- Entity-relationship diagram
- Table schemas
- Indexes and constraints
- Migration scripts

**4. API Documentation**
- All endpoints
- Request/response schemas
- Authentication
- Error codes

**5. UI/UX Screens**
- Wireframes
- User workflows
- Responsive design notes

**6. Security Specification**
- Authentication flow
- Authorization rules
- Data encryption
- Compliance requirements

**7. Testing Strategy**
- Unit test requirements
- Integration test scenarios
- E2E test patterns (auto-generated)

**8. Deployment Guide**
- Infrastructure setup
- Environment variables
- CI/CD pipeline
- Monitoring and alerting

---

## Troubleshooting Common Issues

### Issue 1: Architect Asks Same Question Twice

**Symptom:**
```
ARCHITECT: "What database will you use?"
YOU: "PostgreSQL"
[Later in session]
ARCHITECT: "What database will you use?"
```

**Cause:** Database not updating category state properly

**Solution:**
1. Check browser console for errors
2. Refresh the page (state is persisted)
3. If persists, report bug with session ID

### Issue 2: Readiness Score Stuck Below 90%

**Symptom:** Answered all questions but readiness won't reach 90%

**Possible Causes:**

**A. Vague Answers** (low specificity score)
```
❌ BAD: "Solo developers" (15 chars)
✅ GOOD: "Individual knowledge workers including developers,
         researchers, and students who collect 100-1000+
         bookmarks and need organized search" (150 chars)
```

**B. Contradictions** (low consistency score)
```
Turn 5: "Target users are solo developers"
Turn 12: "We need team collaboration features"
→ Contradiction detected, architect will ask you to clarify
```

**C. Missing Subtopics** (low coverage score)
```
Database Architecture
├─ ✅ Data models
├─ ✅ Relationships
├─ ✅ Indexes
├─ ❌ Validation rules (missing)
└─ ❌ Migration strategy (missing)
```

**Solution:** Review "Missing Items" in category breakdown

### Issue 3: Session Doesn't Resume Properly

**Symptom:** Architect forgets context or starts from beginning

**Cause:** Session state corruption

**Solution:**
1. Check "Recent Sessions" list for duplicate entries
2. Use the most recent session
3. If corrupted, start new session and paste spec so far

### Issue 4: Architect Keeps Asking for More Detail

**Symptom:** Category shows 85-89% for long time

**Cause:** Just below the 90% threshold - needs slightly more detail

**Solution:**
```
ARCHITECT: "Your API Design is at 89% confidence. To reach 90%,
            I need more detail on error handling. What HTTP status
            codes will you use for validation errors, authentication
            failures, and server errors?"

YOU: "400 for validation errors with field-level error messages,
      401 for unauthenticated requests, 403 for unauthorized
      access, 500 for server errors with sanitized messages for
      security."
```

### Issue 5: Contradictions Won't Resolve

**Symptom:** Consistency score low even after clarifying

**Cause:** Contradiction marked but not resolved in database

**Solution:**
```
YOU: "Earlier I said X, but I actually meant Y. Use Y."

ARCHITECT: "Got it, I'll use Y. Marking the contradiction as
            resolved."
```

If architect doesn't mark as resolved, manually report bug.

---

## Best Practices

### 1. Give Detailed Answers

**Instead of:**
```
"Individual developers"
"Need CRUD operations"
"Use PostgreSQL"
```

**Do this:**
```
"Individual knowledge workers including developers, researchers,
 and students who collect 100-1000+ bookmarks for research and
 reference. They need better organization than browser bookmarks
 but don't want enterprise complexity."

"Users need to create bookmarks with title, URL, tags, and notes.
 They should be able to update any field, delete bookmarks, and
 bulk operations for efficiency. Search must be fast (< 100ms)
 across all fields."

"PostgreSQL database because we need full-text search, JSONB for
 flexible metadata, and strong consistency. Expected 50-100 users
 in first year, scaling to 1000+ users. Each user has 100-1000
 bookmarks, so ~100K records at scale."
```

### 2. Be Specific About Numbers

Always include:
- **User count:** "50-100 users in first year"
- **Data size:** "100-1000 bookmarks per user"
- **Performance:** "Search results in < 100ms"
- **Capacity:** "Support 10 concurrent users initially"

### 3. Don't Guess - Say "I Don't Know"

The architect can help you figure it out:

```
ARCHITECT: "What authentication method do you prefer?"

YOU: "I don't know. What do you recommend for a bookmark manager?"

ARCHITECT: "For a bookmark manager with individual users, I recommend
            JWT tokens. Here's why: [explains trade-offs]. Does that
            work for you?"

YOU: "Yes, JWT sounds good."
```

### 4. Pause and Resume Freely

Don't try to complete everything in one session:

- **Session 1 (Day 1):** Business requirements, database architecture
- **Session 2 (Day 3):** API design, security model
- **Session 3 (Day 7):** UI/UX screens, testing strategy
- **Session 4 (Day 10):** Review and finalize

The architect will maintain perfect context across all sessions.

### 5. Review Progress Regularly

Check category breakdown to see what's missing:

```
API Design: 78% (In Progress)
├─ Missing Items:
│  ├─ 2 questions unanswered
│  ├─ Error handling subtopic not covered
│  └─ Rate limiting not discussed
└─ Suggested Questions:
   ├─ How will you handle API errors?
   ├─ Do you need rate limiting?
   └─ Will you version your API?
```

### 6. Resolve Contradictions Immediately

When architect detects contradiction:

```
ARCHITECT: "I notice you said solo users earlier, but now you're
            talking about team collaboration. Which is correct for v1?"

YOU: "Solo users for v1. Team collaboration is v2. Focus on solo
      users now."
```

### 7. Use Voice for Natural Flow

Voice is faster and more natural than typing:

- **Voice:** ~150 words/minute
- **Typing:** ~40 words/minute

**Voice example:**
```
[Click microphone]

"Okay, so for authentication, I want users to sign up with email
 and password. Password needs to be at least 8 characters with
 uppercase, lowercase, and numbers. Store passwords with bcrypt
 hashing. After login, issue a JWT token that expires in 7 days.
 Users can have multiple active sessions. No social login for v1."

[~15 seconds of speaking = 45 words typed = 60+ seconds saved]
```

---

## Advanced Features

### Session Branching (Future)

Explore alternative architectures:

```
ARCHITECT: "Would you like to explore an alternative database design?"

YOU: "Yes, create a branch."

[Architect forks session]

Branch A: PostgreSQL with normalized tables
Branch B: MongoDB with denormalized documents

[Compare side-by-side, merge preferred approach]
```

### Collaborative Sessions (Future)

Multiple team members in one session:

```
[Alice, Bob, and Carol join session]

ALICE: "I think PostgreSQL is better for this."
BOB: "I prefer MongoDB for flexibility."
CAROL: "Let's go with PostgreSQL for strong consistency."

ARCHITECT: "Consensus reached: PostgreSQL. Recording decision."
```

### Custom Coverage Templates (Future)

Define your own categories:

```yaml
coverage:
  business_requirements: [standard]
  database_architecture: [standard]
  api_design: [standard]
  mobile_app_design:  # Custom category
    required_questions:
      - "iOS, Android, or both?"
      - "React Native, Flutter, or native?"
      - "Offline mode required?"
    subtopics:
      - push_notifications
      - app_store_guidelines
      - mobile_auth_flow
```

---

## Summary

**Key Takeaways:**

1. **Multi-Session by Design** - Sentra's architect is built for multi-day, multi-week conversations
2. **Perfect Memory** - Never re-asks questions, maintains full context
3. **Objective Quality** - 90%+ confidence score = Fortune 500 spec quality
4. **User Choice** - Control recap detail when resuming
5. **Visual Progress** - Always know what's complete and what's missing

**Next Steps:**

1. Start your first architect session
2. Answer questions in natural language
3. Pause and resume across multiple sessions
4. Watch progress indicators climb to 90%+
5. Generate Fortune 500-quality specification
6. Let AI agents implement while you review

**Questions?**

- See API documentation: `/docs/api/ARCHITECT-API.md`
- Check troubleshooting: This guide (Troubleshooting section)
- Report bugs: GitHub Issues with `architect` label

---

**Created by Glen Barnhardt with the help of Claude Code**
**Last Updated:** 2025-11-23
