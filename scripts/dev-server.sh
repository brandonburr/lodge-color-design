#!/usr/bin/env bash
# scripts/dev-server.sh — safe Next.js dev server lifecycle for lodge-color-design
#
# Why this exists:
# `next dev` spawns a tree of postcss worker subprocesses. Killing the dev
# server with `lsof -ti:PORT | xargs kill -9` ONLY kills the parent that
# holds the listening socket — the postcss workers get re-parented to PID 1
# and leak forever. After enough start/stop cycles they consume all RAM and
# freeze the machine. This wrapper kills the entire process tree on stop.
#
# Usage:
#   ./scripts/dev-server.sh start    # kill any prior tree, start a fresh server in the background
#   ./scripts/dev-server.sh stop     # kill the server AND every postcss worker child
#   ./scripts/dev-server.sh restart  # stop then start
#   ./scripts/dev-server.sh status   # show pid + worker count
#
# Port defaults to 3099. Override with: PORT=3100 ./scripts/dev-server.sh start

set -u

PORT="${PORT:-3099}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
PID_FILE="$PROJECT_DIR/.next/dev-server.pid"
LOG_FILE="$PROJECT_DIR/.next/dev-server.log"

mkdir -p "$PROJECT_DIR/.next"

# Kill the entire next-dev process tree for THIS project.
# Critical: do NOT just use `lsof -ti:PORT | xargs kill -9` — it leaks
# postcss workers. We have to match the workers explicitly.
kill_tree() {
  # 1. Kill the postcss workers first so they can't try to respawn.
  #    Match by project name to avoid touching other projects' dev servers.
  pkill -9 -f "${PROJECT_NAME}/.next/dev/build/postcss.js" 2>/dev/null || true

  # 2. Kill any next dev process pointing at this project.
  pkill -9 -f "${PROJECT_NAME}.*next dev" 2>/dev/null || true

  # 3. Kill anything still bound to the port (belt and suspenders).
  local port_pids
  port_pids=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [[ -n "$port_pids" ]]; then
    echo "$port_pids" | xargs kill -9 2>/dev/null || true
  fi

  # 4. Clean up the PID file's process if anything is left.
  if [[ -f "$PID_FILE" ]]; then
    local saved_pid
    saved_pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
    if [[ -n "$saved_pid" ]]; then
      kill -9 "$saved_pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi

  # Give the kernel a beat to reap.
  sleep 0.3
}

cmd_start() {
  kill_tree
  echo "starting next dev on port $PORT..." >&2
  cd "$PROJECT_DIR"
  # PAPERCLIP_DEV_SERVER_OK=1 is the bypass for the next.js wrapper at
  # node_modules/.bin/next which refuses raw `next dev` invocations.
  # Only this script is supposed to set it.
  PAPERCLIP_DEV_SERVER_OK=1 nohup npx next dev -p "$PORT" > "$LOG_FILE" 2>&1 &
  local pid=$!
  echo "$pid" > "$PID_FILE"
  disown "$pid" 2>/dev/null || true
  echo "started: pid=$pid port=$PORT log=$LOG_FILE" >&2
}

cmd_stop() {
  kill_tree
  echo "stopped: dev server tree killed cleanly" >&2
}

cmd_restart() {
  cmd_stop
  cmd_start
}

cmd_status() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    echo "next dev: running (pid=$(cat "$PID_FILE"))"
  else
    echo "next dev: not running"
  fi
  local worker_count
  worker_count=$(pgrep -f "${PROJECT_NAME}/.next/dev/build/postcss.js" 2>/dev/null | wc -l | tr -d ' ')
  echo "postcss workers: $worker_count"
}

case "${1:-}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  restart) cmd_restart ;;
  status)  cmd_status ;;
  *)
    cat <<EOF
usage: $0 {start|stop|restart|status}

start    kill any prior dev-server tree, then start a fresh one in the background on port \$PORT (default 3099)
stop     kill the dev server AND every postcss worker child (the part lsof+kill misses)
restart  stop, then start
status   show pid and worker count

Override port: PORT=3100 $0 start
EOF
    exit 1
    ;;
esac
