import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: [
    "@solana/kit",
    "@solana/kit-plugin-rpc",
    "@solana/kit-plugin-wallet",
    "@solana/react",
    "@solana-program/memo",
  ],
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
