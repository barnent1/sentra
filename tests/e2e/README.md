# E2E Test Suite - Comprehensive Coverage

This directory contains comprehensive end-to-end tests for the Quetrex application using Playwright.

## Test Files Overview

### 1. **dashboard-interactions.spec.ts** (35 tests)
Tests all dashboard interactions and user workflows:
- Project card interactions (click, hover, keyboard navigation)
- Stats display and real-time updates
- Mute button functionality and persistence
- Voice queue integration
- Grid layout and responsive behavior
- Keyboard navigation and accessibility

### 2. **project-creation.spec.ts** (34 tests)
Tests the new project modal and template selection:
- Modal opening/closing (X button, Cancel, Escape)
- Form validation (name, path validation)
- Template selection (Next.js, Python, React)
- Path browsing and manual entry
- Loading states and form reset
- Visual styling and accessibility
- Keyboard navigation

### 3. **settings.spec.ts** (39 tests)
Tests all settings functionality and persistence:
- Modal opening/closing
- User name configuration
- Language selection (English, Spanish)
- API key inputs (OpenAI, Anthropic, GitHub)
- GitHub repository settings
- Voice selection (all 6 voices)
- Test voice functionality
- Notification preferences (enable/disable sub-options)
- Settings persistence across sessions
- Form validation
- Dark theme styling

### 4. **git-integration.spec.ts** (37 tests)
Tests Git features within the project detail panel:
- Git log display (commits, authors, messages, dates)
- Git status (current branch, ahead/behind, file lists)
- Git diff viewer (additions, deletions, patch display)
- Monospace fonts for code
- Color coding (green additions, red deletions)
- Tab navigation
- Error handling (non-git repos, no commits)
- Scrollable diff viewer

### 5. **cost-tracking.spec.ts** (50 tests)
Tests cost tracking and display across the application:
- Today cost display with currency formatting
- Monthly budget indicators and warnings
- Project cost breakdown
- Cost by provider (OpenAI, Anthropic)
- Cost by model (GPT-4o, Claude, Whisper, TTS)
- Daily cost trends (7-day history)
- Cost warnings and alerts
- Export functionality
- Visual styling and color coding
- Performance (load times, real-time updates)

### 6. **visual-regression.spec.ts** (38 tests)
Visual regression tests with screenshot comparison:
- Full dashboard screenshots (desktop, tablet, mobile)
- Component screenshots (stat cards, project cards, header)
- Modal screenshots (new project, settings, detail panel)
- Hover states (cards, buttons)
- Animation states (pulse, progress bars)
- Color accuracy (violet accents, dark theme, status colors)
- Typography (fonts, monospace)
- Cross-browser consistency (Chromium, Firefox, WebKit)
- Error states (validation, disabled buttons)

## Total Test Coverage

**208 E2E Tests** covering:
- Critical user journeys
- All visual state changes
- Multi-step interactions
- User-facing state transitions
- Modal workflows
- Form validation
- Real-time updates
- Responsive design
- Accessibility
- Visual regression

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm run test:e2e tests/e2e/dashboard-interactions.spec.ts
```

### Run in headed mode (see browser)
```bash
npm run test:e2e -- --headed
```

### Run in debug mode
```bash
npm run test:e2e -- --debug
```

### Update visual regression baselines
```bash
npm run test:e2e -- --update-snapshots
```

### Run with UI mode (interactive)
```bash
npx playwright test --ui
```

## Test Structure (AAA Pattern)

All tests follow the Arrange-Act-Assert pattern:

```typescript
test('should display project name prominently', async ({ page }) => {
  // ARRANGE - Setup test conditions
  const projectCard = page.locator('[data-testid="project-card"]').first();

  // ACT - Execute the behavior
  const projectName = projectCard.locator('[data-testid="project-name"]');

  // ASSERT - Verify outcome
  await expect(projectName).toBeVisible();
  await expect(projectName).toHaveClass(/text-lg/);
});
```

## Test Selectors

Tests use data-testid attributes for reliable selection:
- `[data-testid="project-card"]` - Project cards
- `[data-testid="stat-card"]` - Dashboard stat cards
- `[data-testid="mute-button"]` - Mute buttons
- `[data-testid="status-indicator"]` - Status dots
- `[data-testid="progress-bar"]` - Progress bars

## Visual Regression Testing

### Playwright Screenshots
Tests automatically compare screenshots against baselines:
```typescript
await expect(page).toHaveScreenshot('dashboard-full-view.png');
```

### Optional: Percy.io Integration
For cloud-based visual regression testing:

1. Install Percy:
```bash
npm install --save-dev @percy/playwright
```

2. Add to tests:
```typescript
import percySnapshot from '@percy/playwright';

await percySnapshot(page, 'Dashboard - Full View');
```

3. Run with Percy:
```bash
npx percy exec -- npx playwright test
```

## Test Data

Tests handle both:
- **Mock mode**: Browser testing with mock data
- **Tauri mode**: Real Tauri app with actual backend

Tests detect the environment and adjust expectations:
```typescript
const isTauri = await page.evaluate(() => '__TAURI_INTERNALS__' in window);
if (!isTauri) {
  test.skip(); // Skip Tauri-specific functionality
}
```

## Accessibility Testing

Tests verify:
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus management
- Color contrast
- Screen reader compatibility

## Performance Testing

Tests verify:
- Page load times < 2 seconds
- Real-time updates without full reload
- Efficient rendering of large data sets
- Animation performance

## Coverage Requirements

As per CLAUDE.md:
- **Overall**: 75%+ (enforced by CI/CD)
- **Business Logic**: 90%+ (enforced by CI/CD)
- **UI Components**: 60%+ (visual components)

E2E tests ensure critical user journeys are protected and regressions are caught early.

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs

All tests must pass before merge is allowed.

## Debugging Failed Tests

1. **Run in headed mode**: See what the browser is doing
   ```bash
   npm run test:e2e -- --headed
   ```

2. **Use debug mode**: Step through test execution
   ```bash
   npm run test:e2e -- --debug
   ```

3. **View screenshots**: Failed tests automatically capture screenshots
   ```bash
   open test-results/
   ```

4. **View trace**: Playwright captures full execution trace
   ```bash
   npx playwright show-trace test-results/.../trace.zip
   ```

## Best Practices

1. **Write tests FIRST** (TDD approach)
2. **Use data-testid** for reliable selectors
3. **Wait for states** (visible, networkidle) before assertions
4. **Follow AAA pattern** (Arrange-Act-Assert)
5. **Skip gracefully** when test conditions aren't met
6. **Test visual states** that users see
7. **Verify multi-step flows** from start to finish

## Contributing

When adding new features:
1. Add E2E tests for all user-facing changes
2. Test all visual state transitions
3. Test keyboard navigation
4. Add visual regression snapshots
5. Update this README if adding new test files

---

**Last Updated**: 2025-11-13
**Total Tests**: 208
**Coverage**: All critical user journeys
**Quality**: Production-ready
