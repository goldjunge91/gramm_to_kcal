"use client";

import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function ThemeSwitcher(props: any) {
  const { setTheme } = useTheme();
  return (
    <ThemeToggle
      {...props}
      onToggle={(checked) => setTheme(checked ? "light" : "dark")}
    />
  );
}
