/** @type {import('next').NextConfig} */
const nextConfig = {
  // The /api/* proxy is handled by src/app/api/[...path]/route.js
  // which correctly forwards Set-Cookie headers from the Express backend.

  // Allow Next.js <Image> to load from external hosts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Allow self-hosted uploads served by the Express backend
        protocol: "https",
        hostname: "*.railway.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
