import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/lodge-color-design",
  assetPrefix: "/lodge-color-design/",
  env: {
    NEXT_PUBLIC_BASE_PATH: "/lodge-color-design",
  },
};

export default nextConfig;
