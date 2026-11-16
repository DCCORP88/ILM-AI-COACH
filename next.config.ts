import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Coaching content is read from disk on the server at runtime; never bundled to the browser.
  serverExternalPackages: ["@prisma/client"],
  outputFileTracingIncludes: { "/**": ["./coaching/**/*.md", "./coaching/manifest.json"] },
};

export default nextConfig;
