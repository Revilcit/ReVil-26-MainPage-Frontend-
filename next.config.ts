import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
    formats: ["image/avif", "image/webp"], // Modern image formats
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // Remove console.logs in production
  },

  // Enable SWC minification for faster builds
  // swcMinify: true,

  // Experimental features for better performance
  experimental: {
    optimizeCss: true, // CSS optimization
  },
};

export default nextConfig;
