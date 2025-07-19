import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

interface ServerSignUpFormProps {
  className?: string;
  error?: string;
}

/**
 * Server-side signup form using Supabase server actions
 * Provides secure authentication without client-side password exposure
 */
export function ServerSignUpForm({ className, error }: ServerSignUpFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              await signupAction(formData);
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Min. 6 characters
                  </span>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  minLength={6}
                />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button id="signup-submit" type="submit" className="w-full">
                Create account
              </Button>
              <Button
                id="signup-google"
                type="button"
                className="w-full flex items-center justify-center gap-2 mt-2 border border-gray-200"
                onClick={async () => {
                  const { createClient } = await import(
                    "@supabase/supabase-js"
                  );
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  );
                  await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin },
                  });
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_17_40)">
                    <path
                      d="M19.805 10.2306C19.805 9.55181 19.7479 8.90272 19.6427 8.28223H10.2V12.0178H15.6268C15.3897 13.2427 14.6466 14.2741 13.6011 14.9632V17.2216H16.6841C18.4386 15.6332 19.805 13.2216 19.805 10.2306Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10.2 19C12.655 19 14.6782 18.1964 16.0841 17.2216L13.6011 14.9632C12.8411 15.4732 11.855 15.7927 10.2 15.7927C7.82501 15.7927 5.80501 14.1859 5.06501 11.9659H1.87201V14.2859C3.27101 17.4306 6.45501 19 10.2 19Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.06501 11.9659C4.85501 11.4559 4.73501 10.9027 4.73501 10.3216C4.73501 9.74059 4.85501 9.18736 5.06501 8.67736V6.35736H1.87201C1.27301 7.57318 0.930008 8.90272 0.930008 10.3216C0.930008 11.7405 1.27301 13.0701 1.87201 14.2859L5.06501 11.9659Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M10.2 4.85091C11.655 4.85091 12.925 5.35546 13.855 6.23091L16.155 4.03091C14.6782 2.63318 12.655 1.75 10.2 1.75C6.45501 1.75 3.27101 3.31954 1.87201 6.35736L5.06501 8.67736C5.80501 6.45736 7.82501 4.85091 10.2 4.85091Z"
                      fill="#EA4335"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_17_40">
                      <rect
                        width="18.875"
                        height="17.25"
                        fill="white"
                        transform="translate(0.930008 1.75)"
                      />
                    </clipPath>
                  </defs>
                </svg>
                Mit Google anmelden
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
