# Feature Request: Compact/Agent Mode - Hide Tool Execution Output

## Context

With the advent of agents and skills, developers are increasingly using Claude Code as an orchestration layer rather than a direct coding assistant. In these workflows, users care about **what the agent accomplished**, not every bash command or file read that happened along the way.

Currently, Claude Code displays:
1. The raw tool execution output (bash commands, file contents, etc.)
2. Claude's formatted summary of that same information

This creates two problems:
- **Context bloat**: The same information consumes tokens twice
- **Noise**: When orchestrating complex multi-step tasks, the terminal becomes a wall of intermediate outputs that obscure the actual results

## Proposed Solution

Add a "compact mode" or "agent mode" setting that:

- **Hides raw tool output** (bash commands, file reads, grep results, etc.)
- **Shows only Claude's processed response** (the summary, analysis, or result)
- **Optionally shows a collapsed indicator** (e.g., `[3 tools executed]` that can be expanded if needed)

## Configuration Options

```json
{
  "outputMode": "compact"  // or "verbose" (current default)
}
```

Or a CLI flag:
```bash
claude --compact "your task"
```

Or an interactive toggle:
```
/compact on
/compact off
```

## Use Cases

1. **Agent orchestration**: Running complex multi-agent workflows where only final results matter
2. **Skill execution**: Using skills that perform many internal operations
3. **Demo/presentation**: Showing Claude Code to stakeholders without implementation noise
4. **Context preservation**: Reducing token usage in long sessions

## Acknowledgment

There are valid reasons to see tool output (debugging, transparency, learning). This isn't about removing that capability - it's about giving users the **choice** to hide it when they don't need it.

A toggle between modes would serve both use cases:
- **Verbose mode** (current): Full transparency, see everything
- **Compact mode** (new): Results-focused, agent-style output

## Related

This becomes increasingly important as Claude Code moves toward more autonomous agent workflows where dozens of tool calls may happen for a single user request.
