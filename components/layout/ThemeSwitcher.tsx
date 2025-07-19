"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function ThemeSwitcher(props: any) {
  const { setTheme, theme } = useTheme();
  const [isLightMode, setIsLightMode] = useState(true);

  // Update local state when theme changes
  useEffect(() => {
    if (theme === "light") {
      setIsLightMode(true);
    } else if (theme === "dark") {
      setIsLightMode(false);
    }
    // For gunter theme, we keep the current light/dark state
  }, [theme]);

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

  return (
    <ThemeToggle
      {...props}
      checked={isLightMode}
      onToggle={handleToggle}
      className={theme === "gunter" ? "opacity-60" : ""}
    />
  );
}
