# In-App PR Review & Approval

**Status:** 💬 Approved Design (Not Yet Implemented)

**Last Updated:** 2025-11-13

**Owner:** Glen Barnhardt

---

## Overview

Enable users to review and approve pull requests entirely within Sentra, without opening GitHub in a browser. View diffs, check test results, and merge PRs with one click.

**Vision:** Reduce PR workflow from 7 steps across 3 apps to 2 clicks in Sentra.

---

## User Problem

### Current Workflow (GitHub Browser)

**Time:** 3-5 minutes per PR

**Steps:**
1. Agent creates PR on GitHub
2. User receives email notification
3. User opens email
4. User clicks link to GitHub
5. User waits for page to load
6. User reviews diff across multiple files
7. User scrolls through checks
8. User clicks "Approve"
9. User clicks "Merge pull request"
10. User clicks "Confirm merge"
11. User returns to Sentra

**Pain Points:**
- Context switching (Sentra → Email → Browser → Sentra)
- GitHub UI is cluttered, slow
- Hard to see full picture of changes
- Must wait for page loads
- Can't stay in flow

### Planned Workflow (In-App)

**Time:** 30 seconds per PR

**Steps:**
1. Agent creates PR
2. Sentra voice notification: "PR ready for review"
3. User clicks [Review & Approve] in dashboard
4. User reviews diff inline
5. User clicks [Approve & Merge]
6. Done, stays in Sentra

**Benefits:**
- Zero context switching
- Faster (no page loads)
- Cleaner UI (only what matters)
- Stay in flow

---

## User Interface

### Entry Points

**1. Git Tab in Drill-Down Panel**

```
┌─────────────────────────────────────────┐
│  Git                                    │
├─────────────────────────────────────────┤
│  Pull Requests:                         │
│  ┌─────────────────────────────────────┐│
│  │ #42 Implement voice queue           ││
│  │ Status: ● Open                      ││
│  │ Checks: ✅ All passing              ││
│  │                                     ││
│  │ [Review & Approve]                  ││  ← Click here
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

**2. Voice Notification**

```
Sentra (speaking): "Pull request #42 is ready for review in Sentra project"

[Toast notification appears]
┌─────────────────────────────────────────┐
│ PR #42 Ready for Review                 │
│ Sentra: Implement voice queue           │
│                                         │
│ [Review Now]  [Dismiss]                 │
└─────────────────────────────────────────┘
```

**3. Activity Feed**

```
Recent Activity:
┌─────────────────────────────────────────┐
│ [14:35:42] Sentra                       │
│ ✅ PR #42 ready for review              │
│    [Review & Approve]                   │
└─────────────────────────────────────────┘
```

### PR Review Modal

**Trigger:** Click any "Review & Approve" button

**Design:** Full-screen modal with tabs

```
┌───────────────────────────────────────────────────────────────┐
│  Pull Request #42: Implement voice queue system          [×]  │
├───────────────────────────────────────────────────────────────┤
│  [Conversation] [Files Changed (3)] [Checks]                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Files Changed:                                               │
│                                                               │
│  ├─ src/                                                      │
│  │  ├─ services/                                             │
│  │  │  └─ voice-queue.ts         (+42 -8)    [Expand]       │
│  │  └─ store/                                                │
│  │     └─ voice-store.ts         (+12 -2)    [Expand]       │
│  └─ tests/                                                    │
│     └─ voice-queue.test.ts       (+18 -0)    [Expand]       │
│                                                               │
│  ┌─ src/services/voice-queue.ts ────────────────────────┐   │
│  │                                                        │   │
│  │  1  import { VoiceMessage } from '@/types'            │   │
│  │  2                                                     │   │
│  │  3 +export class VoiceQueueService {                  │   │
│  │  4 +  private queue: VoiceMessage[] = []              │   │
│  │  5 +  private processing = false                      │   │
│  │  6 +                                                   │   │
│  │  7 +  enqueue(message: VoiceMessage): void {          │   │
│  │  8 +    this.queue.push(message)                      │   │
│  │  9 +    this.processQueue()                           │   │
│  │ 10 +  }                                                │   │
│  │ 11 +                                                   │   │
│  │ 12 +  dequeue(): VoiceMessage | null {                │   │
│  │ 13 +    return this.queue.shift() ?? null             │   │
│  │ 14 +  }                                                │   │
│  │ 15 +                                                   │   │
│  │ 16 +  private async processQueue(): Promise<void> {   │   │
│  │ 17 +    if (this.processing) return                   │   │
│  │ 18 +                                                   │   │
│  │ 19 +    this.processing = true                        │   │
│  │ 20 +    while (this.queue.length > 0) {               │   │
│  │ 21 +      const message = this.dequeue()              │   │
│  │ 22 +      if (message) {                              │   │
│  │ 23 +        await this.speak(message)                 │   │
│  │ 24 +      }                                            │   │
│  │ 25 +    }                                              │   │
│  │ 26 +    this.processing = false                       │   │
│  │ 27 +  }                                                │   │
│  │ 28 +}                                                  │   │
│  │                                                        │   │
│  │  [View Full File]                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  Checks: ✅ All passing                                       │
│  - Build: ✅ Success (2m 14s)                                 │
│  - Tests: ✅ 24 passed, 0 failed                              │
│  - Lint: ✅ No issues                                         │
│  - Type Check: ✅ No errors                                   │
│                                                               │
│  [Approve & Merge]  [Request Changes]  [Comment]  [Close]    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Tab: Conversation

