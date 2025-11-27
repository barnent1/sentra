# Git Integration Usage Examples

This document shows how to use the new Git integration Tauri commands in your React components.

## Overview

The Git integration provides three main commands:
1. `getGitLog` - Get recent commits
2. `getGitDiff` - Get file changes for a commit or unstaged changes
3. `getGitStatus` - Get current repository status

## TypeScript Types

All types are exported from `@/services/quetrex-api`:

```typescript
import {
  GitCommit,
  GitStatus,
  GitDiff,
  GitDiffFile,
  getGitLog,
  getGitDiff,
  getGitStatus
} from '@/services/quetrex-api';
```

## Example 1: Display Recent Commits

```tsx
import { useState, useEffect } from 'react';
import { getGitLog, GitCommit } from '@/services/quetrex-api';

export function CommitHistory({ projectPath }: { projectPath: string }) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommits() {
      try {
        setLoading(true);
        // Get last 10 commits
        const recentCommits = await getGitLog(projectPath, 10);
        setCommits(recentCommits);
      } catch (error) {
        console.error('Failed to load commits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCommits();
  }, [projectPath]);

  if (loading) return <div>Loading commits...</div>;

  return (
    <div className="commit-history">
      <h3>Recent Commits</h3>
      {commits.map((commit) => (
        <div key={commit.hash} className="commit-card">
          <div className="commit-header">
            <span className="commit-hash">{commit.shortHash}</span>
            <span className="commit-author">{commit.author}</span>
            <span className="commit-date">{commit.date}</span>
          </div>
          <div className="commit-message">{commit.message}</div>
        </div>
      ))}
    </div>
  );
}
```

## Example 2: Show Repository Status

```tsx
import { useState, useEffect } from 'react';
import { getGitStatus, GitStatus } from '@/services/quetrex-api';

export function RepoStatus({ projectPath }: { projectPath: string }) {
  const [status, setStatus] = useState<GitStatus | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const repoStatus = await getGitStatus(projectPath);
        setStatus(repoStatus);
      } catch (error) {
        console.error('Failed to load status:', error);
      }
    }

    loadStatus();

    // Refresh every 10 seconds
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, [projectPath]);

  if (!status) return <div>Loading status...</div>;

  return (
    <div className="repo-status">
      <h3>Git Status</h3>

      <div className="branch-info">
        <strong>Branch:</strong> {status.currentBranch}
        {status.ahead > 0 && <span> ↑{status.ahead}</span>}
        {status.behind > 0 && <span> ↓{status.behind}</span>}
      </div>

      {status.modifiedFiles.length > 0 && (
        <div className="modified-files">
          <strong>Modified:</strong>
          <ul>
            {status.modifiedFiles.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {status.stagedFiles.length > 0 && (
        <div className="staged-files">
          <strong>Staged:</strong>
          <ul>
            {status.stagedFiles.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {status.untrackedFiles.length > 0 && (
        <div className="untracked-files">
          <strong>Untracked:</strong>
          <ul>
            {status.untrackedFiles.map(file => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Example 3: Display Diff for a Commit

```tsx
import { useState, useEffect } from 'react';
import { getGitDiff, GitDiff } from '@/services/quetrex-api';

