import type { Metadata } from "next";

import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";

import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";

import { Providers } from "./providers";
import "./globals.css";

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
  description: "Vergleiche Produkte nach Kaloriendichte und skaliere Rezepte dynamisch",
  manifest: "/manifest.json",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
           <Providers>
            <Navbar />
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
