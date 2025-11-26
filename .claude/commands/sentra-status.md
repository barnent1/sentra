# Sentra Status - Dashboard View

Show the current status of the Sentra AI agent system.

## Gather Information
Run these commands to collect status data:

1. **Runner Status**
```bash
gh api repos/barnent1/sentra/actions/runners --jq '.runners[] | "Runner: \(.name) - \(.status)"'
```

2. **Active/Recent Workflow Runs**
```bash
gh run list --workflow=ai-agent-local.yml --limit=5 --json databaseId,status,conclusion,displayTitle,createdAt --jq '.[] | "\(.displayTitle) | \(.status) | \(.conclusion // "running") | \(.createdAt)"'
```

3. **Open Issues with ai-feature label**
```bash
gh issue list --label=ai-feature --state=open --json number,title,createdAt --jq '.[] | "#\(.number): \(.title)"'
```

4. **Recent PRs from agent**
```bash
gh pr list --author="@me" --limit=5 --json number,title,state,url --jq '.[] | "#\(.number): \(.title) [\(.state)]"'
```

## Display Format
Present the information in a clean dashboard format:

```
===============================================
  SENTRA STATUS
===============================================

RUNNER
  [status] runner-name

ACTIVE JOBS
  #XX: Title                    [progress] status

QUEUED (ai-feature issues)
  #XX: Title
  #XX: Title

RECENT COMPLETIONS
  #XX: Title                    completed time-ago

OPEN PRs
  #XX: Title                    [state]
===============================================
```

Run the commands and display the current status now.
