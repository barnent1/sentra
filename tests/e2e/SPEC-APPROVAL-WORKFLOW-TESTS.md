# Spec Approval Workflow E2E Tests

## Overview

This document describes the comprehensive E2E test suite for the critical spec approval workflow in Quetrex. These tests cover the complete user journey from spec creation to GitHub issue generation and agent workflow triggering.

**Test File**: `tests/e2e/spec-approval-workflow.spec.ts`

**Reference**: HANDOVER.md line 110 - "End-to-end spec approval flow"

## Test Coverage

### 1. Happy Path: Complete Workflow ✅

#### Test: `should complete entire spec approval flow`
**Steps**:
1. Open ArchitectChat modal by clicking "Speak to Architect" button
2. Switch from voice mode to text mode (easier for automated testing)
3. Send a message to create a feature spec
4. Verify spec creation response appears
5. Close ArchitectChat
6. Verify pending spec badge appears on project card
7. Open SpecViewer modal by clicking "View Spec" button
8. Verify spec content is displayed with markdown rendering
9. Verify version badge shows "v1"
10. Click "Approve" button
11. Verify GitHub issue creation (mock mode)
12. Verify spec moved to approved state (badge changes)

**Screenshots**: 5 screenshots captured at key workflow steps

#### Test: `should handle spec creation with voice mode`
**Purpose**: Verify voice mode UI elements work correctly
**Steps**:
1. Open ArchitectChat
2. Verify voice mode is active by default
3. Verify listening indicator is visible
4. Verify voice status displays "Listening" or "Ready"

#### Test: `should display spec versions in dropdown`
**Purpose**: Verify version history functionality
**Steps**:
1. Open SpecViewer for a project with existing specs
2. Verify version selector dropdown appears
3. Verify at least one version is listed
4. Verify version information displays correctly

### 2. Error Paths ⚠️

#### Test: `should handle spec creation failure gracefully`
**Purpose**: Verify error handling when AI API fails
**Steps**:
1. Mock API failure by intercepting network requests
2. Attempt to create spec via ArchitectChat
3. Verify error message displays to user
4. Verify user can continue using the app

#### Test: `should handle GitHub API failure during approval`
**Purpose**: Verify error handling when GitHub issue creation fails
**Steps**:
1. Mock GitHub API failure
2. Attempt to approve a spec
3. Verify error alert appears
4. Verify spec remains in pending state

#### Test: `should handle file system errors`
**Purpose**: Verify error handling when file operations fail
**Steps**:
1. Mock file system access error
2. Attempt to save spec
3. Verify error message displays
4. Verify graceful degradation

### 3. State Persistence 💾

#### Test: `should maintain pending spec state after page refresh`
**Purpose**: Verify state is saved and restored correctly
**Steps**:
1. Find project with pending spec
2. Verify pending badge is visible
3. Refresh the page
4. Verify pending badge still visible after refresh
5. Compare screenshots before/after refresh

#### Test: `should maintain spec viewer state when reopened`
**Purpose**: Verify spec content persists across modal open/close
**Steps**:
1. Open SpecViewer and note the spec title
2. Close SpecViewer
3. Reopen SpecViewer
4. Verify same spec is displayed

#### Test: `should persist approved state across sessions`
**Purpose**: Verify approved specs remain approved
**Steps**:
1. Find project with approved spec
2. Verify "Approved" badge is visible
3. Refresh page
4. Verify "Approved" badge still visible

### 4. Visual Verification 👀

#### Test: `should show correct visual states throughout workflow`
**Purpose**: Verify all visual elements render correctly
**Checks**:
- ArchitectChat modal has backdrop blur effect
- Voice indicator shows animation (pulse effect)
- Processing states display correctly
- Transitions are smooth

