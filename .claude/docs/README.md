# Claude Code Documentation

This directory contains architecture decision records and implementation guidance for the Sentra project's Claude Code integration.

## Documents

### ARCHITECTURE-AGENT-WORKER.md

**Critical architecture decision explaining why we use Claude Code CLI instead of Anthropic SDK.**

**Read this before:**
- Modifying `.claude/scripts/ai-agent-worker.py`
- Changing how agents are executed
- Considering migration to direct Anthropic SDK
- Making changes to agent automation

**Key takeaway:** We use Claude Code CLI to get the agent ecosystem, quality hooks, and automatic updates. DO NOT migrate to SDK.

---

## Quick Reference

### When to Read Architecture Docs

**Before you:**
1. Change agent execution code → Read `ARCHITECTURE-AGENT-WORKER.md`
2. Modify quality hooks → Check `.claude/hooks/` and hook documentation
3. Add new specialized agents → Review `.claude/agents/` and agent patterns
4. Update Docker security → See `/docs/architecture/SECURITY-ARCHITECTURE.md`

### Common Questions

**Q: Why don't we use the Anthropic SDK directly?**
A: See `ARCHITECTURE-AGENT-WORKER.md` - we'd lose agents, hooks, and auto-updates for no real benefit.

**Q: Can I build custom tools for the agent?**
A: Claude Code already has production-hardened tools (Read, Write, Edit, Bash, Glob, Grep). Use those instead.

**Q: How do I add a new quality check?**
A: Add a hook to `.claude/hooks/hooks.json` - see existing hooks for examples.

**Q: What if Claude Code doesn't support my use case?**
A: Read the "Decision Criteria for Future" section in `ARCHITECTURE-AGENT-WORKER.md` - you need to meet ALL criteria (you won't).

---

## File Locations

**Agent Configuration:**
- `.claude/agents/` - Specialized agent definitions
- `.claude/hooks/` - Quality enforcement hooks
- `.claude/scripts/ai-agent-worker.py` - Main agent worker
- `.claude/settings.json` - Claude Code settings

**Project Documentation:**
- `/docs/architecture/system-design.md` - Complete system architecture
- `/docs/architecture/SECURITY-ARCHITECTURE.md` - Security model
- `CLAUDE.md` - Project context loaded into every Claude Code session

**Architecture Decisions:**
- `.claude/docs/ARCHITECTURE-AGENT-WORKER.md` - Agent execution engine decision

---

## Contact

**Maintained by:** Glen Barnhardt with help from Claude Code
**Last updated:** 2025-11-13
