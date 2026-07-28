/** @type {import('next').NextConfig} */
const nextConfig = {
  // The /api/* proxy is handled by src/app/api/[...path]/route.js
  // which correctly forwards Set-Cookie headers from the Express backend.
  // The previous next.config rewrite is intentionally removed because
  // Next.js rewrites silently drop Set-Cookie, breaking session persistence.
};

export default nextConfig;