Shows PR description and comments (if any):

```
┌───────────────────────────────────────────────────┐
│  Description                                      │
│                                                   │
│  Implements voice queue system to prevent         │
│  multiple projects from speaking simultaneously.  │
│                                                   │
│  Changes:                                         │
│  - Added VoiceQueueService                        │
│  - Integrated with voice store                    │
│  - Added tests                                    │
│                                                   │
│  Test Plan:                                       │
│  ✅ Unit tests for queue operations               │
│  ✅ Integration tests for multi-project scenarios │
│                                                   │
│  🤖 Generated with Claude Code                     │
│  Co-Authored-By: Claude <noreply@anthropic.com>  │
│                                                   │
├───────────────────────────────────────────────────┤
│  Comments (0)                                     │
│                                                   │
│  No comments yet.                                 │
│                                                   │
│  [Add Comment]                                    │
└───────────────────────────────────────────────────┘
```

### Tab: Files Changed

Shows file tree + inline diff viewer (shown above)

**Features:**
- Expandable file tree
- Syntax highlighting in diffs
- Green (+) for additions, red (-) for deletions
- Line numbers
- [View Full File] button opens full file viewer
- Collapsible diff sections

### Tab: Checks

Shows CI/CD status:

```
┌───────────────────────────────────────────────────┐
│  Checks                                           │
│                                                   │
│  All checks passed                                │
│                                                   │
│  ✅ Build                                         │
│     Duration: 2m 14s                              │
│     [View Logs]                                   │
│                                                   │
│  ✅ Tests                                         │
│     24 passed, 0 failed                           │
│     Coverage: 87%                                 │
│     [View Details]                                │
│                                                   │
│  ✅ Lint                                          │
│     0 errors, 0 warnings                          │
│     [View Report]                                 │
│                                                   │
│  ✅ Type Check                                    │
│     0 errors                                      │
│     [View Output]                                 │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Implementation

### GitHub API Integration

**Service Layer:**

```typescript
// src/services/github-api.ts
import { Octokit } from '@octokit/rest'

export class GitHubAPIService {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  async getPullRequest(owner: string, repo: string, number: number) {
    const { data: pr } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: number
    })

    return pr
  }

  async getPullRequestFiles(owner: string, repo: string, number: number) {
    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: number
    })

    return files
  }

  async getCheckRuns(owner: string, repo: string, ref: string) {
    const { data } = await this.octokit.checks.listForRef({
      owner,
      repo,
      ref
    })

    return data.check_runs
  }

  async approvePullRequest(owner: string, repo: string, number: number) {
    await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: number,
      event: 'APPROVE',
      body: 'Approved via Sentra'
    })
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    number: number,
    method: 'merge' | 'squash' | 'rebase' = 'squash'
  ) {
    const { data } = await this.octokit.pulls.merge({
      owner,
      repo,
      pull_number: number,
      merge_method: method
    })

    return data
  }

  async addComment(
    owner: string,
    repo: string,
    number: number,
    body: string
  ) {
    await this.octokit.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body
    })
  }

  async closePullRequest(owner: string, repo: string, number: number) {
    await this.octokit.pulls.update({
      owner,
      repo,
      pull_number: number,
      state: 'closed'
    })
  }
}
```

### Frontend Component

```typescript
// src/components/PRReviewModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { DiffViewer } from './DiffViewer'
import { ChecksDisplay } from './ChecksDisplay'

interface PRReviewModalProps {
  owner: string
  repo: string
  prNumber: number
  onClose: () => void
}

