import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // pg مكتبة Node خارجية — لا تُدمج داخل الحزمة حتى تعمل على Vercel
  serverExternalPackages: ["pg"],
};

export default nextConfig;
