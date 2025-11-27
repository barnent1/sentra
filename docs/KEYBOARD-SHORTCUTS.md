# Keyboard Shortcuts

Complete guide to keyboard navigation and shortcuts in Quetrex.

## Platform-Specific Keys

- **Cmd**: Command key on macOS
- **Ctrl**: Control key on Windows/Linux
- **Modifier**: Use Cmd on macOS, Ctrl on Windows/Linux

## Global Shortcuts

These shortcuts work from anywhere in the application:

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd/Ctrl + ,` | Open Settings | Open the settings modal |
| `Cmd/Ctrl + N` | New Project | Open the new project creation modal |
| `Cmd/Ctrl + K` | Global Search | Open global search (coming soon) |
| `Escape` | Close Modal | Close any open modal or dialog |
| `Tab` | Skip Links | Access skip navigation links on first Tab |

## Navigation

### Tab Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Move focus to next interactive element |
| `Shift + Tab` | Move focus to previous interactive element |
| `Enter` or `Space` | Activate focused button or link |

### Skip Links

Skip links appear on the first `Tab` press from the top of the page:

| Shortcut | Action |
|----------|--------|
| `Tab` (first) | Focus "Skip to main content" link |
| `Enter` | Jump to main content |
| `Tab` (second) | Focus "Skip to projects" link |
| `Enter` | Jump to projects section |

## Project Cards

When a project card is focused:

| Shortcut | Action |
|----------|--------|
| `Enter` or `Space` | Open project details panel |
| `Tab` | Navigate to mute button |
| `Enter` or `Space` | Toggle mute on/off |

## Modals and Dialogs

### New Project Modal

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate through form fields |
| `Enter` | Submit form (when focused on button) |
| `Escape` | Close modal without saving |
| `Cmd/Ctrl + Enter` | Quick submit (coming soon) |

### Settings Modal

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate through settings |
| `Space` | Toggle checkboxes |
| `Arrow Up/Down` | Navigate radio button groups |
| `Enter` | Save settings (when focused on Save button) |
| `Escape` | Close without saving |

### Spec Viewer

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between buttons |
| `Enter` or `Space` | Activate focused button |
| `Escape` | Close viewer |
| `Arrow Up/Down` | Scroll content (when focused on scroll area) |

### Architect Chat

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between controls |
| `Escape` | Close chat and end voice session |
| `Enter` | Send message (in text mode) |
| `Cmd/Ctrl + M` | Toggle text/voice mode (coming soon) |

## Form Controls

### Text Inputs

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next field |
| `Shift + Tab` | Move to previous field |
| `Cmd/Ctrl + A` | Select all text |
| `Cmd/Ctrl + C` | Copy selected text |
| `Cmd/Ctrl + V` | Paste text |
| `Cmd/Ctrl + X` | Cut selected text |

### Dropdowns and Select Menus

| Shortcut | Action |
|----------|--------|
| `Space` or `Enter` | Open dropdown |
| `Arrow Up/Down` | Navigate options |
| `Enter` | Select option |
| `Escape` | Close dropdown without selecting |
| `Home` | Jump to first option |
| `End` | Jump to last option |

### Checkboxes

| Shortcut | Action |
|----------|--------|
| `Space` | Toggle checkbox |
| `Tab` | Move to next checkbox |

### Radio Buttons

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Select previous/next option |
| `Space` | Select focused option |
| `Tab` | Move to next radio group |

## Dashboard

### Stats Grid

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate through stats cards |
| `Enter` | View stat details (coming soon) |

### Active Agents Section

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate through agent cards |
| `Enter` | View agent details (coming soon) |

### Projects Grid

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate through project cards |
| `Enter` or `Space` | Open project details |
| `Arrow Keys` | Navigate grid (coming soon) |

## Accessibility Features

### Focus Management

- **Visible Focus Indicators**: All interactive elements show a violet ring when focused
- **Focus Trap**: Modals trap focus until closed
- **Focus Restoration**: Focus returns to trigger element when modal closes
- **Skip Links**: Quick navigation to main sections

### Keyboard-Only Usage

Quetrex can be fully operated without a mouse:

1. Use `Tab` to navigate between elements
2. Use `Enter` or `Space` to activate buttons
3. Use arrow keys in menus and lists
4. Use `Escape` to close modals

### Screen Reader Support

- All interactive elements have descriptive labels
- Form fields have associated labels
- Error messages are announced
- Loading states are announced
- Dynamic content changes are announced

## Tips for Efficient Navigation

### Power User Tips

1. **Use Skip Links**: Press `Tab` once and `Enter` to jump to main content
2. **Memorize Common Shortcuts**: `Cmd/Ctrl + N` and `Cmd/Ctrl + ,` are used frequently
3. **Escape to Dismiss**: `Escape` closes any modal or dialog
4. **Tab Efficiently**: Use `Shift + Tab` to go backwards quickly

### Screen Reader Tips

1. **Navigate by Landmarks**: Use screen reader landmark navigation (main, nav, etc.)
2. **Navigate by Headings**: Use `H` key (in most screen readers) to jump between sections
3. **Forms Mode**: Screen readers will automatically enter forms mode for inputs
4. **ARIA Live Regions**: Listen for announcements when agents complete tasks

## Browser-Specific Shortcuts

These are standard browser shortcuts that work in Quetrex:

| Shortcut | Action | Browser |
|----------|--------|---------|
| `Cmd/Ctrl + F` | Find on page | All |
| `Cmd/Ctrl + +` | Zoom in | All |
| `Cmd/Ctrl + -` | Zoom out | All |
| `Cmd/Ctrl + 0` | Reset zoom | All |
| `Cmd/Ctrl + R` | Refresh page | All |
| `F5` | Refresh page | Windows/Linux |
| `Cmd + R` | Refresh page | macOS |
| `Cmd/Ctrl + W` | Close tab | All |

## Customization (Coming Soon)

Future versions of Quetrex will support:

- **Custom Keyboard Shortcuts**: Remap shortcuts to your preference
- **Shortcut Cheat Sheet**: In-app shortcut reference (`Cmd/Ctrl + /`)
- **Shortcut Conflicts**: Detect and resolve shortcut conflicts
- **Vim Keybindings**: Optional Vim-style navigation

## Reporting Issues

If you encounter any keyboard navigation issues:

1. Check this guide to ensure you're using the correct shortcut
2. Try refreshing the page (`Cmd/Ctrl + R`)
3. Report the issue at: [github.com/barnent1/quetrex/issues](https://github.com/barnent1/quetrex/issues)
   - Use label: `accessibility` and `keyboard-navigation`
   - Include your operating system and browser version

## Related Documentation

- [Accessibility Statement](./ACCESSIBILITY.md)
- [User Guide](../README.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** November 13, 2025
**Next Review:** March 1, 2026
**Maintained by:** Glen Barnhardt
