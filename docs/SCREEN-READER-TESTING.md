# Screen Reader Testing Guide

Guide for testing Sentra with screen readers to ensure accessibility.

## VoiceOver on macOS

### Enabling VoiceOver

1. **System Settings** → **Accessibility** → **VoiceOver** → Toggle On
2. Or use keyboard shortcut: `Cmd + F5` (or `Fn + Cmd + F5` on newer Macs)
3. VoiceOver Training: Press `Cmd + F8` for interactive tutorial

### Basic VoiceOver Commands

| Command | Action |
|---------|--------|
| `Cmd + F5` | Turn VoiceOver on/off |
| `Ctrl + Option` | VoiceOver (VO) modifier keys |
| `VO + Right Arrow` | Navigate to next item |
| `VO + Left Arrow` | Navigate to previous item |
| `VO + Space` | Activate item |
| `VO + H` | Next heading |
| `VO + Shift + H` | Previous heading |
| `VO + L` | Next link |
| `VO + B` | Next button |
| `VO + J` | Next form control |
| `VO + A` | Read page from current position |

### Testing Sentra with VoiceOver

#### 1. Initial Page Load

**Expected Experience:**
```
"Sentra - AI Agent Control Center. Web content. Has 2 items.
Skip to main content, link.
Skip to projects, link.
Sentra, heading level 1.
AI Mission Control Center."
```

**Test Steps:**
1. Open Sentra in Safari or Chrome
2. Turn on VoiceOver (`Cmd + F5`)
3. VoiceOver should announce page title and first skip link
4. Verify page structure is announced correctly

#### 2. Skip Links

**Test Steps:**
1. Press `Tab` - should focus "Skip to main content"
2. VoiceOver announces: "Skip to main content, link"
3. Press `Enter` - should jump to main content
4. VoiceOver announces: "Main content region"

**Expected Behavior:**
- Skip links should be announced even though visually hidden
- Pressing Enter should move focus to target section
- VoiceOver should announce the new location

#### 3. Navigation and Landmarks

**Test Steps:**
1. Press `VO + U` to open Web Rotor
2. Select "Landmarks" from the menu
3. Navigate through landmarks with arrow keys

**Expected Landmarks:**
- Main navigation (if present)
- Main content
- Header
- Content info/Footer (if present)

#### 4. Form Controls (New Project Modal)

**Test Steps:**
1. Navigate to "New Project" button
2. Press `VO + Space` to activate
3. Navigate through form fields with `VO + Right Arrow`

**Expected Announcements:**
```
"Create New Project. Dialog.
Project Name, edit text, required.
Project Path, edit text, required.
Template group.
Next.js, radio button 1 of 3, selected.
Create Project, button, dimmed (when invalid).
Cancel, button."
```

#### 5. Status Updates and Live Regions

**Test Steps:**
1. Trigger an agent action
2. VoiceOver should announce status changes automatically

**Expected Announcements:**
```
"Agent started. Status update."
"Task completed. Notification."
```

### VoiceOver Verification Checklist

- [ ] Page title is announced on load
- [ ] Skip links are accessible and functional
- [ ] All headings are properly announced (H1, H2, etc.)
- [ ] All buttons have descriptive labels
- [ ] All form fields have associated labels
- [ ] Links have descriptive text (not "click here")
- [ ] Images have alt text
- [ ] Status updates are announced via ARIA live regions
- [ ] Modals are announced as dialogs
- [ ] Focus moves logically through the page
- [ ] Forms provide validation feedback
- [ ] Loading states are announced

## NVDA on Windows

### Installing NVDA

1. Download from: https://www.nvaccess.org/download/
2. Run installer
3. NVDA will start automatically after installation

### Basic NVDA Commands

| Command | Action |
|---------|--------|
| `Ctrl + Alt + N` | Start NVDA |
| `Insert` or `CapsLock` | NVDA modifier key |
| `NVDA + Down Arrow` | Start reading |
| `Ctrl` | Stop reading |
| `NVDA + F7` | Elements list |
| `H` | Next heading |
| `Shift + H` | Previous heading |
| `B` | Next button |
| `F` | Next form field |
| `K` | Next link |
| `D` | Next landmark |

### Testing Sentra with NVDA

#### 1. Browse Mode vs Focus Mode

**Browse Mode**: Navigate with single letter keys (H, B, F, K)
- Enabled by default for web content
- Use arrow keys to read line by line

**Focus Mode**: Type in form fields
- Activates automatically when entering forms
- Press `Insert + Space` to toggle manually

#### 2. Elements List

**Test Steps:**
1. Press `NVDA + F7` to open Elements List
2. Navigate through tabs: Links, Headings, Form Fields, Buttons, Landmarks

