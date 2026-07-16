/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // NEXT_PUBLIC_API_URL is e.g. "http://localhost:5000/api"
    // Strip trailing "/api" so the rewrite destination doesn't double it:
    //   browser  → /api/auth/login
    //   rewrite  → http://localhost:5000/api/auth/login  ✓
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
      .replace(/\/api\/?$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
