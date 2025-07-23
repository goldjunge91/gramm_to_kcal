import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import FlyingSchnitzel from "@/components/FlyingSchnitzel";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { initializeRedis } from "@/lib/redis";

import "./globals.css";
import { Providers } from "./providers";

// Initialize Redis on app startup
if (typeof window === "undefined") {
    initializeRedis();
}

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "CalorieTracker - Kalorienvergleich & Rezept-Manager",
    description:
        "Vergleiche Produkte nach Kaloriendichte und skaliere Rezepte dynamisch",
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    themeColor: "#000000",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>
                    <Navbar />
                    <FlyingSchnitzel />
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
