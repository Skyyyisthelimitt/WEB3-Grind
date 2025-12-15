/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ new way in Next.js 15+
  serverExternalPackages: ["googleapis"],

  // optional but good practice
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "www.bybit.com",
      },
      {
        protocol: "https",
        hostname: "public.bnbstatic.com",
      },
    ],
  },
};

export default nextConfig;
