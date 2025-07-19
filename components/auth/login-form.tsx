"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Optional: Redirect nach Login
      window.location.href = "/calories";
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: "github" | "google" | "facebook",
  ) => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/calories`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Mit E-Mail/Passwort oder Social Login anmelden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-6">
            {error && <p className="text-sm text-destructive-500">{error}</p>}
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border rounded px-3 py-2"
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border rounded px-3 py-2"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Einloggen..." : "Mit E-Mail/Passwort einloggen"}
            </Button>
          </form>
          <div className="mt-6 flex flex-col gap-2">
            <span className="text-center text-xs text-muted-foreground">
              Oder mit Social Login:
            </span>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M10 .3a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2.2-.2-4.5-1.1-4.5-5A4 4 0 0 1 4.7 7.2c-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.7 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5a4 4 0 0 1 1.1 2.8c0 3.9-2.3 4.8-4.5 5 .3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A10 10 0 0 0 10 .3" />
                </svg>
                Github
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleSocialLogin("facebook")}
                disabled={isLoading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M29 0H3C1.3 0 0 1.3 0 3v26c0 1.7 1.3 3 3 3h13V20h-4v-5h4v-3.7C16 8.6 18.4 7 21.1 7c1.2 0 2.5.2 2.5.2v4h-1.4c-1.4 0-1.8.9-1.8 1.8V15h5l-1 5h-4v12h7c1.7 0 3-1.3 3-3V3c0-1.7-1.3-3-3-3z" />
                </svg>
                Facebook
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="inline"
                >
                  <path d="M19.6 10.2c0-.7-.1-1.4-.2-2H10v3.8h5.4c-.2 1-.8 1.8-1.6 2.3v1.9h2.6c1.5-1.4 2.2-3.5 2.2-5.9z" />
                  <path d="M10 20c2.7 0 5-1 6.6-2.7l-3.2-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H1.2v2.6A10 10 0 0 0 10 20z" />
                  <path d="M4.4 12.3c-.2-.6-.4-1.3-.4-2s.2-1.4.4-2V5.7H1.2A10 10 0 0 0 0 10c0 1.6.4 3.1 1.2 4.3l3.2-2.6z" />
                  <path d="M10 4c1.5 0 2.8.5 3.8 1.4l2.8-2.8A10 10 0 0 0 10 0C6.1 0 2.7 2.4 1.2 5.7l3.2 2.6C5.2 5.7 7.4 4 10 4z" />
                </svg>
                Google
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
