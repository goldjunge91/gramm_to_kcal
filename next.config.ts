// import type { NextConfig } from "next";

// import withBundleAnalyzer from "@next/bundle-analyzer";

// import { env } from "./lib/env";

// const withBundleAnalyzerConfig = withBundleAnalyzer({
//     enabled: env.ANALYZE === "true",
// });

// const baseConfig: NextConfig = {
//     reactStrictMode: true,
//     allowedDevOrigins: [
//         "http://127.51.68.120:3000",
//         "http://localhost:3000",
//         env.NEXT_PUBLIC_URL,
//     ],
//     transpilePackages: ["@scanbot/scanbot-web-sdk-react"],

//     /* config options here */
//     images: {
//         remotePatterns: [
//             {
//                 protocol: "https",
//                 hostname: "images.unsplash.com",
//                 port: "",
//                 pathname: "/**",
//             },
//             {
//                 protocol: "https",
//                 hostname: "googleusercontent.com",
//                 port: "",
//                 pathname: "/**",
//             },
//             {
//                 protocol: "https",
//                 hostname: "lh3.googleusercontent.com",
//                 port: "",
//                 pathname: "/**",
//             },
//             {
//                 protocol: "https",
//                 hostname: "avatars.githubusercontent.com",
//                 port: "",
//                 pathname: "/**",
//             },
//             {
//                 protocol: "https",
//                 hostname: "images.openfoodfacts.org",
//                 port: "",
//                 pathname: "/**",
//             },
//         ],
//     },
// };

// // Emergency build configuration - only use when absolutely necessary
// const nextConfig: NextConfig = env.FORCE_BUILD
//     ? (() => {
//             console.warn("⚠️  WARNING: FORCE_BUILD is enabled - TypeScript and ESLint errors will be ignored!");
//             return {
//                 ...baseConfig,
//                 typescript: {
//                     // WARNING: Only for emergency builds - fix TypeScript errors ASAP
//                     ignoreBuildErrors: true,
//                 },
//                 eslint: {
//                     // WARNING: Only for emergency builds - fix ESLint errors ASAP
//                     ignoreDuringBuilds: true,
//                 },
//             };
//         })()
//     : baseConfig;

// export default withBundleAnalyzerConfig(nextConfig);
import type { NextConfig } from "next";

import withBundleAnalyzer from "@next/bundle-analyzer";

import { env } from "./lib/env";

const withBundleAnalyzerConfig = withBundleAnalyzer({
    enabled: env.ANALYZE === "true",
});

const baseConfig: NextConfig = {
    reactStrictMode: true,
    allowedDevOrigins: [
        "http://127.51.68.120:3000",
        "http://localhost:3000",
        env.NEXT_PUBLIC_URL!,
    ],
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
};

// Emergency build configuration - only use when absolutely necessary
const nextConfig: NextConfig = env.FORCE_BUILD
    ? (() => {
            console.warn("⚠️  WARNING: FORCE_BUILD is enabled - TypeScript and ESLint errors will be ignored!");
            return {
                ...baseConfig,
                typescript: {
                    // WARNING: Only for emergency builds - fix TypeScript errors ASAP
                    ignoreBuildErrors: true,
                },
                eslint: {
                    // WARNING: Only for emergency builds - fix ESLint errors ASAP
                    ignoreDuringBuilds: true,
                },
            };
        })()
    : baseConfig;

export default withBundleAnalyzerConfig(nextConfig);
