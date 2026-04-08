#!/usr/bin/env bash
# scripts/install-next-wrapper.sh — install/refresh the next-binary wrapper
#
# `npm install` always restores the real next symlink at
# node_modules/.bin/next, which clobbers our safety wrapper. This script
# copies scripts/next-wrapper.sh into place, replacing the symlink. It runs
# automatically as a `postinstall` hook in package.json so the wrapper is
# always present after any `npm install` or `npm ci`.
#
# Safe to run by hand at any time:
#   npm run dev:install-wrapper
#
# It is intentionally tolerant of node_modules being absent (so cloning the
# repo and running `npm install` for the first time doesn't fail before
# node_modules exists).

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRAPPER_SRC="$SCRIPT_DIR/next-wrapper.sh"
WRAPPER_DEST="$PROJECT_DIR/node_modules/.bin/next"

if [[ ! -f "$WRAPPER_SRC" ]]; then
  echo "install-next-wrapper: source missing at $WRAPPER_SRC" >&2
  exit 1
fi

if [[ ! -d "$PROJECT_DIR/node_modules/.bin" ]]; then
  # node_modules not present yet; nothing to wrap. The postinstall hook will
  # re-run after install completes.
  exit 0
fi

# Replace the symlink (or whatever is at the dest) with our wrapper.
rm -f "$WRAPPER_DEST"
cp "$WRAPPER_SRC" "$WRAPPER_DEST"
chmod +x "$WRAPPER_DEST"

echo "install-next-wrapper: installed safety wrapper at $WRAPPER_DEST" >&2
