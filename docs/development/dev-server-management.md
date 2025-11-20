# Dev Server Management

This document explains how to manage the Tauri development server to prevent orphaned processes and port conflicts.

## The Problem

Previously, running `npm run tauri dev` multiple times could create orphaned background processes that would:
- Consume system resources
- Cause port conflicts
- Make it unclear which instance was actually running
- Require manual cleanup with `pkill` or `lsof`

## The Solution

We've created a dev server management script that ensures only one instance runs at a time.

## Available Commands

### Start Dev Server (Recommended)
```bash
npm run dev:safe
```
This will:
1. Kill any existing dev server processes
2. Start a new dev server
3. Track the process with a PID file
4. Log output to `.dev-server.log`

### Stop Dev Server
```bash
npm run dev:stop
```
Stops the currently running dev server gracefully.

### Restart Dev Server
```bash
npm run dev:restart
```
Stops and restarts the dev server in one command.

### Check Status
```bash
npm run dev:status
```
Shows whether the dev server is currently running and displays the PID.

### Clean Up All Processes
```bash
npm run dev:cleanup
```
Kills ALL dev-related processes (npm, tauri, next-server) even if not tracked by the PID file. Use this if processes get orphaned.

### View Logs
```bash
npm run dev:logs
```
Tails the dev server log file in real-time.

## Workflow Examples

### Starting Development
```bash
# Clean start (kills any existing instances first)
npm run dev:safe

# Or if you prefer to check first
npm run dev:status
npm run dev:stop
npm run dev:safe
```

### Debugging Issues
```bash
# View real-time logs
npm run dev:logs

# Check if server is running
npm run dev:status
```

### End of Day Cleanup
```bash
# Stop the server
npm run dev:stop

# Or nuclear option (kills everything)
npm run dev:cleanup
```

## How It Works

The script (`scripts/dev-server.sh`) manages the dev server lifecycle:

1. **PID Tracking**: Stores process ID in `.dev-server.pid`
2. **Log Management**: Writes output to `.dev-server.log`
3. **Port Cleanup**: Kills processes on ports 37002, 9001, and 3000
4. **Process Cleanup**: Kills npm, tauri, and next-server processes

## Files Created

- `.dev-server.pid` - Process ID of running server (git ignored)
- `.dev-server.log` - Server output logs (git ignored)

Both files are automatically excluded from git.

## For AI Agents

When working with Claude Code or other AI agents:

1. **Always use `npm run dev:safe`** instead of `npm run tauri dev`
2. **Run `npm run dev:cleanup`** before starting if there are port conflicts
3. **Use `npm run dev:logs`** to monitor server output
4. **Never run `npm run tauri dev` in background** - let the script handle it

## Troubleshooting

### Port Already in Use
```bash
npm run dev:cleanup
npm run dev:safe
```

### Server Won't Start
```bash
# Check logs for errors
npm run dev:logs

# Or view the log file directly
cat .dev-server.log
```

### Multiple Processes Running
```bash
# Nuclear option - kills everything
npm run dev:cleanup

# Then start fresh
npm run dev:safe
```

### PID File Out of Sync
If the PID file exists but process isn't running:
```bash
rm .dev-server.pid
npm run dev:safe
```

## Migration Guide

### Old Way (Problematic)
```bash
npm run tauri dev          # Could create orphaned processes
npm run tauri dev &        # Even worse - background process
pkill -f "tauri dev"       # Manual cleanup required
```

### New Way (Recommended)
```bash
npm run dev:safe           # Automatic cleanup + start
npm run dev:stop           # Graceful stop
npm run dev:cleanup        # When things go wrong
```

## Technical Details

The script handles these edge cases:

1. **Orphaned Processes**: Cleans up processes even if PID file is missing
2. **Port Conflicts**: Explicitly kills processes on known ports
3. **Stale PID Files**: Removes PID files if process isn't actually running
4. **Multiple Instances**: Ensures only one instance runs at a time
5. **Graceful Shutdown**: Tries SIGTERM before SIGKILL

## Future Improvements

Potential enhancements for this system:

- [ ] Add health check endpoint
- [ ] Auto-restart on crash
- [ ] Better log rotation
- [ ] Process monitoring/stats
- [ ] Integration with system service managers (launchd, systemd)

---

*Last updated: 2025-11-15*