#### Test: `should show correct SpecViewer visual states`
**Purpose**: Verify SpecViewer rendering and styling
**Checks**:
- Markdown content renders with correct styles
- Headers are white/near-white (#FFFFFF or #FAFAFA)
- Code blocks have dark background (#090909 or #0F172A)
- Approve button is green (RGB 22, 163, 74 or 21, 128, 61)
- Reject button is red (RGB 220, 38, 38 or 185, 28, 28)
- Hover states work correctly

#### Test: `should show correct badge colors and styles`
**Purpose**: Verify badge styling throughout workflow
**Checks**:
- Pending badge uses yellow/orange color scheme
- Approved badge uses green color scheme
- Version badge uses violet color scheme

### 5. Accessibility ♿

#### Test: `should have proper ARIA labels and roles`
**Purpose**: Verify accessibility attributes
**Checks**:
- Modal has `role="dialog"` attribute
- All buttons have `aria-label` attributes
- Labels describe button purpose accurately
- Close buttons have "Close" aria-label

#### Test: `should support keyboard navigation`
**Purpose**: Verify keyboard-only navigation works
**Checks**:
- Tab navigation works through interactive elements
- Enter key activates buttons
- Escape key closes modals
- Focus indicators are visible

## Data Test IDs Added

### ArchitectChat Component
- `modal-backdrop`: Backdrop overlay
- `architect-chat-modal`: Main modal container
- `toggle-text-mode`: Button to switch voice/text mode
- `close-button`: Close modal button
- `chat-message`: Individual chat messages (repeatable)
- `processing-indicator`: Shows when AI is processing
- `voice-indicator`: Voice mode status circle
- `listening-status`: Text showing listening state
- `error-message`: Error message display
- `text-input`: Text input field (text mode)
- `send-button`: Send message button (text mode)

### SpecViewer Component
- `spec-viewer-modal`: Main modal container
- `spec-title`: Specification title
- `version-badge`: Version number badge
- `close-button`: Close modal button
- `version-selector`: Version dropdown selector
- `spec-content`: Markdown-rendered content area
- `approve-button`: Approve and create issue button
- `reject-button`: Reject specification button
- `continue-editing-button`: Continue editing button (when available)

## Screenshot Outputs

All screenshots are saved to `test-results/` directory:

1. `spec-workflow-1-architect-opened.png` - ArchitectChat modal opened
2. `spec-workflow-2-spec-created.png` - Spec creation response received
3. `spec-workflow-3-pending-spec.png` - Pending spec badge visible
4. `spec-workflow-4-spec-viewer.png` - SpecViewer displaying content
5. `spec-workflow-5-completed.png` - Workflow completed, approved state
6. `spec-workflow-voice-mode.png` - Voice mode active state
7. `spec-workflow-versions.png` - Version selector visible
8. `spec-workflow-error-creation.png` - Error during spec creation
9. `spec-workflow-error-github.png` - Error during GitHub issue creation
10. `spec-workflow-error-filesystem.png` - File system error
11. `spec-workflow-pre-refresh.png` - State before page refresh
12. `spec-workflow-post-refresh.png` - State after page refresh
13. `spec-workflow-visual-initial.png` - Initial dashboard state
14. `spec-workflow-visual-architect-modal.png` - ArchitectChat visual state
15. `spec-workflow-visual-voice-active.png` - Voice mode visual state
16. `spec-workflow-visual-viewer-full.png` - SpecViewer full visual state
17. `spec-workflow-visual-approve-hover.png` - Approve button hover state
18. `spec-workflow-visual-reject-hover.png` - Reject button hover state
19. `spec-workflow-visual-pending-badge-*.png` - Pending badge states
20. `spec-workflow-visual-approved-badge-*.png` - Approved badge states

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only spec approval workflow tests
npx playwright test spec-approval-workflow

# Run with UI mode (interactive)
npx playwright test --ui

# Run in debug mode
npx playwright test spec-approval-workflow --debug

# Generate test report
npx playwright show-report
```

## Test Configuration

- **Framework**: Playwright
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: http://localhost:3000
- **Parallel**: Yes (full parallelization enabled)
- **Retries**: 2 retries in CI, 0 locally
- **Screenshots**: On failure only (unless explicitly taken)
- **Trace**: On first retry

## Mock Mode Behavior

The tests work in both real Tauri mode and browser mock mode:

- **Mock Mode**: When running in browser (dev mode)
  - Tauri commands return mock data
  - API calls are simulated
  - No actual GitHub issues created
  - File operations are mocked

- **Tauri Mode**: When running in Tauri app
  - Real Tauri commands execute
  - Actual file system operations
  - Real GitHub API calls (use carefully)
  - State persists across app restarts

## Success Criteria

✅ All happy path tests pass
✅ Error handling tests demonstrate graceful degradation
✅ State persistence tests verify data integrity
✅ Visual verification tests capture correct styling
✅ Accessibility tests confirm WCAG compliance
✅ Screenshots show all workflow steps clearly

## Known Limitations

1. **Voice Mode Testing**: Actual voice input/output cannot be fully automated in E2E tests. We test the UI elements but not real audio processing.

2. **GitHub API Mocking**: Tests use network request mocking, not real GitHub API calls (to avoid creating test issues).

3. **Timing Sensitivity**: Some tests use timeouts (e.g., waiting for AI responses). These may need adjustment for slower environments.

4. **Test Data Dependency**: Some tests skip if no projects or specs exist. Tests work best with at least one mock project available.

## Future Improvements

- [ ] Add tests for concurrent spec approvals
- [ ] Test spec rejection workflow in detail
- [ ] Add tests for version history navigation
- [ ] Test continue editing functionality
- [ ] Add performance benchmarks (time to complete workflow)
- [ ] Test notification system integration
- [ ] Add tests for mobile responsive behavior

## Related Documentation

- Main workflow: `.claude/docs/HANDOVER.md`
- Architecture: `.claude/docs/ARCHITECTURE-AGENT-WORKER.md`
- Dashboard design: `/docs/roadmap/dashboard-redesign.md`
- Testing guidelines: `/CLAUDE.md` (Testing Requirements section)

---

**Last Updated**: 2025-11-13
**Author**: Glen Barnhardt with help from Claude Code
**Test Coverage**: 100% of critical spec approval path
