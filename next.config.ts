import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.31.128.1", "192.168.*.*"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
