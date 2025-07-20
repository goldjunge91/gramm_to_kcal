"use client";

import {
  Accessibility,
  Beaker,
  Book,
  Calculator,
  ChefHat,
  Cookie,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type JSX } from "react";

import { useAuth } from "@/app/providers";
import { GunterThemeButton } from "@/components/layout/GunterThemeButton";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
/** Navigation bar component for switching between app pages */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = (): JSX.Element => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [clientPathname, setClientPathname] = useState<string>("");

  // Set the client pathname after hydration to avoid mismatch
  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.push("/auth/login");
  };

  const getUserInitials = (email: string): string => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Image
                src="/gunter.png"
                alt="Logo"
                width={64}
                height={64}
                style={{ marginRight: "8px" }}
                priority
              />
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
              <Calculator className="h-8 w-8" />
              <span>Kalorienvergleich</span>
            </Link>
            <Link
              href="/anleitungsgenerator"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientPathname === "/anleitungsgenerator"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Book className="h-8 w-8" />
              <span>Anleitungsgenerator</span>
            </Link>
            <Link
              href="/recipe"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientPathname === "/recipe"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ChefHat className="h-8 w-8" />
              <span>Rezept-Manager</span>
            </Link>
            <Link
              href="/unit-converter"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                clientPathname === "/unit-converter"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Beaker className="h-8 w-8" />
              <span>Unit-Converter</span>
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
            <Link
              href="/unit-converter"
              className={`p-2 rounded-md ${
                clientPathname === "/unit-converter"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label="Unit-Converter"
            >
              <Cookie className="h-5 w-5" />
            </Link>
            <Link
              href="/anleitungsgenerator"
              className={`p-2 rounded-md ${
                clientPathname === "/anleitungsgenerator"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              aria-label="Anleitungsgenerator"
            >
              <Beaker className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <GunterThemeButton />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <User className="mr-2 h-8 w-8" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Settings className="mr-2 h-8 w-8" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-8 w-8" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !loading && (
                <div className="flex items-center space-x-2">
                  <Button size="sm" asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                </div>
              )
            )}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <GunterThemeButton />
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || ""}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <User className="mr-2 h-8 w-8" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Settings className="mr-2 h-8 w-8" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-8 w-8" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              !loading && (
                <div className="flex items-center space-x-2">
                  <Button size="sm" asChild>
                    <Link href="/auth/login" className="flex items-center">
                      <Accessibility className="mr-1 h-8 w-8" />
                      Login
                    </Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
