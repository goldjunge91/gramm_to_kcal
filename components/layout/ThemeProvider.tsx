"use client";

import type { ReactNode } from "react";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/**
 * ThemeProvider kapselt die Theme-Logik und stellt den Kontext für das globale Farbschema bereit.
 * Wrappe deine App mit diesem Provider, damit ThemeToggle und andere Komponenten das Theme steuern können.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <NextThemeProvider
            attribute="class"
            themes={["light", "dark", "gunter"]}
            defaultTheme="light"
        >
            {children}
        </NextThemeProvider>
    );
}