export function CommitDiff({
  projectPath,
  commitHash
}: {
  projectPath: string;
  commitHash?: string;
}) {
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDiff() {
      try {
        setLoading(true);
        // If commitHash is provided, show commit diff
        // Otherwise, show unstaged changes
        const diffData = await getGitDiff(projectPath, commitHash);
        setDiff(diffData);
      } catch (error) {
        console.error('Failed to load diff:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDiff();
  }, [projectPath, commitHash]);

  if (loading) return <div>Loading diff...</div>;
  if (!diff) return <div>No diff available</div>;

  return (
    <div className="commit-diff">
      <h3>
        {commitHash ? `Diff for ${commitHash.substring(0, 7)}` : 'Unstaged Changes'}
      </h3>

      <div className="diff-summary">
        <span className="additions">+{diff.totalAdditions}</span>
        <span className="deletions">-{diff.totalDeletions}</span>
        <span className="files">{diff.files.length} files changed</span>
      </div>

      <div className="file-changes">
        {diff.files.map((file, index) => (
          <div key={index} className={`file-change ${file.status}`}>
            <span className="file-path">{file.path}</span>
            <span className="file-stats">
              +{file.additions} -{file.deletions}
            </span>
            <span className="file-status">{file.status}</span>
          </div>
        ))}
      </div>

      {/* Optional: Show full patch */}
      <details className="full-patch">
        <summary>View Full Diff</summary>
        <pre><code>{diff.patch}</code></pre>
      </details>
    </div>
  );
}
```

## Example 4: Git Tab in Project Detail Panel

This is the recommended implementation for the observability dashboard's Git tab:

```tsx
import { useState, useEffect } from 'react';
import { getGitLog, getGitDiff, GitCommit, GitDiff } from '@/services/quetrex-api';

export function GitTab({ projectPath }: { projectPath: string }) {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [loading, setLoading] = useState(true);

  // Load commits on mount
  useEffect(() => {
    async function loadCommits() {
      try {
        const recentCommits = await getGitLog(projectPath, 20);
        setCommits(recentCommits);
      } catch (error) {
        console.error('Failed to load commits:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCommits();
  }, [projectPath]);

  // Load diff when commit is selected
  useEffect(() => {
    if (!selectedCommit) {
      setDiff(null);
      return;
    }

    async function loadDiff() {
      try {
        const diffData = await getGitDiff(projectPath, selectedCommit);
        setDiff(diffData);
      } catch (error) {
        console.error('Failed to load diff:', error);
      }
    }

    loadDiff();
  }, [projectPath, selectedCommit]);

  if (loading) return <div>Loading git history...</div>;

  return (
    <div className="git-tab">
      <div className="commits-list">
        <h4>Recent Commits</h4>
        {commits.map((commit) => (
          <div
            key={commit.hash}
            className={`commit ${selectedCommit === commit.hash ? 'selected' : ''}`}
            onClick={() => setSelectedCommit(commit.hash)}
          >
            <div className="commit-meta">
              <span className="hash">{commit.shortHash}</span>
              <span className="date">{commit.date}</span>
            </div>
            <div className="commit-author">{commit.author}</div>
            <div className="commit-message">{commit.message.split('\n')[0]}</div>
          </div>
        ))}
      </div>

      {diff && (
        <div className="diff-viewer">
          <h4>Changes in {selectedCommit?.substring(0, 7)}</h4>
          <div className="diff-stats">
            <span className="additions">+{diff.totalAdditions}</span>
            <span className="deletions">-{diff.totalDeletions}</span>
          </div>

          <div className="file-list">
            {diff.files.map((file, idx) => (
              <div key={idx} className={`file ${file.status}`}>
                <span className="path">{file.path}</span>
                <span className="stats">+{file.additions} -{file.deletions}</span>
              </div>
            ))}
          </div>

          <pre className="patch">{diff.patch}</pre>
        </div>
      )}
    </div>
  );
}
```

## Error Handling

All functions throw errors that should be caught:

```typescript
try {
  const commits = await getGitLog(projectPath, 10);
  // Use commits
} catch (error) {
  if (error instanceof Error) {
    // Show user-friendly error
    toast.error(`Failed to load commits: ${error.message}`);
  }
}
```

## Mock Mode

When running in the browser (not in Tauri), the functions return mock data automatically. This allows you to develop and test the UI without running the full Tauri application.

```typescript
// In browser (MOCK_MODE = true)
const commits = await getGitLog('/some/path', 10);
// Returns mock data

// In Tauri app (MOCK_MODE = false)
const commits = await getGitLog('/some/path', 10);
// Returns real git data from Rust backend
```

## Performance Tips

1. **Limit commit history**: Don't load thousands of commits at once
   ```typescript
   // Good: Load 20-50 commits
   const commits = await getGitLog(projectPath, 20);

   // Bad: Loading 1000+ commits can be slow
   const commits = await getGitLog(projectPath, 1000);
   ```

2. **Cache results**: Store git data in state to avoid repeated calls
   ```typescript
   const [commits, setCommits] = useState<GitCommit[]>([]);
   const [cacheTime, setCacheTime] = useState<number>(0);

   // Only reload if cache is older than 30 seconds
   if (Date.now() - cacheTime > 30000) {
     const fresh = await getGitLog(projectPath, 20);
     setCommits(fresh);
     setCacheTime(Date.now());
   }
   ```

3. **Debounce refresh**: Don't poll too frequently
   ```typescript
   // Good: Refresh every 10 seconds
   const interval = setInterval(loadStatus, 10000);

   // Bad: Refreshing every second is wasteful
   const interval = setInterval(loadStatus, 1000);
   ```

## Next Steps

See `/docs/roadmap/observability.md` for the complete design of the Git tab and how it fits into the overall observability dashboard.
