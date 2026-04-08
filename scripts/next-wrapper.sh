#!/usr/bin/env bash
# next wrapper — refuses raw `next dev` to prevent host freeze
#
# This file is the SOURCE for node_modules/.bin/next. It is installed there by
# scripts/install-next-wrapper.sh, which runs automatically as a `postinstall`
# hook in package.json. If you edit this file, re-run `npm run dev:install-wrapper`
# (or `npm install`) to propagate the changes.
#
# Why:
# This project's `next dev` (Next.js 16.2.2 + Tailwind v4 + Turbopack) spawns
# 50+ postcss worker processes via @tailwindcss/postcss during normal dev
# startup. Each worker is ~75 MB. Combined RAM exceeds 5 GB and on macOS
# (which has no OOM killer for user processes) the system freezes hard
# enough to require a force-restart. There is no documented config option
# in Next.js 16.2.2 to cap dev-mode postcss workers — `experimental.cpus`
# only governs build-time workers.
#
# This wrapper replaces the npm-installed `next` symlink at
# node_modules/.bin/next. It refuses the `dev` subcommand and passes
# everything else through to the real next binary unchanged. This makes
# the dangerous code path physically unavailable so agents can't reach
# it by typing `npx next dev` or invoking the binary from a shell snippet.
#
# Escape hatch:
# `./scripts/dev-server.sh start` (and `npm run dev:start`) sets the
# environment variable PAPERCLIP_DEV_SERVER_OK=1 before exec'ing this
# wrapper. When the variable is set, `next dev` is allowed through. The
# dev-server.sh wrapper is responsible for proper process-tree cleanup
# on stop, so leakage of postcss workers is contained.

set -u

if [[ "${1:-}" == "dev" ]]; then
  if [[ "${PAPERCLIP_DEV_SERVER_OK:-}" != "1" ]]; then
    cat >&2 <<'EOF'
next: 'next dev' is disabled in this project to prevent runaway postcss
      worker spawning that has previously frozen the host machine and
      required a hard reset.

      Use the safe wrapper instead:

          ./scripts/dev-server.sh start    # start dev server in background
          ./scripts/dev-server.sh stop     # kill dev server + all workers
          ./scripts/dev-server.sh status   # check if it's running
          npm run dev:start                # same as above, npm-flavored

      The wrapper does proper process-tree cleanup on stop, so postcss
      workers can't leak. See AGENTS.md > dev-server-rules for the full
      explanation.

      If you absolutely must run raw `next dev` for some reason (e.g.
      debugging this wrapper itself), prefix the command with the
      bypass env var:

          PAPERCLIP_DEV_SERVER_OK=1 next dev

      and accept that you are responsible for cleaning up the worker tree
      yourself afterward.

EOF
    exit 1
  fi
fi

# Pass everything else through to the real next binary.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REAL_NEXT="$SCRIPT_DIR/../next/dist/bin/next"

if [[ ! -f "$REAL_NEXT" ]]; then
  echo "next wrapper: cannot find real next binary at $REAL_NEXT" >&2
  echo "next wrapper: maybe \`npm install\` clobbered something? try reinstalling next." >&2
  exit 127
fi

exec node "$REAL_NEXT" "$@"
