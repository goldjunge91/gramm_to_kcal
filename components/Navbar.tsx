"use client";

import { Calculator, ChefHat } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type JSX } from "react";

import { ThemeToggle } from "./ThemeToggle";

/** Navigation bar component for switching between app pages */
export const Navbar = (): JSX.Element => {
  const pathname = usePathname();
  const [clientPathname, setClientPathname] = useState<string>('');
  
  // Set the client pathname after hydration to avoid mismatch
  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold">
              CalorieTracker
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/calories"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientPathname === "/calories"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Kalorienvergleich</span>
            </Link>
            <Link
              href="/recipe"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientPathname === "/recipe"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ChefHat className="h-4 w-4" />
              <span>Rezept-Manager</span>
            </Link>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              href="/calories"
              className={`p-2 rounded-md ${
                clientPathname === "/calories"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label="Kalorienvergleich"
            >
              <Calculator className="h-5 w-5" />
            </Link>
            <Link
              href="/recipe"
              className={`p-2 rounded-md ${
                clientPathname === "/recipe"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label="Rezept-Manager"
            >
              <ChefHat className="h-5 w-5" />
            </Link>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};