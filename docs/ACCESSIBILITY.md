# Accessibility Statement

**Last Updated:** November 13, 2025

## Our Commitment

Sentra is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Conformance Status

Sentra aims to conform to the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards. These guidelines explain how to make web content more accessible for people with disabilities and user-friendly for everyone.

### Current Compliance Level

**Partially Conformant**: Some parts of the content do not fully conform to WCAG 2.1 Level AA. We are actively working to achieve full conformance.

## Accessibility Features

### Keyboard Navigation

Sentra fully supports keyboard navigation:

- **Tab**: Navigate forward through interactive elements
- **Shift+Tab**: Navigate backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs
- **Arrow Keys**: Navigate within dropdown menus and lists

See [Keyboard Shortcuts Documentation](./KEYBOARD-SHORTCUTS.md) for a complete list of shortcuts.

### Screen Reader Support

Sentra is compatible with the following screen readers:

- **macOS**: VoiceOver (tested with Safari and Chrome)
- **Windows**: NVDA (tested with Chrome and Firefox)
- **Windows**: JAWS (tested with Chrome and Edge)

#### Screen Reader Features:

- Semantic HTML structure with proper landmarks
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content updates
- Descriptive alt text for all images
- Proper heading hierarchy (H1-H6)
- Form labels and error messages

### Visual Accessibility

#### Color Contrast

All text meets WCAG 2.1 AA contrast requirements:

- **Normal text**: Minimum contrast ratio of 4.5:1
- **Large text**: Minimum contrast ratio of 3:1
- **UI components**: Minimum contrast ratio of 3:1

#### Focus Indicators

All interactive elements have visible focus indicators:

- **Violet ring** (2px solid) appears when an element receives keyboard focus
- Ring offset of 2px for better visibility against dark backgrounds
- Focus indicators work in all themes

#### Text Sizing

- Base font size: 16px (1rem)
- Text can be resized up to 200% without loss of functionality
- Responsive design supports various screen sizes and zoom levels

### Skip Links

Skip links are provided at the top of each page:

- **Skip to main content**: Jumps directly to the primary content area
- **Skip to projects**: Jumps directly to the projects section
- Skip links are visually hidden but appear on keyboard focus

## Known Issues and Limitations

We are aware of the following accessibility issues and are working to address them:

### In Progress

1. **Voice Mode Focus Management**: Focus management during voice conversations needs improvement
2. **Loading State Announcements**: Some loading states may not be announced to screen readers
3. **Complex Data Visualizations**: Charts and graphs need better alternative text descriptions

### Planned Improvements (Q1 2026)

1. **High Contrast Mode**: Dedicated high-contrast theme for users with low vision
2. **Reduced Motion**: Respect `prefers-reduced-motion` user preference
3. **Dark/Light Mode Toggle**: User-selectable theme preferences
4. **Enhanced ARIA**: More descriptive ARIA labels for complex UI components
5. **Form Validation**: Improved error messages with better screen reader support

## Testing Methodology

Sentra's accessibility is tested using:

### Automated Testing

- **axe-core**: Automated accessibility testing in Playwright E2E tests
- **WAVE**: Manual checks during development
- **Lighthouse**: Regular audits in Chrome DevTools

### Manual Testing

- **Keyboard navigation**: All features tested with keyboard only
- **Screen reader testing**: VoiceOver on macOS, NVDA on Windows
- **Color contrast**: Manual verification with contrast checkers
- **Zoom testing**: Tested at 100%, 150%, and 200% zoom levels

### User Testing

We conduct regular user testing sessions with people who:

- Use screen readers daily
- Navigate exclusively with keyboard
- Have low vision or color blindness
- Have motor impairments

## Feedback and Contact

We welcome feedback on the accessibility of Sentra. If you encounter accessibility barriers:

### How to Report Issues

1. **GitHub Issues**: Open an issue at [github.com/barnent1/sentra/issues](https://github.com/barnent1/sentra/issues)
   - Use the label: `accessibility`
   - Describe the issue in detail
   - Include:
     - Your operating system and version
     - Your browser and version
     - Assistive technology you're using (if any)
     - Steps to reproduce the issue

2. **Email**: accessibility@sentra.dev (monitored weekly)

3. **Expected Response Time**: We aim to respond to accessibility issues within 2 business days

## Technical Specifications

Sentra's accessibility relies on the following technologies:

- **Semantic HTML5**: Proper use of HTML elements for meaning
- **ARIA 1.2**: Accessible Rich Internet Applications specification
- **CSS3**: Styles that respect user preferences
- **TypeScript/React**: Interactive components with accessibility in mind

### Browser Compatibility

Sentra is tested and supported on:

- **Chrome**: Version 100+
- **Firefox**: Version 100+
- **Safari**: Version 15+
- **Edge**: Version 100+

### Assistive Technology Compatibility

Sentra is tested with:

- **Screen Readers**: JAWS, NVDA, VoiceOver
- **Voice Control**: Dragon NaturallySpeaking, Voice Control (macOS)
- **Keyboard Navigation**: Full support without mouse
- **Screen Magnification**: ZoomText, built-in OS magnifiers

## Standards and Guidelines

Sentra strives to meet the following standards:

- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **Section 508**: U.S. federal accessibility standards
- **EN 301 549**: European accessibility standard
- **ARIA 1.2**: Accessible Rich Internet Applications

## Assessment Approach

This accessibility statement was created on November 13, 2025, using the following approaches:

1. **Self-evaluation**: Internal accessibility review by development team
2. **Automated testing**: axe-core, WAVE, Lighthouse
3. **Manual testing**: Keyboard navigation, screen reader testing
4. **User feedback**: Reports from users with disabilities

### Next Scheduled Review

**March 1, 2026**

We will conduct a comprehensive accessibility audit and update this statement quarterly.

## Formal Complaints

If you are not satisfied with our response to your accessibility feedback, you may escalate through the following channels:

1. **Internal Escalation**: Contact the project maintainer at glen@sentra.dev
2. **Community Standards**: Report to our Code of Conduct committee
3. **Legal Compliance**: Contact your local accessibility authority

## Related Documents

- [Keyboard Shortcuts](./KEYBOARD-SHORTCUTS.md)
- [User Guide](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Commitment to Accessibility**: Accessibility is a core value at Sentra. We believe technology should be available to everyone, regardless of ability. This is an ongoing journey, and we appreciate your patience and feedback as we work to make Sentra as accessible as possible.

*Last reviewed by: Glen Barnhardt, Project Maintainer*
*Next review date: March 1, 2026*