export function PRReviewModal({
  owner,
  repo,
  prNumber,
  onClose
}: PRReviewModalProps) {
  const [pr, setPR] = useState(null)
  const [files, setFiles] = useState([])
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('files')

  useEffect(() => {
    loadPRData()
  }, [owner, repo, prNumber])

  const loadPRData = async () => {
    setLoading(true)

    try {
      const [prData, filesData, checksData] = await Promise.all([
        invoke('github_get_pr', { owner, repo, prNumber }),
        invoke('github_get_pr_files', { owner, repo, prNumber }),
        invoke('github_get_checks', { owner, repo, ref: pr.head.ref })
      ])

      setPR(prData)
      setFiles(filesData)
      setChecks(checksData)
    } catch (error) {
      console.error('Failed to load PR:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAndMerge = async () => {
    try {
      // Approve
      await invoke('github_approve_pr', { owner, repo, prNumber })

      // Merge
      await invoke('github_merge_pr', {
        owner,
        repo,
        prNumber,
        method: 'squash'
      })

      // Show success
      toast.success('PR merged successfully!')
      onClose()
    } catch (error) {
      toast.error('Failed to merge PR: ' + error.message)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Dialog open onClose={onClose} fullScreen>
      <DialogTitle>
        Pull Request #{prNumber}: {pr.title}
      </DialogTitle>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="Conversation" value="conversation" />
        <Tab label={`Files Changed (${files.length})`} value="files" />
        <Tab label="Checks" value="checks" />
      </Tabs>

      <DialogContent>
        {activeTab === 'conversation' && (
          <ConversationTab pr={pr} />
        )}

        {activeTab === 'files' && (
          <FilesChangedTab files={files} />
        )}

        {activeTab === 'checks' && (
          <ChecksDisplay checks={checks} />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleAddComment}>Comment</Button>
        <Button onClick={handleRequestChanges}>Request Changes</Button>
        <Button
          onClick={handleApproveAndMerge}
          variant="primary"
          disabled={checks.some(c => c.status !== 'success')}
        >
          Approve & Merge
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

### Diff Viewer Component

```typescript
// src/components/DiffViewer.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface DiffViewerProps {
  file: {
    filename: string
    patch: string
    additions: number
    deletions: number
  }
}

export function DiffViewer({ file }: DiffViewerProps) {
  const lines = file.patch.split('\n')

  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span className="filename">{file.filename}</span>
        <span className="stats">
          <span className="additions">+{file.additions}</span>
          {' '}
          <span className="deletions">-{file.deletions}</span>
        </span>
      </div>

      <div className="diff-content">
        {lines.map((line, i) => {
          const type = line[0] === '+' ? 'addition' :
                      line[0] === '-' ? 'deletion' :
                      line[0] === '@' ? 'hunk' : 'context'

          return (
            <div key={i} className={`diff-line ${type}`}>
              <span className="line-number">{i + 1}</span>
              <SyntaxHighlighter
                language="typescript"
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '0 8px' }}
              >
                {line.slice(1)} {/* Remove +/- prefix */}
              </SyntaxHighlighter>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Tauri Commands

```rust
// src-tauri/src/commands/github.rs
use octocrab::Octocrab;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequest {
    pub number: u64,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub head: Branch,
    pub base: Branch,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Branch {
    pub ref_field: String,
    pub sha: String,
}

#[tauri::command]
pub async fn github_get_pr(
    owner: String,
    repo: String,
    pr_number: u64
) -> Result<PullRequest, String> {
    let token = get_github_token()?;
    let octocrab = Octocrab::builder().personal_token(token).build()
        .map_err(|e| e.to_string())?;

    let pr = octocrab
        .pulls(&owner, &repo)
        .get(pr_number)
        .await
        .map_err(|e| e.to_string())?;

    Ok(PullRequest {
        number: pr.number,
        title: pr.title.unwrap_or_default(),
        body: pr.body,
        state: pr.state.unwrap().to_string(),
        head: Branch {
            ref_field: pr.head.ref_field,
            sha: pr.head.sha
        },
        base: Branch {
            ref_field: pr.base.ref_field,
            sha: pr.base.sha
        }
    })
}

#[tauri::command]
pub async fn github_get_pr_files(
    owner: String,
    repo: String,
    pr_number: u64
) -> Result<Vec<PRFile>, String> {
    let token = get_github_token()?;
    let octocrab = Octocrab::builder().personal_token(token).build()
        .map_err(|e| e.to_string())?;

    let files = octocrab
        .pulls(&owner, &repo)
        .list_files(pr_number)
        .await
        .map_err(|e| e.to_string())?;

    Ok(files.items.into_iter().map(|f| PRFile {
        filename: f.filename,
        patch: f.patch.unwrap_or_default(),
        additions: f.additions,
        deletions: f.deletions,
    }).collect())
}

#[tauri::command]
pub async fn github_approve_pr(
    owner: String,
    repo: String,
    pr_number: u64
) -> Result<(), String> {
    let token = get_github_token()?;
    let octocrab = Octocrab::builder().personal_token(token).build()
        .map_err(|e| e.to_string())?;

    octocrab
        .pulls(&owner, &repo)
        .create_review(pr_number, octocrab::models::pulls::ReviewEvent::Approve)
        .body("Approved via Sentra")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn github_merge_pr(
    owner: String,
    repo: String,
    pr_number: u64,
    method: String
) -> Result<(), String> {
    let token = get_github_token()?;
    let octocrab = Octocrab::builder().personal_token(token).build()
        .map_err(|e| e.to_string())?;

    let merge_method = match method.as_str() {
        "squash" => octocrab::models::pulls::MergeMethod::Squash,
        "merge" => octocrab::models::pulls::MergeMethod::Merge,
        "rebase" => octocrab::models::pulls::MergeMethod::Rebase,
        _ => return Err("Invalid merge method".to_string())
    };

    octocrab
        .pulls(&owner, &repo)
        .merge(pr_number)
        .method(merge_method)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn get_github_token() -> Result<String, String> {
    // Get from Tauri secure storage
    std::env::var("GITHUB_TOKEN")
        .map_err(|_| "GitHub token not configured".to_string())
}
```

---

## User Workflows

### Happy Path

1. Agent completes task
2. Agent creates PR on GitHub
3. Sentra detects new PR (polling GitHub API every 30s)
4. Voice notification: "PR #42 ready for review"
5. User clicks [Review & Approve] in Git tab
6. Modal opens, showing diff
7. User reviews changes (looks good!)
8. User clicks [Approve & Merge]
9. PR merged to main
10. Modal closes
11. User continues working

**Time:** 30 seconds

### Request Changes Path

1-6. Same as happy path
7. User sees issue in code
8. User clicks [Request Changes]
9. Modal opens: "What changes are needed?"
10. User types: "Please add error handling for null case"
11. User clicks [Submit]
12. Comment posted to PR
13. Agent receives notification
14. Agent fixes issue, pushes new commit
15. User reviews again

### Comment-Only Path

1-6. Same as happy path
7. User wants to add note (but not block merge)
8. User clicks [Comment]
9. User types: "Looks good! Consider extracting this to a util function."
10. User clicks [Submit]
11. User clicks [Approve & Merge]
12. PR merged with comment

---

## Authentication

### GitHub Token Storage

**Secure Storage (Tauri):**
```rust
// Store token securely in OS keychain
use tauri_plugin_keyring::KeyringExt;

#[tauri::command]
pub async fn save_github_token(token: String) -> Result<(), String> {
    let keyring = app.keyring();
    keyring.set("sentra.github_token", &token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_github_token() -> Result<String, String> {
    let keyring = app.keyring();
    keyring.get("sentra.github_token")
        .map_err(|_| "No GitHub token found".to_string())
}
```

**Settings UI:**
```
Settings > GitHub Integration

GitHub Personal Access Token:
┌─────────────────────────────────────────┐
│ ghp_••••••••••••••••••••••••••••••••••  │
└─────────────────────────────────────────┘

Required Scopes: repo, workflow

[How to create token]  [Save]
```

### Token Scopes Required

```
repo            - Full control of private repositories
  repo:status   - Access commit status
  repo_deployment - Access deployment status
  public_repo   - Access public repositories
workflow        - Update GitHub Action workflows
```

---

## Performance

**Target Metrics:**
- Modal open: < 500ms
- Diff rendering: < 1s for 50 files
- Approve + merge: < 2s
- Checks refresh: < 1s

**Optimization:**
- Cache PR data (refresh every 30s)
- Lazy load file diffs (only render visible)
- Virtualize file list (for 100+ files)
- Debounce API calls

---

## Error Handling

**Network Errors:**
```
Failed to load PR data.
[Retry]  [Open on GitHub]
```

**Permission Errors:**
```
You don't have permission to merge this PR.
Ask a repo admin to grant you write access.

[Open on GitHub]
```

**Merge Conflicts:**
```
This PR has merge conflicts.
Please resolve conflicts before merging.

[View Conflicts on GitHub]
```

**Failed Checks:**
```
Some checks are failing:
- Tests: 2 failed

You can still merge, but it's not recommended.

[Force Merge]  [Wait for Fixes]
```

---

## Testing

### Unit Tests

```typescript
// tests/unit/github-api.test.ts
import { GitHubAPIService } from '@/services/github-api'

test('fetches PR data', async () => {
  const api = new GitHubAPIService(TEST_TOKEN)
  const pr = await api.getPullRequest('owner', 'repo', 42)

  expect(pr.number).toBe(42)
  expect(pr.title).toBeDefined()
})

test('approves PR', async () => {
  const api = new GitHubAPIService(TEST_TOKEN)
  await api.approvePullRequest('owner', 'repo', 42)

  // Verify review created
  const reviews = await api.getReviews('owner', 'repo', 42)
  expect(reviews[0].state).toBe('APPROVED')
})
```

### Integration Tests

```typescript
// tests/integration/pr-review.test.ts
test('full PR review workflow', async () => {
  // Create test PR
  const pr = await createTestPR()

  // Load in Sentra
  const prData = await invoke('github_get_pr', {
    owner: 'test',
    repo: 'test-repo',
    prNumber: pr.number
  })

  expect(prData.title).toBe('Test PR')

  // Approve
  await invoke('github_approve_pr', {
    owner: 'test',
    repo: 'test-repo',
    prNumber: pr.number
  })

  // Merge
  await invoke('github_merge_pr', {
    owner: 'test',
    repo: 'test-repo',
    prNumber: pr.number,
    method: 'squash'
  })

  // Verify merged
  const updated = await getPR(pr.number)
  expect(updated.state).toBe('closed')
  expect(updated.merged).toBe(true)
})
```

### E2E Tests

```typescript
// tests/e2e/pr-review.spec.ts
test('review and merge PR from dashboard', async ({ page }) => {
  await page.goto('/')

  // Open project detail
  await page.click('[data-testid="project-sentra"] [data-testid="view"]')

  // Go to Git tab
  await page.click('[data-testid="tab-git"]')

  // Open PR review
  await page.click('[data-testid="pr-42-review"]')

  // Modal should open
  await expect(page.getByText('Pull Request #42')).toBeVisible()

  // View files
  await page.click('[data-testid="tab-files"]')
  await expect(page.getByText('voice-queue.ts')).toBeVisible()

  // View checks
  await page.click('[data-testid="tab-checks"]')
  await expect(page.getByText('All checks passed')).toBeVisible()

  // Approve and merge
  await page.click('[data-testid="approve-merge"]')

  // Success message
  await expect(page.getByText('PR merged successfully')).toBeVisible()
})
```

---

## Accessibility

**Keyboard Navigation:**
- Tab through files
- Enter to expand diff
- Arrow keys to scroll
- Escape to close modal

**Screen Reader:**
```tsx
<div role="dialog" aria-label="Pull Request Review">
  <h2>Pull Request #{number}: {title}</h2>

  <div role="tablist">
    <button role="tab" aria-selected={active === 'files'}>
      Files Changed ({fileCount})
    </button>
  </div>

  <div role="tabpanel" aria-label="Files Changed">
    {/* Diff content */}
  </div>
</div>
```

---

## Future Enhancements

### Inline Comments

Comment on specific lines:
```
[Diff viewer]
Line 42: await this.speak(message)
         ^ [Add comment]

"Consider adding error handling here"
```

### Suggested Changes

Propose code changes inline:
```
- await this.speak(message)
+ try {
+   await this.speak(message)
+ } catch (error) {
+   console.error('Speech failed:', error)
+ }

[Suggest Change]
```

### Review Threads

Track conversation threads:
```
Thread: Error handling needed
  You: Please add error handling
  Agent: Added try/catch block
  You: Looks good!
  [Resolve Thread]
```

---

## Related Documentation

- [/docs/roadmap/dashboard-redesign.md](../roadmap/dashboard-redesign.md) - Dashboard design
- [/docs/features/dashboard.md](./dashboard.md) - Dashboard overview
- [/docs/roadmap/observability.md](../roadmap/observability.md) - Observability vision
- [/docs/roadmap/unfinished-features.md](../roadmap/unfinished-features.md) - Implementation status

---

*Designed by Glen Barnhardt with help from Claude Code*
*Last Updated: 2025-11-13*
