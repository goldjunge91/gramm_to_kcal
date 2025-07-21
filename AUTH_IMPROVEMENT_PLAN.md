### Task 1: Fix Critical Session Refresh Bug

```markdown
**Title:** Bug: User sessions expire unexpectedly when browsing public pages

**Status:** To Do
**Labels:** bug, critical, auth
**Assignee:** (unassigned)

### The Problem

Our middleware is currently configured to skip its logic for any route marked as "public" (like the homepage or the `/calories` page). This is causing a critical bug: the `updateSession` function, which is responsible for refreshing the user's authentication token, is not being called.

As a result, a logged-in user's session can expire in the background while they are browsing the site, leading to them being unexpectedly logged out.

### Your Task

Your goal is to ensure the `updateSession` function runs on all necessary routes to keep the user's session alive.

1.  **Modify `middleware.ts`:** Change the main middleware function so that it no longer exits early for public routes. The middleware should continue its execution for all page types.
2.  **Verify Logic in `lib/supabase/middleware.ts`:** The logic to decide whether to redirect a user should exist _inside_ the `updateSession` function, not in the main `middleware.ts` file. Ensure this function correctly handles both public and protected routes without improperly redirecting users.

### Files to Investigate

- `middleware.ts` (This is the main entry point)
- `lib/supabase/middleware.ts` (Contains the `updateSession` logic)
- `lib/middleware/routes.ts` (To understand which routes are public)

### Acceptance Criteria

- A logged-in user can navigate between public pages (e.g., from `/` to `/calories`) and their session remains active.
- Unauthenticated users can still access all public pages without being redirected.
```

### Task 2: Standardize the Authentication Flow

```markdown
**Title:** Feature: Redirect logged-in users away from auth pages

**Status:** To Do
**Labels:** feature, enhancement, auth
**Assignee:** (unassigned)

### The Problem

Currently, a user who is already logged in can still navigate to the `/auth/login` and `/auth/sign-up` pages. This is a confusing experience. If a user is already authenticated, we should guide them back to the main application.

### Your Task

Your goal is to add logic to the middleware to handle this case.

1.  **Update `lib/supabase/middleware.ts`:** In the `updateSession` function, add a check to see if the user is already authenticated.
2.  **Implement the Redirect:** If an authenticated user tries to access a route that is part of the "auth" group (like `/auth/login`), they should be immediately redirected to their account page at `/account`.

### Files to Investigate

- `lib/supabase/middleware.ts` (Where the new logic will go)
- `lib/middleware/routes.ts` (To see the definition of `isAuthRoute` and the `REDIRECT_PATHS`)

### Acceptance Criteria

- When a logged-in user attempts to visit `/auth/login` or `/auth/sign-up`, they are immediately redirected to `/account`.
- Unauthenticated users can still access the login and signup pages as normal.
```

### Task 3: Implement Production-Ready Rate Limiting

```markdown
**Title:** Chore: Upgrade auth actions to use the production Redis rate limiter

**Status:** To Do
**Labels:** chore, security, tech-debt
**Assignee:** (unassigned)

### The Problem

Our `loginAction` and `signupAction` server functions are using a simple, in-memory `Map` for rate limiting. The code comments correctly state that this is not safe for production. In a real-world scenario, this would not prevent brute-force attacks.

We already have a powerful, Redis-based rate limiter built in `lib/utils/auth-rate-limit.ts`, and we need to start using it.

### Your Task

Your goal is to replace the temporary rate-limiting solution with our production-ready one.

1.  **Open `lib/actions/auth.ts`:** This file contains the `loginAction` and `signupAction`.
2.  **Remove the Old Code:** Delete the in-memory `rateLimitStore` map and its associated helper function, `checkRateLimit`.
3.  **Implement the New Limiter:** Import the `checkSignInRateLimit` and `checkSignUpRateLimit` functions from `@/lib/utils/auth-rate-limit.ts`. Use them to replace the old `checkRateLimit` calls in the `loginAction` and `signupAction` respectively.

### Files to Investigate

- `lib/actions/auth.ts` (Where the changes will be made)
- `lib/utils/auth-rate-limit.ts` (To see the functions you need to import and use)

### Acceptance Criteria

- The login and signup server actions are now protected by the Redis-based rate limiter.
- The old, in-memory rate limiting code is completely removed.
```

