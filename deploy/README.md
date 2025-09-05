# Sentra

Observability and orchestration system for Claude Code development workflows.

## Architecture

Sentra provides:
- **Observability** with voice + phone approvals for dangerous actions
- **Context management** via sub-agents with Postgres/pgvector memory
- **MCP server** exposing tools for notifications, approvals, memory, and task management
- **Single-source memory** in Postgres with vector search capabilities

## Components

### Server (Lightsail)
- FastAPI API + MCP endpoint
- Master Orchestrator worker
- Postgres + pgvector for storage
- Pushover notifications with OpenAI TTS
- Caddy reverse proxy with auto-TLS

### Local Development
- `sentra-guard.sh` - wraps dangerous commands, requests approval
- `sentra-bridge.py` - polls server, replays approved commands to tmux
- `sentra-start` - launches tmux sessions with proper environment

## Quick Start

### Server Setup (Lightsail/VPS)
```bash
# Clone and setup
git clone <repo>
cd sentra
cp .env.example .env
# Edit .env with your Pushover/OpenAI tokens

# One-command server deployment
./services/scripts/bootstrap.sh
```

### Local Development Setup
```bash
# Clone repo locally
git clone <repo>
cd sentra

# One-command local installation
./install-local.sh

# Edit configuration (set your API tokens)
nano ~/.bashrc  # or ~/.zshrc

# Start development session
sentra-start ~/Projects/myproject MyProject
```

## Environment Variables

See `.env.example` for required configuration.

## License

MIT