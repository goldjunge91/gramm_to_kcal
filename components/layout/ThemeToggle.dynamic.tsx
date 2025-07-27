/**
 * Dynamic ThemeToggle Component
 * Dynamically imports the animated theme toggle for better performance
 */

"use client";

import type { JSX } from "react";
import type * as React from "react";

import { Loader2, Moon, Sun } from "lucide-react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
    defaultChecked?: boolean;
    checked?: boolean;
    onToggle?: (checked: boolean) => void;
}

// Simple loading component that shows a static toggle
function ThemeToggleLoading({
    className,
}: {
    className?: string;
}): JSX.Element {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            disabled
        >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="sr-only">Theme wird geladen...</span>
        </Button>
    );
}

// Dynamic import with loading state
const DynamicThemeToggle = dynamic(
    () => import("./ThemeToggle").then(mod => ({ default: mod.ThemeToggle })),
    {
        loading: () => <ThemeToggleLoading />,
        ssr: false, // Theme toggle needs client-side theme detection
    },
);

/**
 * Dynamic wrapper for animated ThemeToggle component
 * Only loads framer-motion when the component is rendered
 */
export function ThemeToggle({
    className,
    defaultChecked,
    checked,
    onToggle,
}: ThemeToggleProps): JSX.Element {
    // Type assertion to resolve the onToggle conflict between HTMLAttributes and our custom prop
    const Component = DynamicThemeToggle as React.ComponentType<ThemeToggleProps>;
    return (
        <Component
            className={className}
            defaultChecked={defaultChecked}
            checked={checked}
            onToggle={onToggle}
        />
    );
}

// Also export the static version for cases where animation isn't needed
export function StaticThemeToggle({
    className,
    checked,
    onToggle,
}: {
    className?: string;
    checked?: boolean;
    onToggle?: (checked: boolean) => void;
}): JSX.Element {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9", className)}
            onClick={() => onToggle?.(!checked)}
        >
            {checked ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Theme umschalten</span>
        </Button>
    );
}
