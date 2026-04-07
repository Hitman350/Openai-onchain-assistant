import type { NextConfig } from "next";

const backend =
  process.env.BACKEND_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/chat", destination: `${backend}/api/chat` },
      { source: "/api/execute-tool", destination: `${backend}/api/execute-tool` },
      {
        source: "/api/conversations/:id",
        destination: `${backend}/api/conversations/:id`,
      },
      { source: "/api/conversations", destination: `${backend}/api/conversations` },
      { source: "/api/wallets/:path*", destination: `${backend}/api/wallets/:path*` },
      { source: "/api/wallets", destination: `${backend}/api/wallets` },
    ];
  },
};

export default nextConfig;
