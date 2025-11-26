# Confidence Scoring Algorithm

## Overview

This document defines the confidence scoring algorithm used to determine if an architect session category is ready for specification generation. The algorithm must be objective, auditable, and provide clear feedback on what's missing.

## Design Goals

1. **Objective** - No subjective judgment; purely based on measurable criteria
2. **Auditable** - Show exactly how the score was calculated
3. **Actionable** - Clearly indicate what's needed to improve the score
4. **Conservative** - Better to ask for more detail than generate incomplete specs
5. **Glen's Bar** - Must reach 90-95% confidence before spec generation

## Confidence Score Formula

The confidence score is calculated as a weighted average of four sub-scores:

```python
confidence = (
    completeness * 0.4 +   # Questions answered / total questions
    specificity * 0.2 +    # Average answer length / target length
    consistency * 0.2 +    # 1 - (contradictions / total statements)
    coverage * 0.2         # Covered subtopics / required subtopics
)

# All values are 0-100 scale
# Final confidence is rounded to nearest integer
```

### Why These Weights?

- **Completeness (40%)** - Most important: did we ask all the questions?
- **Specificity (20%)** - Answers must be detailed, not vague
- **Consistency (20%)** - No contradictions or changes in requirements
- **Coverage (20%)** - All subtopics within category must be addressed

## Sub-Score Calculations

### 1. Completeness Score (0-100)

**Measures:** What percentage of required questions have been answered?

**Formula:**

```python
completeness = (questions_answered / total_required_questions) * 100
```

**Example:**

```yaml
# coverage-checklist.yml
business_requirements:
  required_questions:
    - Who is your target user?
    - What problem does this solve?
    - What are the core features?
    - What is explicitly out of scope?
    - What are your success metrics?
    # 5 total questions
```

If 4 out of 5 questions have been answered:

```python
completeness = (4 / 5) * 100 = 80
```

**Database Storage:**

```typescript
// architect_categories table
{
  category: 'business_requirements',
  questionsAsked: 5,      // Total questions asked
  questionsAnswered: 4,   // Questions with satisfactory answers
  // completeness = (4/5) * 100 = 80
}
```

**Edge Cases:**

