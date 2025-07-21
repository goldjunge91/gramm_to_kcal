# Migration Plan: Supabase Auth to Better Auth

This document outlines the high-level plan to migrate the authentication system from Supabase Auth to Better Auth.

## Phase 1: Analysis & Scaffolding

1.  **Understand Better Auth:** Thoroughly review the Better Auth documentation, including the [Next.js migration guide](https://www.better-auth.com/docs/guides/next-auth-migration-guide).
2.  **Identify Supabase Auth Touchpoints:** Categorize all files using `supabase.auth` to ensure a complete migration.
3.  **Set up Better Auth:**
    - Install the `@better-auth/next` package.
    - Create the necessary configuration files and API routes for Better Auth.
    - Define the required environment variables for Better Auth.

## Phase 2: Core Authentication Logic

1.  **Authentication Provider:** Replace the existing `AuthContext` in `app/providers.tsx` with Better Auth's client-side hooks (e.g., `useSession`).
2.  **API Routes & Server Actions:** Rewrite the authentication logic in `lib/actions/auth.ts`, replacing all `supabase.auth` calls with Better Auth's server-side equivalents.
3.  **Middleware:** Replace the logic in `middleware.ts` with Better Auth's middleware to handle route protection.

## Phase 3: UI and Component Migration

1.  **Authentication Forms:** Update the forms in `components/auth/` to use the new Better Auth server actions.
2.  **Client-side Auth Checks:** Update all components and hooks that currently use `useAuth` or `supabase.auth` to use the new Better Auth hooks.

## Phase 4: Database and Authorization (Most Complex)

1.  **New Authorization Strategy:** Devise a new strategy for authorizing database access, as Better Auth does not have a direct replacement for Supabase's `auth.uid()` function.
2.  **Rewrite RLS Policies:** All Row Level Security (RLS) policies that use `auth.uid()` will need to be rewritten.

## Phase 5: Testing and Cleanup

1.  **Update Tests:** All tests that mock `supabase.auth` will need to be updated to mock Better Auth's functions.
2.  **Remove Supabase Auth:** After a successful migration and testing, remove the Supabase-related packages and cleanup unused code and documentation.
