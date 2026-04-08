<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:dev-server-rules -->
# Dev server lifecycle — READ BEFORE STARTING `next dev`

**`next dev` is disabled at the binary level in this project.** The wrapper at `node_modules/.bin/next` refuses the `dev` subcommand and exits with an error. This is intentional, not a bug.

Why: this project's `next dev` (Next.js 16.2.2 + Tailwind v4 + Turbopack) spawns 50+ `@tailwindcss/postcss` worker processes during normal startup. Combined RAM hits ~5 GB and on macOS (no OOM killer for user processes) the system freezes hard enough to require a force-restart. There is no documented config option in Next.js 16.2.2 to cap dev-mode postcss workers. This has happened repeatedly. The user has hard-reset their laptop multiple times.

## How to run a dev server safely

Use the wrapper script:

```bash
npm run dev:start    # background dev server on port 3099, killing any prior tree first
npm run dev:stop     # kill the dev server AND all postcss worker children
npm run dev:restart  # stop then start
npm run dev:status   # show pid + live worker count
```

`dev:start` sets the `PAPERCLIP_DEV_SERVER_OK=1` environment variable that bypasses the `next` wrapper, then runs the real binary, and tracks the PID for clean teardown. `dev:stop` kills the entire process tree (parent + postcss workers) — *not* just the parent — so workers can't leak.

Override the port with `PORT=3100 npm run dev:start` if needed.

## Rules

1. **Never** invoke `next dev` directly. The wrapper will refuse it. This is by design. Do not waste time trying alternate forms (`npx next dev`, `node node_modules/next/dist/bin/next dev`, etc.) — go through `npm run dev:start`.
2. **Never** use `lsof -ti:PORT | xargs kill -9` to stop the dev server. That only kills the parent bound to the port; the postcss worker children get reparented to PID 1 and leak forever. Use `npm run dev:stop`.
3. **Never** background `next dev` directly with `&`. Even if you bypass the wrapper, the workers will leak when your shell exits.
4. If `npm run dev:status` shows `postcss workers > 0` after a stop, something escaped cleanup — run `pkill -9 -f 'lodge-color-design.*postcss.js'` to clean up, and figure out why before continuing.
5. The wrapper lives at `scripts/dev-server.sh`. If dev server behavior needs to change, change it there, not by inventing one-off shell commands in your run.

## What to do if `npm install` clobbers the wrapper

`npm install` restores the original `node_modules/.bin/next` symlink, but a `postinstall` hook runs `scripts/install-next-wrapper.sh` to put our wrapper back. If `npm run dev:start` ever lets `next dev` run *without* printing the bypass message, the wrapper got lost — re-run `npm run dev:install-wrapper` to reinstall it. The source of truth is `scripts/next-wrapper.sh`.
<!-- END:dev-server-rules -->