### Task 4: Simplify Middleware Configuration

```markdown
**Title:** Refactor: Simplify the middleware matcher for better maintainability

**Status:** To Do
**Labels:** refactor, tech-debt
**Assignee:** (unassigned)

### The Problem

The `config.matcher` in `middleware.ts` uses a very complex and hard-to-read regular expression to exclude certain routes from the middleware. This makes it difficult to add new public routes in the future and is prone to errors.

The best practice is to use a simple, broad matcher and handle the routing logic inside the middleware code itself.

### Your Task

Your goal is to refactor the matcher to make it simpler and more maintainable.

1.  **Update `middleware.ts`:** Replace the complex `matcher` with a simpler, more standard pattern. A good example is `"/((?!api|_next/static|_next/image|favicon.ico).*)"`. This pattern matches everything _except_ for a few standard Next.js folders.
2.  **Verify No Regressions:** After changing the matcher, double-check that the authentication and routing logic still works as expected. The routing decisions should be made by the code inside the middleware function, not by the matcher.

### Files to Investigate

- `middleware.ts` (Where the `matcher` is defined)

### Acceptance Criteria

- The `config.matcher` in `middleware.ts` is simplified to a one-line, easy-to-understand pattern.
- The application's authentication and redirection logic continues to work exactly as it did before.
```

### Task 5: Unify Post-Authentication Redirects

```markdown
**Title:** Chore: Unify post-authentication redirect destinations

**Status:** To Do
**Labels:** chore, enhancement, ux
**Assignee:** (unassigned)

### The Problem

There is a small inconsistency in our user experience after authentication:

- After a successful **signup**, the user is redirected to `/calories`.
- After a successful **login**, the user is redirected to `/calories`, but the standard redirect for already-authenticated users is `/account`.

For a more predictable experience, the destination should be the same in all cases.

### Your Task

Your goal is to make all successful authentications lead to the same place.

1.  **Analyze `lib/actions/auth.ts`:** Find the `signupAction` and `loginAction` functions.
2.  **Update the Redirect Path:** Change the `redirect()` call inside the `signupAction` to point to `/account` instead of `/calories`. Let's make the account page the standard destination.
3.  **Update the Login Redirect:** For consistency, also ensure the `loginAction` redirects to `/account`.

### Files to Investigate

- `lib/actions/auth.ts` (Contains the redirect logic)
- `lib/middleware/routes.ts` (To confirm the `DEFAULT_AFTER_LOGIN` path)

### Acceptance Criteria

- After a user successfully signs up, they are redirected to `/account`.
- After a user successfully logs in, they are redirected to `/account`.
```

### Task 6: Clean Up Unused Code

```markdown
**Title:** Refactor: Remove unused `auth-middleware.ts` to reduce confusion

**Status:** To Do
**Labels:** refactor, tech-debt
**Assignee:** (unassigned)

### The Problem

Our codebase currently contains two different middleware implementations for authentication:

1.  `lib/supabase/middleware.ts` (which is currently being used)
2.  `lib/middleware/auth-middleware.ts` (a more complex but completely unused file)

The presence of the unused file makes the codebase confusing for new developers and adds unnecessary complexity. We should have a single, clear source of truth for our authentication logic.

### Your Task

Your goal is to safely remove the unused code to clean up our project.

1.  **Confirm it's Unused:** Use your code editor's "Find Usages" or a global search to confirm that `auth-middleware.ts` is not imported or used anywhere.
2.  **Delete the File:** Once you are certain it is not being used, delete the file `lib/middleware/auth-middleware.ts`.
3.  **Run the Application:** After deleting the file, run the application and test the login/logout flow to ensure that its removal had no side effects.

### Files to Investigate

- `lib/middleware/auth-middleware.ts` (The file to be deleted)
- `middleware.ts` (To confirm the unused file is not imported here)

### Acceptance Criteria

- The file `lib/middleware/auth-middleware.ts` is deleted from the project.
- The application's authentication and routing continue to function correctly.
```
