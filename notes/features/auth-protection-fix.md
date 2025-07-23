# Auth Protection Fix

## Problem

Auth/login and sign-up routes are protected but this breaks functionality. Users cannot access login/signup pages.

## Analysis

Based on code review of `/lib/auth/routes.ts` and `/lib/auth/middleware.ts`:

### Current Route Configuration

- AUTH routes (should be accessible to unauthenticated users):
    - `/auth/login`
    - `/auth/sign-up`
    - `/auth/forgot-password`
    - `/auth/update-password`

### Middleware Logic

The middleware in `lib/auth/middleware.ts:updateSession()` has the correct logic:

- Lines 64-67: Auth routes are allowed when no session exists
- Lines 52-57: Auth routes redirect authenticated users away (correct behavior)

### Expected Behavior

- Unauthenticated users → can access `/auth/login`, `/auth/sign-up`
- Authenticated users → redirected away from auth routes to `/`

## Investigation Needed

Need to determine why auth routes are being blocked. Possible issues:

1. Route classification logic in `routes.ts`
2. Middleware execution order
3. Better-auth configuration
4. Session cookie detection issues

## TDD Approach

1. Write failing E2E tests showing auth routes are inaccessible
2. Fix the underlying issue
3. Refactor for better reliability
