# Sentra Run - Quick Issue Creation

Create a GitHub issue and trigger the AI agent runner.

## Usage
The user will provide a task description after calling this command.

## Process

1. **Parse the Request** - Understand what they want done

2. **Create Issue**
```bash
gh issue create \
  --title "Brief descriptive title" \
  --body "## Task
[User's request expanded into clear requirements]

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Technical Notes
[Any relevant technical context]
" \
  --label "ai-feature"
```

3. **Trigger Workflow** (optional, if they want immediate execution)
```bash
gh workflow run ai-agent-local.yml -f issue_number=ISSUE_NUMBER
```

4. **Confirm** - Tell user the issue number and that the runner will pick it up

## Example
User: "Fix the authentication bug where users can't log out"

Creates issue:
- Title: "Fix logout authentication bug"
- Body: Clear description of the bug and expected behavior
- Label: ai-feature

The self-hosted runner will automatically pick up the issue and work on it.

Ask the user what they'd like the AI agent to work on.
