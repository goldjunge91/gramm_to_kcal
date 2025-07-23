# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠️ Development Commands

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Important

- ALL instructions within this document MUST BE FOLLOWED, these are not optional unless explicitly stated.
- ASK FOR CLARIFICATION If you are uncertain of any of thing within the document.
- DO NOT edit more code than you have to.
- DO NOT WASTE TOKENS, be succinct and concise.

## Task Cost and Usage Information Retrieval

- IMPERATIVE: ANY time the user mentions "task stats", "get task stats", "last task stats", or similar variations, IMMEDIATELY use the automated task stats script without question.

### Task Stats Script Usage:

**Primary Command**: `bash "/path/to/project/.claude/functions/task/task_stats.sh"`

**Script Options:**

- `bash .claude/functions/task/task_stats.sh` - Auto-detects and analyzes most recent Task session
- `bash .claude/functions/task/task_stats.sh session_id.jsonl` - Analyzes specific session file

### IMPORTANT RULES:

- Execute the task_stats.sh script immediately when task stats are requested
- The script auto-detects the most recent Task session or accepts a specific session file

### Common Tasks

- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production
- `pnpm test` - Run unit tests with Vitest
- `pnpm test:e2e:auth` - Run authentication E2E tests with Playwright
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm typecheck` - TypeScript type checking

### Database Commands

- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run Drizzle migrations
- `pnpm db:studio` - Open Drizzle Studio

### Testing Strategy

This project uses **TDD (Test-Driven Development)** with strict enforcement:

- Every `.ts/.tsx/.js/.jsx` file must have a corresponding test file
- TDD guard script (`ts-tdd-guard.sh`) enforces this rule
- Unit tests: Vitest (in `__tests__/` or alongside source files)
- E2E tests: Playwright (in `__e2e__/`)
- Test files must follow patterns: `.test.ts`, `.spec.ts`, etc.

## 🏗️ Architecture Overview

### Core Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-auth with JWT strategy
- **UI**: Radix UI + Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query + URL-based state
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package Manager**: pnpm (required)

### Key Features

- **Barcode Scanning**: html5-qrcode for product scanning
- **Calorie Tracking**: Gram-to-kcal conversion
- **Recipe Generator**: With image editing capabilities
- **Unit Converter**: ML to gram conversions with density database
- **Offline Support**: Service worker + IndexedDB caching

### Database Schema

- Uses Drizzle ORM with PostgreSQL
- Authentication tables: `user`, `session`, `account`, `verification`
- Product data: Product lookup and nutritional information
- Recipe data: Ingredient management and portion controls

## 🚫 Core Rules

1. **ALWAYS prefer editing existing files in the codebase.**
   NEVER write new files unless explicitly required.
2. **NEVER use names like `Enhanced*`, `*2`, `*backup`** when creating new files based on old ones — the user will DIE if you do.

### Authentication Configuration

- Better-auth with DrizzleAdapter for database integration
- JWT strategy for edge compatibility and Supabase integration
- Rate limiting enabled (100 req/min global, stricter for auth endpoints)
- Social auth: Google OAuth (when configured)
- Password hashing client-side for edge compatibility
- Anonymous user support via better-auth plugin
- Cookie caching enabled (5-minute cache)
- IP address tracking with fallback headers

### File Structure

- `/app/` - Next.js app router pages and API routes
- `/components/` - Reusable UI components (DO NOT EDIT `/components/ui/`)
- `/lib/` - Utility functions, database, auth, and API logic
- `/hooks/` - Custom React hooks
- `/__tests__/` - Unit tests (Vitest)
- `/__e2e__/` - End-to-end tests (Playwright)

## State Management

### URL-Based State

- Prefer URL-based state management (query parameters, path parameters)
- Filters, pagination, and search should be URL-representable
- Makes state shareable via URLs

## Important Rules

- **Never** use npm or yarn, only pnpm
- **Never** run `pnpm dev` or `pnpm build` automatically - ask user first
- **Dont run pnpm \* commands ask the user to excute it.**
- **Always** update DrizzleAdapter mapping in `auth.ts` when changing schema
- **Never** NEVER NEVER NEVER send plain text to server
- **Always** use existing patterns and components from the codebase
- **Never** NEVER make NEVER new NEVER files if working on existing ones and breaking them
- **Never** NEVER make any migrations .sql files, only use DrizzleKit

---

## 🧩 Core Structure

- Edit existing files **only**. If a new file is needed → **ask the user first.**
- \*_No Enhanced_, *2, *backup names\*\*.
- **QueryClient** must be set up in `app/layout.tsx`.
- **API logic** lives in `/lib/api/**`, consumed via React Query.
- Use `useQuery`, `useMutation`, `useInfiniteQuery` from `@tanstack/react-query`.
- Query keys should be formatted as `['domain', id?]`.

---

## 🎨 Style Rules

- Use **arrow functions** everywhere.
- Always specify **explicit return types**.
- **Destructure props**:

    ```ts
    function MyComp({ id, name }: Props) {}
    ```

- **Avoid `any`**. Use `unknown` or strict generics.
- **Import order**:
    1. `react`
    2. `next`
    3. External libs
    4. Local imports: `@/`…
    5. Relative imports: `./`…

---

## 📚 Documentation

- Each component/hook gets a **1-line JSDoc** comment describing its purpose.
- **Top-of-file comments** required for config files (e.g. `tailwind.config.ts`).
- Keep `project_status.md` updated with:
    - Getting-started steps
    - Design tokens (colors, font sizes)
    - Guide for reusable components

---

## 🔒 Security

- All server-side inputs must be **validated with Zod**.
- Use **HttpOnly + Secure** flags for cookies; implement CSRF protection where needed.
- Sensitive routes and API endpoints must be protected via **middleware or session logic**.

---

## 🔭 Design Principles

- **Simple > Complex**
- **One correct path**; no fallback options
- **Fail fast** on unmet preconditions
- **Single Responsibility** per function/component

---

## ⚙️ Development Methodology

1. **Surgical edits only** – minimal, focused changes
2. **Targeted logging** for debugging
3. **Fix root causes**, not symptoms
4. Rely on **TypeScript** for catching errors
5. **Consult the user** before making any major structural changes
