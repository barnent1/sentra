# Sentra Quick Start Guide

5-minute guide to get up and running with Sentra AI-Powered SaaS Factory.

---

## Installation (2 minutes)

```bash
# 1. Clone and setup
git clone https://github.com/barnent1/sentra.git
cd sentra
./scripts/setup-sentra.sh

# 2. Wait for setup to complete
# Script will install everything automatically
```

---

## New Project (1 minute)

```bash
# Initialize new project
python .sentra/scripts/init-project.py --name "my-project"

# Start Voice Architect
claude
> Enable Voice Architect Skill
> I want to start Session 1 for my-project
```

Voice Architect will guide you through:
- Requirements gathering
- Architecture design
- Component planning
- Database schema

---

## Existing Project (1 minute)

```bash
# Analyze existing codebase
python .sentra/scripts/init-existing-project.py

# Review analysis
cat docs/existing-codebase/ANALYSIS-SUMMARY.md

# Start Meta Orchestrator
claude
> Enable Meta Orchestrator Skill
> I want to add [feature] to the existing codebase
```

Meta Orchestrator will:
- Follow existing patterns
- Protect critical paths
- Maintain test coverage
- Prevent breaking changes

---

## Development Workflow

### Building a Feature

```bash
# 1. Start Meta Orchestrator
claude
> Enable Meta Orchestrator Skill
> Build user authentication feature

# 2. Meta Orchestrator will:
#    - Create execution plan
#    - Spawn specialized agents (test-writer, implementation, reviewer)
#    - Ensure tests pass
#    - Maintain coverage thresholds

# 3. Review and merge
git add .
git commit -m "feat(auth): Add user authentication"
git push
```

---

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test src/services/auth.test.ts

# E2E tests
npm run test:e2e
```

---

### Monitoring Progress

```bash
# View project dashboard
python .sentra/scripts/dashboard-generator.py --serve
# Opens browser to http://localhost:8000

# Check metrics
python .sentra/scripts/metrics-collector.py --summary

# View progress
cat .sentra/architect-sessions/my-project/progress.json
```

---

## Common Commands

### Development

```bash
npm run dev              # Start dev server
npm run dev:safe         # Start with crash recovery
npm run build            # Production build
npm test                 # Run tests
npm run type-check       # Check TypeScript
```

### Skills

```bash
# Voice Architect (new projects)
claude
> Enable Voice Architect Skill

# Meta Orchestrator (complex features)
claude
> Enable Meta Orchestrator Skill

# Dependency Resolver (conflicts)
claude
> Enable Dependency Resolver Skill
```

### Scripts

```bash
# New project
python .sentra/scripts/init-project.py --name "project"

# Existing project
python .sentra/scripts/init-existing-project.py

# Dashboard
python .sentra/scripts/dashboard-generator.py --serve

# Metrics
python .sentra/scripts/metrics-collector.py --summary
```

---

## File Locations

### Configuration

```
CLAUDE.md                          # Instructions for Claude
.sentra/README.md                  # Sentra system overview
.sentra/memory/patterns.md         # Architectural patterns
```

### Project Files

```
.sentra/architect-sessions/[name]/ # Project sessions and specs
docs/specs/                        # Feature specifications
docs/existing-codebase/            # Existing code analysis
.sentra/protection/                # Protection rules
```

### Scripts

```
scripts/setup-sentra.sh            # Complete setup
scripts/install-serena.sh          # Serena MCP only
.sentra/scripts/init-project.py    # New project
.sentra/scripts/init-existing-project.py  # Existing project
```

---

## Skills Overview

### Voice Architect
- **Use for:** New project architecture
- **Reads:** Session history, patterns.md
- **Creates:** Architecture docs, component specs, database schema
- **Workflow:** Voice conversation → documented decisions

### Meta Orchestrator
- **Use for:** Complex multi-step features
- **Manages:** Test-writer, implementation, code-reviewer agents
- **Enforces:** TDD, coverage thresholds, quality gates
- **Workflow:** Plan → spawn agents → coordinate → verify

### Dependency Resolver
- **Use for:** Feature dependency conflicts
- **Analyzes:** Dependency graph, circular dependencies
- **Suggests:** Build order, resolution strategies
- **Workflow:** Detect conflict → analyze → resolve → update

### Codebase Archaeologist
- **Use for:** Understanding existing code
- **Extracts:** Patterns, critical paths, breaking changes
- **Creates:** Protection rules, pattern docs
- **Workflow:** Analyze → document → protect

---

## Next Steps

After setup:

1. **Read the docs:**
   - `CLAUDE.md` - Project instructions
   - `.sentra/README.md` - Sentra overview
   - `scripts/INSTALLATION.md` - Detailed installation

2. **Choose your path:**
   - **New project:** Use `init-project.py` + Voice Architect
   - **Existing project:** Use `init-existing-project.py` + Meta Orchestrator

3. **Start building:**
   - Enable appropriate Skill
   - Describe what you want to build
   - Let Sentra coordinate the implementation

4. **Monitor progress:**
   - View dashboard: `dashboard-generator.py --serve`
   - Check coverage: `npm test -- --coverage`
   - Review sessions: `.sentra/architect-sessions/`

---

## Support

- **Documentation:** Full docs in `docs/` directory
- **Issues:** https://github.com/barnent1/sentra/issues
- **Claude Code:** https://docs.claude.com/claude-code

---

## Tips

### Do:
- Write tests FIRST (TDD enforced)
- Use specialized Skills for their purpose
- Follow existing patterns
- Maintain coverage thresholds
- Review session documentation

### Don't:
- Skip tests (blocked by hooks)
- Use `any` or `@ts-ignore` (strict mode)
- Bypass git hooks (blocked at 3 layers)
- Modify tests without permission
- Commit without passing tests

---

**Ready to build?** Start with `./scripts/setup-sentra.sh`

**Author:** Glen Barnhardt with help from Claude Code
