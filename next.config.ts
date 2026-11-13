import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  serverExternalPackages: ["unpdf", "mammoth", "openai", "@anthropic-ai/sdk"],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "pro-resume-tailor.vercel.app" }],
        destination: "https://proresumetailor.com/:path*",
        permanent: true,
      },
    ];
  },
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
