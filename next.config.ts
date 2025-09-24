/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ new way in Next.js 15+
  serverExternalPackages: ["googleapis"],

  // optional but good practice
  reactStrictMode: true,
};

export default nextConfig;
