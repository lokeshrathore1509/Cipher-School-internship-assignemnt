import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure server components can import prisma safely
  serverExternalPackages: ["@prisma/client", "prisma"],
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