**Verify:**
- All interactive elements are listed
- Elements have descriptive names
- Form fields show associated labels
- Landmarks are properly identified

### NVDA Verification Checklist

- [ ] Page loads with title announcement
- [ ] Browse mode is active on page load
- [ ] All headings are in Elements List
- [ ] All form fields have labels
- [ ] Focus mode activates in forms
- [ ] ARIA live regions announce updates
- [ ] Buttons have accessible names
- [ ] Links are descriptive
- [ ] Tables have headers (if present)
- [ ] Error messages are announced

## JAWS on Windows

### Basic JAWS Commands

| Command | Action |
|---------|--------|
| `Insert` | JAWS modifier key |
| `Insert + Down Arrow` | Say all (read from current position) |
| `Insert + F5` | Form fields list |
| `Insert + F6` | Headings list |
| `Insert + F7` | Links list |
| `H` | Next heading |
| `B` | Next button |
| `F` | Next form field |
| `T` | Next table |

### Testing with JAWS

Similar to NVDA testing, verify:

1. **Virtual Cursor**: Navigate with arrow keys and quick keys
2. **Forms Mode**: Automatically enters when focusing form fields
3. **Lists**: Access via `Insert + F5/F6/F7`
4. **ARIA Support**: ARIA labels and live regions are announced

## Common Screen Reader Issues

### Issue: Button Not Announced

**Problem**: Screen reader skips over button or says "unlabeled button"

**Solution**:
```tsx
// ❌ Bad
<button><XIcon /></button>

// ✅ Good
<button aria-label="Close modal"><XIcon /></button>
```

### Issue: Form Field Without Label

**Problem**: Screen reader says "edit text" without identifying the field

**Solution**:
```tsx
// ❌ Bad
<input type="text" placeholder="Enter name" />

// ✅ Good
<label htmlFor="name">Name</label>
<input id="name" type="text" placeholder="Enter name" />

// ✅ Also Good
<input type="text" aria-label="Name" placeholder="Enter name" />
```

### Issue: Status Update Not Announced

**Problem**: Content changes but screen reader doesn't announce it

**Solution**:
```tsx
// ✅ Use ARIA live region
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// For urgent announcements
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### Issue: Heading Out of Order

**Problem**: H3 appears before H2, breaking document outline

**Solution**:
```tsx
// ❌ Bad
<h1>Page Title</h1>
<h3>Subsection</h3> {/* Skips H2 */}

// ✅ Good
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

## Testing Best Practices

### Before Each Release

1. **Test with keyboard only** (no mouse)
2. **Test with VoiceOver** on macOS + Safari
3. **Test with NVDA** on Windows + Chrome
4. **Run automated tests** (axe-core)
5. **Check color contrast** with tools
6. **Verify skip links** work correctly
7. **Test all forms** with screen reader
8. **Verify modal focus** management

### What to Listen For

**Good Signs:**
- Elements are announced with their type (button, link, heading)
- Form fields have clear labels
- Status updates are announced automatically
- Navigation is logical and predictable

**Red Flags:**
- "Unlabeled" or "blank" announcements
- Silence when navigating
- Form fields without context
- Changes happening without announcements
- Illogical navigation order

## Reporting Screen Reader Issues

When reporting screen reader issues, include:

1. **Screen Reader**: Name and version (e.g., "VoiceOver on macOS Sonoma")
2. **Browser**: Name and version (e.g., "Safari 17.0")
3. **Element**: What you were trying to access
4. **Expected**: What should have been announced
5. **Actual**: What was actually announced
6. **Steps**: How to reproduce the issue

**Example Report:**
```markdown
**Screen Reader**: NVDA 2023.1
**Browser**: Chrome 119
**Element**: Close button in Settings modal
**Expected**: "Close settings modal, button"
**Actual**: "Button, unlabeled"
**Steps**:
1. Open Settings with Cmd+,
2. Navigate to close button with Tab
3. NVDA announces "Button" without label
```

## Resources

### Screen Readers

- **VoiceOver**: Built into macOS and iOS
- **NVDA**: https://www.nvaccess.org/ (free, Windows)
- **JAWS**: https://www.freedomscientific.com/products/software/jaws/ (paid, Windows)
- **TalkBack**: Built into Android
- **Narrator**: Built into Windows

### Testing Tools

- **WAVE**: Browser extension for accessibility evaluation
- **axe DevTools**: Browser extension for automated testing
- **Accessibility Insights**: Microsoft's accessibility testing tools
- **Lighthouse**: Built into Chrome DevTools

### Documentation

- **WebAIM**: https://webaim.org/articles/screenreader_testing/
- **Deque University**: https://dequeuniversity.com/screenreaders/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

---

**Last Updated:** November 13, 2025
**Maintained by:** Glen Barnhardt
