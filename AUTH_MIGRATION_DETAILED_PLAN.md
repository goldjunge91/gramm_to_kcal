# Detailed Migration Plan: Supabase Auth to Better Auth

## 1. Introduction

This document provides a comprehensive, step-by-step plan for migrating the application's authentication system from Supabase Auth to Better Auth. This is a significant architectural change that impacts everything from UI components to database security.

**Primary Goals:**
- Replace all Supabase Auth functionalities with Better Auth equivalents.
- Establish a new, robust authorization pattern for database access.
- Ensure a seamless user experience during and after the migration.

**Key Challenges:**
- **Database Authorization:** The most complex part of this migration is replacing the Row Level Security (RLS) policies that rely on Supabase's `auth.uid()` function. This will require a fundamental shift in how the application authorizes database operations.
- **Code-wide Changes:** Supabase Auth is deeply integrated. The migration will touch dozens of files, including middleware, server actions, client-side hooks, UI components, and tests.

---

## 2. Phase 1: Scaffolding & Initial Setup

This phase focuses on introducing Better Auth to the project without removing Supabase Auth, allowing for an incremental migration.

### 2.1. Install Dependencies
Install the Better Auth Next.js library.

```bash
npm install @better-auth/next
```

### 2.2. Environment Variables
Add the necessary Better Auth environment variables to a `.env.local` file.

```env
# .env.local

# Better Auth
# Generate a secret using: openssl rand -base64 32
AUTH_SECRET="your-super-secret-key"
AUTH_URL="http://localhost:3000"

# Add credentials for any OAuth providers (e.g., Google)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

### 2.3. Create Better Auth API Route
Create the catch-all API route that Better Auth uses to handle all authentication requests.

**File:** `app/api/auth/[...betterauth]/route.ts`
```typescript
// app/api/auth/[...betterauth]/route.ts
import { BetterAuth } from "@better-auth/next";
import Google from "@better-auth/next/providers/google";

export const { handlers, auth, signIn, signOut } = BetterAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    // Add other providers as needed
  ],
});
```

### 2.4. Update Middleware
Replace the existing Supabase session management in the middleware with Better Auth's.

**File:** `middleware.ts`
**Current Logic:** Uses `updateSession` from `@/lib/supabase/middleware`.
**New Logic:** Will use the `auth` object exported from the new Better Auth API route.

```typescript
// middleware.ts
import { auth } from "@/app/api/auth/[...betterauth]/route";

export default auth((req) => {
  // Your custom middleware logic here.
  // For now, we can just let it handle the session.
  // The `auth` object will automatically protect routes.
});

// Optionally, configure which routes the middleware applies to
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 3. Phase 2: Authentication State & Logic

This phase focuses on replacing the core logic for handling user sessions and authentication state.

### 3.1. Replace Auth Provider
The main `AuthContext` in `app/providers.tsx` will be replaced by Better Auth's `SessionProvider`.

**File:** `app/providers.tsx`
- **Remove:** The custom `AuthContext`, `useAuth` hook, and the associated `onAuthStateChange` listener.
- **Add:** Wrap the application with `SessionProvider`.

**File:** `app/layout.tsx`
- **Update:** Wrap the children of the `<body>` tag with the new `SessionProvider`.

```tsx
// app/layout.tsx (Example)
import { SessionProvider } from "@better-auth/next/react";

import { auth } from "@/app/api/auth/[...betterauth]/route";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 3.2. Refactor Server Actions
All authentication-related server actions must be rewritten to use Better Auth.

**File:** `lib/actions/auth.ts`
- **Replace `supabase.auth.signInWithPassword`:** Use the `signIn` function from Better Auth.
- **Replace `supabase.auth.signUp`:** Create a new user with your database and then use `signIn`.
- **Replace `supabase.auth.signOut`:** Use the `signOut` function from Better Auth.
- **Replace `supabase.auth.resetPasswordForEmail`:** This will require a custom implementation using your database and an email provider, as Better Auth does not handle this directly.

**Example `signIn` Action:**
```typescript
// lib/actions/auth.ts (New loginAction)
"use server";
import { AuthError } from "@better-auth/next/errors";

import { signIn } from "@/app/api/auth/[...betterauth]/route";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      // Handle specific auth errors
      return { error: error.message };
    }
    throw error; // Rethrow other errors
  }
}
```

### 3.3. Update Client-Side Hooks
Refactor all custom hooks that depend on the old `useAuth` hook.

**Files to Update:**
- `hooks/use-current-user-image.ts`
- `hooks/use-current-user-name.ts`
- `hooks/use-products-unified.ts`
- `hooks/use-recent-scans.ts`

**Refactoring Strategy:**
Replace `useAuth()` with `useSession()` from `@better-auth/next/react`.

**Example `use-products-unified.ts`:**
```typescript
// hooks/use-products-unified.ts (Refactored)
import { useSession } from "@better-auth/next/react";