- If category is `not_applicable`, completeness = 100
- If no required questions defined, completeness = 100 (shouldn't happen)
- Partially answered questions count as 0 (not 0.5)

### 2. Specificity Score (0-100)

**Measures:** Are answers detailed enough or just vague one-liners?

**Formula:**

```python
target_chars = 200  # Target average characters per answer

avg_answer_length = sum(answer.length for answer in answers) / len(answers)

specificity = min(100, (avg_answer_length / target_chars) * 100)
```

**Example:**

Answers:
1. "Individual developers and researchers" (37 chars)
2. "Helps organize bookmarks with tags and search" (47 chars)
3. "Need authentication, CRUD operations for bookmarks, tagging system, full-text search, and filtering by tags" (110 chars)
4. "Team collaboration, browser extension, mobile app" (50 chars)
5. "Active users per month, bookmarks created, search usage" (56 chars)

```python
avg_answer_length = (37 + 47 + 110 + 50 + 56) / 5 = 60 chars

specificity = min(100, (60 / 200) * 100) = 30
```

**Why 200 Characters?**

- Short answer (vague): 20-50 chars → "Solo developers"
- Medium answer (okay): 50-150 chars → "Individual developers and researchers who need to organize 100-1000 bookmarks with tags and search"
- Detailed answer (good): 150-400 chars → "Individual knowledge workers including developers, researchers, and students who collect large numbers of bookmarks (100-1000+) and need an organized system to find them later. Current tools like browser bookmarks are too basic, and enterprise tools are too complex."

**Database Storage:**

Store answer content in `architect_conversations`:

```typescript
{
  sessionId: 'session123',
  turnNumber: 5,
  role: 'user',
  content: 'Individual knowledge workers including...', // 200+ chars
  relatedCategory: 'business_requirements'
}
```

Calculate specificity on-the-fly by:
1. Finding all user turns related to category
2. Filtering for turns that answer questions (not "I don't know")
3. Calculating average length
4. Applying formula

**Edge Cases:**

- Very long answers (500+ chars) still cap at 100
- Non-answers ("I don't know", "Skip this") excluded from calculation
- Code blocks in answers count toward length

### 3. Consistency Score (0-100)

**Measures:** Are there contradictions in requirements?

**Formula:**

```python
# Use Claude API to detect contradictions
contradictions = count_contradictions(all_statements_in_category)

total_statements = count_statements(all_statements_in_category)

consistency = max(0, (1 - (contradictions / total_statements)) * 100)
```

**Example:**

User statements:
1. "Target users are solo developers" (statement 1)
2. "We need team collaboration features" (statement 2) ← CONTRADICTION with #1
3. "Using PostgreSQL database" (statement 3)
4. "JWT authentication with 7-day expiration" (statement 4)
5. "Actually, let's use SQLite instead" (statement 5) ← CONTRADICTION with #3

```python
contradictions = 2
total_statements = 5

consistency = max(0, (1 - (2 / 5)) * 100) = 60
```

**Contradiction Detection Algorithm:**

Use Claude API with this prompt:

```typescript
const prompt = `
Analyze these statements for contradictions:

${statements.map((s, i) => `${i+1}. ${s}`).join('\n')}

Identify any contradicting statements. A contradiction is when:
- Two statements make mutually exclusive claims
- A later statement reverses an earlier decision
- Requirements conflict with each other

Output JSON:
{
  "contradictions": [
    {
      "statement1_index": 1,
      "statement2_index": 2,
      "explanation": "Solo users conflicts with team features"
    }
  ]
}

If no contradictions, return empty array.
`;
```

**Database Storage:**

Track contradictions in `architect_categories.metadata`:

```typescript
{
  category: 'business_requirements',
  metadata: JSON.stringify({
    contradictions: [
      {
        turn1: 5,
        turn2: 12,
        explanation: 'Solo users vs team features',
        resolved: false
      }
    ]
  })
}
```

**Handling Contradictions:**

When contradiction detected:
1. Architect asks: "I noticed you said X earlier, but now Y. Which is correct?"
2. User clarifies
3. Mark contradiction as `resolved: true`
4. Resolved contradictions don't penalize score

**Edge Cases:**

- If only 1-2 statements, consistency = 100 (not enough data for contradictions)
- Resolved contradictions excluded from calculation
- Evolution of requirements (adding detail) is NOT a contradiction

### 4. Coverage Score (0-100)

**Measures:** Have all subtopics within the category been addressed?

**Formula:**

```python
coverage = (covered_subtopics / required_subtopics) * 100
```

**Example:**

```yaml
# coverage-checklist.yml
database_architecture:
  required_subtopics:
    - data_models
    - relationships
    - indexes
    - validation_rules
    - migrations
    # 5 subtopics
```

If conversation covered:
- data_models ✓
- relationships ✓
- indexes ✓
- validation_rules ✗
- migrations ✗

```python
coverage = (3 / 5) * 100 = 60
```

**Subtopic Detection:**

Use keyword matching and Claude API:

```typescript
const detectSubtopics = async (
  conversations: Conversation[],
  requiredSubtopics: string[]
): Promise<string[]> => {
  const allContent = conversations.map(c => c.content).join('\n');

  const prompt = `
Analyze this conversation and identify which subtopics were discussed:

REQUIRED SUBTOPICS:
${requiredSubtopics.map((s, i) => `${i+1}. ${s}`).join('\n')}

CONVERSATION:
${allContent}

For each subtopic, determine if it was discussed in sufficient detail.

Output JSON:
{
  "covered": ["data_models", "relationships", "indexes"]
}
`;

  const response = await claude.complete(prompt);
  return response.covered;
};
```

**Database Storage:**

```typescript
{
  category: 'database_architecture',
  subtopicsCovered: JSON.stringify(['data_models', 'relationships', 'indexes'])
}
```

**Edge Cases:**

- If category has no required subtopics, coverage = 100
- Subtopic briefly mentioned but not detailed = not covered
- Subtopic marked as "not needed" = counted as covered

## Confidence Thresholds

### Status Mapping

```typescript
function getStatus(confidence: number): CategoryStatus {
  if (confidence >= 90) return 'complete';
  if (confidence >= 70) return 'partial';
  return 'incomplete';
}
```

### Visual Indicators

```
90-100%: ✅ Complete (Green)
70-89%:  🟡 In Progress (Yellow)
0-69%:   ⚠️ Needs Work (Red)
```

### Readiness Score

Overall session readiness is the weighted average of all category confidences:

```typescript
function calculateReadiness(categories: Category[]): number {
  const weights: Record<string, number> = {
    business_requirements: 0.15,
    database_architecture: 0.15,
    api_design: 0.15,
    ui_ux_screens: 0.15,
    security_model: 0.15,
    third_party_integrations: 0.05,
    performance_requirements: 0.05,
    deployment_strategy: 0.05,
    testing_strategy: 0.10,
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const category of categories) {
    if (category.status === 'not_applicable') continue;

    const weight = weights[category.category] || 0.1;
    totalScore += category.confidence * weight;
    totalWeight += weight;
  }

  return Math.round(totalScore / totalWeight);
}
```

**Glen's Bar:** Readiness must be **90-95%** before spec generation.

## Calculation Examples

### Example 1: Early Session (Low Confidence)

**Category:** `business_requirements`

**Data:**
- Questions answered: 2 / 5 = 40%
- Avg answer length: 45 chars
- Contradictions: 0 / 2 statements = 0%
- Subtopics covered: 1 / 5 = 20%

**Calculation:**

```python
completeness = 40
specificity = min(100, (45 / 200) * 100) = 22.5
consistency = max(0, (1 - 0) * 100) = 100
coverage = 20

confidence = (40 * 0.4) + (22.5 * 0.2) + (100 * 0.2) + (20 * 0.2)
           = 16 + 4.5 + 20 + 4
           = 44.5
           ≈ 45%
```

**Status:** ⚠️ Needs Work (Incomplete)

**What's Missing:**
- ⚠️ Only 2/5 questions answered (need 3 more)
- ⚠️ Answers too brief (avg 45 chars, target 200)
- ⚠️ Only 1/5 subtopics covered (need 4 more)
- ✅ No contradictions detected

### Example 2: Mid Session (Moderate Confidence)

**Category:** `database_architecture`

**Data:**
- Questions answered: 7 / 8 = 87.5%
- Avg answer length: 180 chars
- Contradictions: 0 / 12 statements = 0%
- Subtopics covered: 4 / 5 = 80%

**Calculation:**

```python
completeness = 87.5
specificity = min(100, (180 / 200) * 100) = 90
consistency = 100
coverage = 80

confidence = (87.5 * 0.4) + (90 * 0.2) + (100 * 0.2) + (80 * 0.2)
           = 35 + 18 + 20 + 16
           = 89%
```

**Status:** 🟡 In Progress (Partial)

**What's Missing:**
- ⚠️ 1 question still unanswered
- ⚠️ 1 subtopic not covered (migrations)
- ✅ Answers are detailed
- ✅ No contradictions

**To reach 90%:** Answer the last question or cover migrations subtopic.

### Example 3: Complete Session (High Confidence)

**Category:** `security_model`

**Data:**
- Questions answered: 8 / 8 = 100%
- Avg answer length: 220 chars
- Contradictions: 0 / 15 statements = 0%
- Subtopics covered: 6 / 6 = 100%

**Calculation:**

```python
completeness = 100
specificity = min(100, (220 / 200) * 100) = 100 (capped)
consistency = 100
coverage = 100

confidence = (100 * 0.4) + (100 * 0.2) + (100 * 0.2) + (100 * 0.2)
           = 40 + 20 + 20 + 20
           = 100%
```

**Status:** ✅ Complete

**Ready for spec generation!**

### Example 4: Session with Contradictions (Penalized)

**Category:** `business_requirements`

**Data:**
- Questions answered: 5 / 5 = 100%
- Avg answer length: 200 chars
- Contradictions: 2 / 10 statements = 20%
- Subtopics covered: 5 / 5 = 100%

**Calculation:**

```python
completeness = 100
specificity = 100
consistency = max(0, (1 - (2/10)) * 100) = 80
coverage = 100

confidence = (100 * 0.4) + (100 * 0.2) + (80 * 0.2) + (100 * 0.2)
           = 40 + 20 + 16 + 20
           = 96%
```

**Status:** ✅ Complete (but with warning)

**Issues:**
- ⚠️ 2 unresolved contradictions detected
- Should resolve contradictions before spec generation

**Architect Action:**
"I notice some contradictions in your requirements. Let's clarify..."

## Implementation

### TypeScript Function

```typescript
interface ConfidenceScoreResult {
  confidence: number;
  completeness: number;
  specificity: number;
  consistency: number;
  coverage: number;
  status: 'incomplete' | 'partial' | 'complete';
  missingItems: string[];
}

async function calculateCategoryConfidence(
  category: ArchitectCategory,
  conversations: ArchitectConversation[],
  requiredQuestions: string[],
  requiredSubtopics: string[]
): Promise<ConfidenceScoreResult> {
  // 1. Completeness
  const completeness = (category.questionsAnswered / requiredQuestions.length) * 100;

  // 2. Specificity
  const userAnswers = conversations.filter(
    c => c.role === 'user' && c.relatedCategory === category.category
  );
  const avgLength = userAnswers.reduce((sum, a) => sum + a.content.length, 0) / userAnswers.length;
  const specificity = Math.min(100, (avgLength / 200) * 100);

  // 3. Consistency
  const contradictions = await detectContradictions(userAnswers);
  const unresolvedCount = contradictions.filter(c => !c.resolved).length;
  const consistency = Math.max(0, (1 - (unresolvedCount / userAnswers.length)) * 100);

  // 4. Coverage
  const coveredSubtopics = JSON.parse(category.subtopicsCovered || '[]');
  const coverage = (coveredSubtopics.length / requiredSubtopics.length) * 100;

  // Final confidence
  const confidence = Math.round(
    completeness * 0.4 +
    specificity * 0.2 +
    consistency * 0.2 +
    coverage * 0.2
  );

  // Determine status
  const status = confidence >= 90 ? 'complete' : confidence >= 70 ? 'partial' : 'incomplete';

  // Generate missing items
  const missingItems: string[] = [];
  if (category.questionsAnswered < requiredQuestions.length) {
    missingItems.push(`${requiredQuestions.length - category.questionsAnswered} questions unanswered`);
  }
  if (avgLength < 200) {
    missingItems.push('Answers need more detail');
  }
  if (unresolvedCount > 0) {
    missingItems.push(`${unresolvedCount} contradictions to resolve`);
  }
  const uncoveredCount = requiredSubtopics.length - coveredSubtopics.length;
  if (uncoveredCount > 0) {
    missingItems.push(`${uncoveredCount} subtopics not covered`);
  }

  return {
    confidence,
    completeness,
    specificity,
    consistency,
    coverage,
    status,
    missingItems
  };
}
```

### Database Update

After each conversation turn, update category confidence:

```typescript
async function updateCategoryAfterTurn(
  sessionId: string,
  category: string,
  conversation: ArchitectConversation
) {
  // Load category data
  const categoryData = await db.query.architectCategories.findFirst({
    where: and(
      eq(architectCategories.sessionId, sessionId),
      eq(architectCategories.category, category)
    )
  });

  // Load all conversations for this category
  const conversations = await db.query.architectConversations.findMany({
    where: and(
      eq(architectConversations.sessionId, sessionId),
      eq(architectConversations.relatedCategory, category)
    )
  });

  // Load checklist
  const checklist = await loadCoverageChecklist();
  const requiredQuestions = checklist.coverage[category].required_questions;
  const requiredSubtopics = checklist.coverage[category].required_subtopics;

  // Calculate new confidence
  const result = await calculateCategoryConfidence(
    categoryData,
    conversations,
    requiredQuestions,
    requiredSubtopics
  );

  // Update database
  await db.update(architectCategories)
    .set({
      confidence: result.confidence,
      completion: result.completeness,
      status: result.status,
      missingItems: JSON.stringify(result.missingItems),
      updatedAt: new Date()
    })
    .where(eq(architectCategories.id, categoryData.id));
}
```

## Audit Trail

Every confidence calculation should be logged for debugging:

```typescript
interface ConfidenceAudit {
  sessionId: string;
  category: string;
  timestamp: Date;
  confidence: number;
  breakdown: {
    completeness: number;
    specificity: number;
    consistency: number;
    coverage: number;
  };
  factors: {
    questionsAnswered: number;
    totalQuestions: number;
    avgAnswerLength: number;
    contradictions: number;
    subtopicsCovered: number;
    totalSubtopics: number;
  };
}

// Store in database or logs
await db.insert(confidenceAudits).values(auditData);
```

## User-Facing Feedback

### Progress Display

```typescript
// CategoryProgress.tsx
<div className="category-card">
  <h3>Business Requirements</h3>

  <ProgressBar value={confidence} color={getColor(confidence)} />

  <div className="breakdown">
    <Metric label="Questions" value={`${questionsAnswered}/${total}`} />
    <Metric label="Detail" value={`${specificity}%`} />
    <Metric label="Coverage" value={`${coverage}%`} />
  </div>

  {missingItems.length > 0 && (
    <ul className="missing-items">
      {missingItems.map(item => (
        <li key={item}>⚠️ {item}</li>
      ))}
    </ul>
  )}
</div>
```

### Voice Feedback

When confidence is low:

```
"We've made good progress on business requirements, but I need a bit more detail.
You've answered 3 out of 5 questions, and we still need to discuss your success
metrics and out-of-scope features. Your current confidence score is 68%.
Let's aim for 90% before moving on."
```

When confidence reaches 90%:

```
"Excellent! We've fully covered business requirements with a 92% confidence score.
All questions answered, good detail level, and no contradictions. Ready to move
to the next category?"
```

## Testing

### Unit Tests

```typescript
describe('Confidence Scoring', () => {
  it('should calculate 100% for perfect category', () => {
    const result = calculateCategoryConfidence({
      questionsAnswered: 5,
      conversations: generateDetailedAnswers(5),
      contradictions: [],
      subtopicsCovered: ['all', 'five', 'topics']
    });

    expect(result.confidence).toBe(100);
    expect(result.status).toBe('complete');
  });

  it('should penalize vague answers', () => {
    const result = calculateCategoryConfidence({
      questionsAnswered: 5,
      conversations: generateVagueAnswers(5), // avg 30 chars
      contradictions: [],
      subtopicsCovered: ['all', 'five', 'topics']
    });

    // Specificity = (30/200)*100 = 15
    // confidence ≈ 100*0.4 + 15*0.2 + 100*0.2 + 100*0.2 = 83
    expect(result.confidence).toBeLessThan(90);
    expect(result.missingItems).toContain('Answers need more detail');
  });

  it('should penalize contradictions', () => {
    const result = calculateCategoryConfidence({
      questionsAnswered: 5,
      conversations: generateConflictingAnswers(5),
      contradictions: [{ resolved: false }, { resolved: false }],
      subtopicsCovered: ['all', 'five', 'topics']
    });

    expect(result.consistency).toBeLessThan(100);
    expect(result.missingItems).toContain('contradictions to resolve');
  });
});
```

---

**Status**: Ready for implementation
**Last Updated**: 2025-11-22
**Author**: Glen Barnhardt with help from Claude Code
