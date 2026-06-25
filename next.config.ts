import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build for Docker / AWS (App Runner, ECS Fargate).
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Serve images as-is (no optimizer) so every local/remote image always loads.
    unoptimized: true,
    // Allow images hosted on the Kiwi Globe Tours WordPress site (if pasted in admin).
    remotePatterns: [
      { protocol: "https", hostname: "kiwiglobetours.co.nz" },
      { protocol: "https", hostname: "**.kiwiglobetours.co.nz" },
    ],
  },
};

export default nextConfig;
