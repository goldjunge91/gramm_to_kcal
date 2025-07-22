import { NextResponse } from "next/server";

// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  console.log('OAuth callback called with code:', !!code, 'next:', next);

  if (code) {
    try {
      // Use standard client - OAuth methods are not rate limited
      const supabase = await createClient();
      
      console.log('Attempting code exchange for session...');
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        console.log('OAuth login successful for user:', data.user?.email);
        
        const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === "development";
        
        if (isLocalEnv) {
          // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error('OAuth code exchange failed:', error);
      }
    } catch (exchangeError) {
      console.error('OAuth callback error:', exchangeError);
    }
  } else {
    console.log('No code parameter in OAuth callback');
  }

  // return the user to an error page with instructions
  console.log('Redirecting to auth error page');
  return NextResponse.redirect(`${origin}/auth/error`);
}
