import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "kiwiglobetours.co.nz" },
      { protocol: "https", hostname: "**.kiwiglobetours.co.nz" },
      // Vercel Blob storage — admin-uploaded images
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
