import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async redirects() {
    return [
      {
        source: "/topics",
        destination: "/postgresql/topics",
        permanent: false,
      },
      {
        source: "/practice/:slug",
        destination: "/postgresql/practice/:slug",
        permanent: false,
      },
      {
        source: "/playground",
        destination: "/postgresql/playground",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/postgresql/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
