import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  // Proxy all /api requests to the backend from the Next.js server, so the
  // browser only ever talks to the current origin. This makes login work on
  // localhost, ngrok, and port forwarding (no CORS, no mixed content, and
  // auth cookies become first-party).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;