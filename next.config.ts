import type { NextConfig } from "next";

import withBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    "http://127.51.68.120:3000",
    "http://localhost:3000",
    "https://gramm-to-kcal.vercel.app",
  ],
  transpilePackages: ["@scanbot/scanbot-web-sdk-react"],

  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.openfoodfacts.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    // This is set to true to ensure that TypeScript errors are treated as build errors.
    ignoreBuildErrors: true,
  },
};
export default withBundleAnalyzerConfig(nextConfig);
