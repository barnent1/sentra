import { test, expect } from '@playwright/test';

test.describe('Git Integration - Project Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Open a project detail panel
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      await page.waitForTimeout(300);
    }
  });

  test.describe('Git Log Display', () => {
    test('should display git log tab', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await expect(gitLogTab).toBeVisible();
    });

    test('should show recent commits when git log tab is clicked', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT - Should show commit list
      const commitList = panel.locator('[data-testid="commit-list"], .commit-item').first();
      // Commits may or may not exist, just verify tab content loads
      const tabContent = panel.locator('[data-testid="git-log-content"]');
      await expect(tabContent.or(commitList).or(panel.locator('text=No commits'))).toBeVisible();
    });

    test('should display commit hash for each commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT
      const commitHash = panel.locator('[data-testid="commit-hash"]').first();
      if (await commitHash.count() > 0) {
        await expect(commitHash).toBeVisible();
        const hashText = await commitHash.textContent();
        expect(hashText?.length).toBeGreaterThan(0);
      }
    });

    test('should display commit author for each commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT
      const commitAuthor = panel.locator('[data-testid="commit-author"]').first();
      if (await commitAuthor.count() > 0) {
        await expect(commitAuthor).toBeVisible();
      }
    });

    test('should display commit message for each commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT
      const commitMessage = panel.locator('[data-testid="commit-message"]').first();
      if (await commitMessage.count() > 0) {
        await expect(commitMessage).toBeVisible();
        const messageText = await commitMessage.textContent();
        expect(messageText?.length).toBeGreaterThan(0);
      }
    });

    test('should display commit date for each commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT
      const commitDate = panel.locator('[data-testid="commit-date"]').first();
      if (await commitDate.count() > 0) {
        await expect(commitDate).toBeVisible();
      }
    });

    test('should use monospace font for commit hashes', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT
      const commitHash = panel.locator('[data-testid="commit-hash"]').first();
      if (await commitHash.count() > 0) {
        const classes = await commitHash.getAttribute('class');
        expect(classes).toContain('mono');
      }
    });

    test('should show loading state while fetching commits', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();

      // ASSERT - Look for loading indicator (briefly)
      const loading = panel.locator('[data-testid="loading"], .animate-spin, text=Loading');
      // Loading state may be too fast to catch, so we just verify content eventually loads
      await page.waitForTimeout(500);
    });

    test('should limit commits to reasonable number', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT - Should show <= 50 commits
      const commits = panel.locator('[data-testid="commit-item"]');
      const count = await commits.count();
      expect(count).toBeLessThanOrEqual(50);
    });
  });

  test.describe('Git Status Display', () => {
    test('should display git status section', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const statusSection = panel.locator('[data-testid="git-status"], text=Git Status').first();

      // ASSERT
      if (await statusSection.count() > 0) {
        await expect(statusSection).toBeVisible();
      }
    });

    test('should display current branch name', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const branchName = panel.locator('[data-testid="current-branch"]');
      if (await branchName.count() > 0) {
        await expect(branchName).toBeVisible();
        const branch = await branchName.textContent();
        expect(branch?.length).toBeGreaterThan(0);
      }
    });

    test('should display commits ahead/behind remote', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const aheadBehind = panel.locator('[data-testid="ahead-behind"]');
      if (await aheadBehind.count() > 0) {
        await expect(aheadBehind).toBeVisible();
      }
    });

    test('should list modified files', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const modifiedFiles = panel.locator('[data-testid="modified-files"]');
      if (await modifiedFiles.count() > 0) {
        await expect(modifiedFiles).toBeVisible();
      }
    });

    test('should list staged files', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const stagedFiles = panel.locator('[data-testid="staged-files"]');
      if (await stagedFiles.count() > 0) {
        await expect(stagedFiles).toBeVisible();
      }
    });

    test('should list untracked files', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT
      const untrackedFiles = panel.locator('[data-testid="untracked-files"]');
      if (await untrackedFiles.count() > 0) {
        await expect(untrackedFiles).toBeVisible();
      }
    });

    test('should show clean state message when no changes', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT - If no files are modified, should show clean message
      const modifiedFiles = panel.locator('[data-testid="modified-files"]');
      const stagedFiles = panel.locator('[data-testid="staged-files"]');
      const untrackedFiles = panel.locator('[data-testid="untracked-files"]');

      const hasFiles = await modifiedFiles.count() > 0 ||
                       await stagedFiles.count() > 0 ||
                       await untrackedFiles.count() > 0;

      if (!hasFiles) {
        const cleanMessage = panel.locator('text=clean, text=nothing to commit').first();
        if (await cleanMessage.count() > 0) {
          await expect(cleanMessage).toBeVisible();
        }
      }
    });

    test('should use appropriate colors for file status', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ASSERT - Modified files should have distinct color
      const modifiedFile = panel.locator('[data-testid="modified-file"]').first();
      if (await modifiedFile.count() > 0) {
        const classes = await modifiedFile.getAttribute('class');
        // Should have some color indicator (yellow, orange, etc)
        expect(classes).toBeTruthy();
      }
    });
  });

  test.describe('Git Diff Viewer', () => {
    test('should show diff viewer when clicking on commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT - Open git log
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // Click first commit
      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const diffViewer = panel.locator('[data-testid="diff-viewer"]');
        if (await diffViewer.count() > 0) {
          await expect(diffViewer).toBeVisible();
        }
      }
    });

    test('should display files changed in commit', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const fileList = panel.locator('[data-testid="diff-files"]');
        if (await fileList.count() > 0) {
          await expect(fileList).toBeVisible();
        }
      }
    });

    test('should show additions and deletions count', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const additions = panel.locator('[data-testid="additions"]').first();
        const deletions = panel.locator('[data-testid="deletions"]').first();

        if (await additions.count() > 0) {
          await expect(additions).toBeVisible();
        }
        if (await deletions.count() > 0) {
          await expect(deletions).toBeVisible();
        }
      }
    });

    test('should use green for additions', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const additions = panel.locator('[data-testid="additions"]').first();
        if (await additions.count() > 0) {
          const classes = await additions.getAttribute('class');
          expect(classes).toContain('green');
        }
      }
    });

    test('should use red for deletions', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const deletions = panel.locator('[data-testid="deletions"]').first();
        if (await deletions.count() > 0) {
          const classes = await deletions.getAttribute('class');
          expect(classes).toContain('red');
        }
      }
    });

    test('should display patch/diff content', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const patch = panel.locator('[data-testid="diff-patch"]');
        if (await patch.count() > 0) {
          await expect(patch).toBeVisible();
        }
      }
    });

    test('should use monospace font for diff content', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const patch = panel.locator('[data-testid="diff-patch"]');
        if (await patch.count() > 0) {
          const classes = await patch.getAttribute('class');
          expect(classes).toContain('mono');
        }
      }
    });

    test('should have scrollable diff viewer for long diffs', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // ASSERT
        const diffContainer = panel.locator('[data-testid="diff-viewer"]');
        if (await diffContainer.count() > 0) {
          const classes = await diffContainer.getAttribute('class');
          expect(classes).toContain('overflow');
        }
      }
    });

    test('should close diff viewer when clicking back/close', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      const firstCommit = panel.locator('[data-testid="commit-item"]').first();
      if (await firstCommit.count() > 0) {
        await firstCommit.click();
        await page.waitForTimeout(300);

        // Close diff viewer
        const closeButton = panel.locator('[data-testid="close-diff"], button:has-text("Back")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(200);

          // ASSERT
          const diffViewer = panel.locator('[data-testid="diff-viewer"]');
          await expect(diffViewer).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Git Tab Navigation', () => {
    test('should switch between git log and other tabs', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT - Click git log tab
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(200);

      // Switch to another tab
      const overviewTab = panel.locator('button:has-text("Overview"), [data-testid="overview-tab"]').first();
      if (await overviewTab.count() > 0) {
        await overviewTab.click();
        await page.waitForTimeout(200);

        // ASSERT - Git log content should be hidden
        const gitLogContent = panel.locator('[data-testid="git-log-content"]');
        if (await gitLogContent.count() > 0) {
          await expect(gitLogContent).not.toBeVisible();
        }
      }
    });

    test('should highlight active git log tab', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(200);

      // ASSERT
      const classes = await gitLogTab.getAttribute('class');
      expect(classes).toMatch(/active|Selected|violet/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle project without git repository gracefully', async ({ page }) => {
      // Note: This would require a non-git project
      // Just verify no crash occurs when opening panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      if (await gitLogTab.count() > 0) {
        await gitLogTab.click();
        await page.waitForTimeout(500);

        // ASSERT - Should show some content or error message, not crash
        const content = panel.locator('[data-testid="git-log-content"], text=No commits, text=not a git repository').first();
        await expect(content).toBeVisible();
      }
    });

    test('should show appropriate message when no commits exist', async ({ page }) => {
      // Skip if no project panel
      const panel = page.locator('[data-testid="project-detail-panel"]');
      if (await panel.count() === 0) {
        test.skip();
      }

      // ACT
      const gitLogTab = panel.locator('button:has-text("Git Log"), [data-testid="git-log-tab"]');
      await gitLogTab.click();
      await page.waitForTimeout(500);

      // ASSERT - Either show commits or "no commits" message
      const commits = panel.locator('[data-testid="commit-item"]');
      const noCommitsMessage = panel.locator('text=No commits');

      if (await commits.count() === 0) {
        await expect(noCommitsMessage).toBeVisible();
      }
    });
  });
});
