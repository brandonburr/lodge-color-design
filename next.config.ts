import type { NextConfig } from "next";
import path from "path";

// basePath/assetPrefix are conditional on prod so the dev server serves at /
// instead of /lodge-color-design/ (which returns 404 at the root URL and looks
// like a broken dev server). Production export still deploys to GitHub Pages
// under /lodge-color-design.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  ...(isProd && {
    basePath: "/lodge-color-design",
    assetPrefix: "/lodge-color-design/",
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/lodge-color-design" : "",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  // experimental.cpus caps build-time workers but does NOT cap dev-mode
  // postcss workers (which is what freezes the host). To prevent runaway
  // dev-server worker spawning, raw `next dev` is disabled by the wrapper
  // at node_modules/.bin/next; use `npm run dev:start` instead. See
  // scripts/dev-server.sh and AGENTS.md for the full explanation.
  experimental: {
    cpus: 2,
    staticGenerationMinPagesPerWorker: 1000,
  },
};

export default nextConfig;
