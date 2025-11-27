#!/bin/bash

# Quetrex Dev Server Manager
# Ensures only one instance of the dev server runs at a time

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PIDFILE="$PROJECT_ROOT/.dev-server.pid"
LOGFILE="$PROJECT_ROOT/.dev-server.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[dev-server]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[dev-server]${NC} $1"
}

error() {
  echo -e "${RED}[dev-server]${NC} $1"
}

# Function to kill existing dev processes
cleanup_existing() {
  log "Checking for existing dev processes..."

  # Kill by PID file if it exists
  if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
      warn "Found existing dev server (PID: $OLD_PID), stopping..."
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
      # Force kill if still running
      if ps -p "$OLD_PID" > /dev/null 2>&1; then
        kill -9 "$OLD_PID" 2>/dev/null || true
      fi
    fi
    rm -f "$PIDFILE"
  fi

  # Kill any remaining npm/tauri processes
  pkill -f "npm run tauri dev" 2>/dev/null || true
  pkill -f "tauri dev" 2>/dev/null || true
  pkill -f "next-server" 2>/dev/null || true

  # Kill processes on common ports
  lsof -ti:37002 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:9001 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

  sleep 1
  log "Cleanup complete"
}

# Function to start the dev server
start_dev_server() {
  log "Starting dev server..."

  cd "$PROJECT_ROOT"

  # Start the dev server in background and capture PID
  npm run tauri dev > "$LOGFILE" 2>&1 &
  DEV_PID=$!

  # Save PID to file
  echo "$DEV_PID" > "$PIDFILE"

  log "Dev server started (PID: $DEV_PID)"
  log "Logs: $LOGFILE"
  log "To stop: npm run dev:stop or kill $DEV_PID"

  # Wait a few seconds and check if process is still running
  sleep 3
  if ! ps -p "$DEV_PID" > /dev/null 2>&1; then
    error "Dev server failed to start. Check logs: $LOGFILE"
    exit 1
  fi

  log "Dev server is running successfully"

  # Optionally tail the log
  if [ "${TAIL_LOG:-}" = "true" ]; then
    tail -f "$LOGFILE"
  fi
}

# Function to stop the dev server
stop_dev_server() {
  log "Stopping dev server..."
  cleanup_existing
  log "Dev server stopped"
}

# Function to check status
check_status() {
  if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
      log "Dev server is running (PID: $PID)"
      exit 0
    else
      warn "PID file exists but process is not running"
      rm -f "$PIDFILE"
      exit 1
    fi
  else
    warn "Dev server is not running"
    exit 1
  fi
}

# Main command dispatcher
case "${1:-start}" in
  start)
    cleanup_existing
    start_dev_server
    ;;
  stop)
    stop_dev_server
    ;;
  restart)
    stop_dev_server
    sleep 1
    start_dev_server
    ;;
  status)
    check_status
    ;;
  cleanup)
    cleanup_existing
    ;;
  logs)
    if [ -f "$LOGFILE" ]; then
      tail -f "$LOGFILE"
    else
      error "Log file not found: $LOGFILE"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|cleanup|logs}"
    echo ""
    echo "Commands:"
    echo "  start    - Start the dev server (kills any existing instances first)"
    echo "  stop     - Stop the dev server"
    echo "  restart  - Restart the dev server"
    echo "  status   - Check if dev server is running"
    echo "  cleanup  - Kill all existing dev processes"
    echo "  logs     - Tail the dev server logs"
    exit 1
    ;;
esac
