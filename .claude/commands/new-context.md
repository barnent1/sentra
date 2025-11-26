# Sentra Development Context Bootstrap

You are starting a new Claude Code session for the **Sentra** project. Your goal is to quickly get up to speed and help the user be productive.

## Step 1: Load Project Knowledge

First, load the sentra-development-workflow skill to understand:
- What Sentra is and how it works
- The automation workflow (GitHub Issues → AI Agent → PR)
- How to create effective issues
- Quality enforcement system
- Architecture decisions

Use the Skill tool to load: `sentra-development-workflow`

## Step 2: Query Current Project State

Run these commands to understand current state:

### Pending Work (AI Feature Issues)
```bash
gh issue list --label "ai-feature" --state open --json number,title,createdAt --limit 10
```

### Recently Completed (Merged PRs)
```bash
gh pr list --state merged --limit 5 --json number,title,mergedAt
```

### Current Git Status
```bash
git status --short && git log --oneline -3
```

## Step 3: Read Status File

Read `.sentra/status.yml` to understand:
- Current development phase
- Active focus areas
- Recent milestones
- Known blockers

## Step 4: Present Options to User

After gathering information, present a concise summary:

### Format Your Response Like This:

```
## Sentra Development Session

**Current Phase:** [from status.yml]
**Focus Area:** [from status.yml]

### Pending AI-Agent Issues
[List open issues with ai-feature label]

### Recently Completed
[List last 3-5 merged PRs]

### Suggested Next Steps
Based on the roadmap and current state, here are logical next items:

1. **[High priority item]** - [brief description]
2. **[Medium priority item]** - [brief description]
3. **[Optional item]** - [brief description]

### What would you like to work on?

Options:
- Pick from pending issues above
- Create a new issue for AI agent automation
- Work on something directly in this session
- Review and merge pending PRs
- Update project documentation/status
```

## Step 5: Be Ready to Help

Based on user's choice:

- **Creating issues:** Use the ai-feature template, ensure proper acceptance criteria
- **Direct work:** Follow TDD (tests first), use specialized agents for complex features
- **PR review:** Help review code, run tests, suggest improvements
- **Documentation:** Update status.yml, PROJECT-CHECKLIST.md, or other docs

## Important Context

- **Label for automation:** `ai-feature`
- **Workflow file:** `.github/workflows/ai-agent.yml`
- **Agent script:** `.claude/scripts/ai-agent-worker.py`
- **Quality gates:** 6-layer defense system (see skill for details)
- **TDD is mandatory:** Write tests FIRST

## Session End Reminder

Before ending any session, remind the user to:
1. Update `.sentra/status.yml` with current state
2. Create issues for any incomplete work
3. Commit and push changes

---

Now execute these steps and present the summary to the user.