// ...

export function useProductsUnified() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const userId = session?.user?.id; // Assuming the user ID is in the session

  if (isAuthenticated) {
    // Logic for authenticated users, using userId
  } else {
    // Logic for unauthenticated users
  }

  // ...
}
```

---

## 4. Phase 3: Database Authorization (CRITICAL)

**WARNING:** This is the most complex and high-risk phase. The existing Row Level Security (RLS) policies are deeply tied to Supabase Auth and will no longer function. A new authorization strategy is required.

### 4.1. The Problem: `auth.uid()`
The database uses RLS policies with `auth.uid()` to ensure users can only access their own data. Better Auth is an application-level library and has no equivalent function that can be called directly within a Postgres policy.

### 4.2. The New Strategy: Explicit `WHERE` Clauses
The new strategy will be to move authorization checks from the database level (RLS) to the application level (server-side code).

1.  **Service Role Client:** Create a Supabase client initialized with the `service_role` key. This client can bypass RLS and will be used **only on the server**.
2.  **Explicit User ID Filtering:** In every server-side database query (in Server Actions, API Routes, etc.), you must:
    a. Get the current user's session from Better Auth (`await auth()`).
    b. Extract the user's ID (`session.user.id`).
    c. Add an explicit `WHERE user_id = '${session.user.id}'` clause to the query.

### 4.3. Implementation Steps

1.  **Remove RLS Policies:**
    - Go through `scripts/supabase-migration.sql`, `scripts/supabase-reset-and-init.sql`, and `lib/db/migrations/rls-policies.ts`.
    - Remove all `CREATE POLICY` statements that rely on `auth.uid()`.

2.  **Audit and Refactor All Database Queries:**
    - Perform a project-wide search for `supabase.from(...)`.
    - For each query, determine if it needs to be scoped to the current user.
    - If so, refactor it to be called from a server-side function that takes the user ID as an argument and adds the `WHERE` clause.

**Example Data Fetching:**
```typescript
// lib/db/products.ts (New function)
import { createClient } from "@supabase/supabase-js";

// Initialize with service role key on the server
const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function getProductsForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("user_id", userId); // Explicit WHERE clause

  if (error) {
    throw new Error("Failed to fetch products.");
  }
  return data;
}
```

---

## 5. Phase 4: UI & Component Migration

This phase involves updating the UI to work with the new authentication logic and state management.

### 5.1. Update Authentication Forms
The forms in `components/auth/` will need to be updated to call the new server actions.

**Files to Update:**
- `components/auth/server-login-form.tsx`
- `components/auth/server-signup-form.tsx`
- `components/auth/server-forgot-password-form.tsx` (and its new custom logic)

### 5.2. Update Components Consuming Auth State
Any component that conditionally renders UI based on authentication status needs to be updated.

**Files to Update:**
- `app/account/page.tsx`
- `app/calories-scan/page.tsx`
- `components/layout/Navbar.tsx`
- `components/auth/logout-button.tsx`

**Refactoring Strategy:**
Replace calls to `supabase.auth.getUser()`, `supabase.auth.getSession()`, or `useAuth()` with `useSession()` on the client or `auth()` on the server.

---

## 6. Phase 5: Testing & Cleanup

### 6.1. Update Tests
All tests related to authentication must be rewritten.

**Files to Update:**
- `__tests__/auth-rate-limit.test.ts`
- `__tests__/rate-limit-middleware.test.ts`
- And any other tests that mock or interact with `supabase.auth`.

**Strategy:**
- Mock the new Better Auth functions (`signIn`, `signOut`, `auth`, `useSession`).
- Update test assertions to match the new data structures and error handling.

### 6.2. Remove Dead Code and Dependencies
Once the migration is complete and verified:

1.  **Uninstall Supabase Auth Packages:**
    ```bash
    npm uninstall @supabase/auth-js @supabase/auth-helpers-nextjs # and any other related packages
    ```
2.  **Delete Unused Files:**
    - `lib/middleware/auth-middleware.ts`
    - `lib/utils/auth-errors.ts` (if replaced by Better Auth's error handling)
    - `lib/utils/auth-rate-limit.ts` (if Better Auth provides a replacement or it's no longer needed)
3.  **Cleanup Documentation:**
    - Remove or update any internal documentation that refers to Supabase Auth.
