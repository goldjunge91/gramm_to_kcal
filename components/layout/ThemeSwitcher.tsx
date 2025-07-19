"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function ThemeSwitcher(props: any) {
  const { setTheme, theme } = useTheme();
  const [isLightMode, setIsLightMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before checking theme to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update local state when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    if (theme === "light") {
      setIsLightMode(true);
    } else if (theme === "dark") {
      setIsLightMode(false);
    }
    // For gunter theme, we keep the current light/dark state
  }, [theme, mounted]);

  const handleToggle = (checked: boolean) => {
    // If gunter is active, switching to light/dark should deactivate gunter
    if (theme === "gunter") {
      // Switch to the toggled light/dark theme
      const newTheme = checked ? "light" : "dark";
      setTheme(newTheme);
      setIsLightMode(checked);
    } else {
      // Normal light/dark switching
      setIsLightMode(checked);
      const newTheme = checked ? "light" : "dark";
      setTheme(newTheme);
    }
  };

  // Show consistent state during SSR/hydration
  if (!mounted) {
    return (
      <ThemeToggle
        {...props}
        checked={true}
        onToggle={() => {}}
        className=""
      />
    );
  }

  return (
    <ThemeToggle
      {...props}
      checked={isLightMode}
      onToggle={handleToggle}
      className={theme === "gunter" ? "opacity-60" : ""}
    />
  );
}
