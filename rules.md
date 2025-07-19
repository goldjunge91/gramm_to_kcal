## 🚫 Core Rules

1. **ALWAYS prefer editing existing files in the codebase.**
   NEVER write new files unless explicitly required.
2. **NEVER use names like `Enhanced*`, `*2`, `*backup`** when creating new files based on old ones — the user will DIE if you do.

### Important Notes

- Uses DrizzleAdapter for database integration
- JWT strategy for edge compatibility
- Custom email templates for verification
- Password hashing with unified utilities
- Edge-compatible JWT signing/verification

## State Management

### URL-Based State

- Prefer URL-based state management (query parameters, path parameters)
- Filters, pagination, and search should be URL-representable
- Makes state shareable via URLs

## Important Rules

- **Never** use npm or yarn, only pnpm
- **Never** run `pnpm dev` or `pnpm build` automatically - ask user first
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
  const MyComp = ({ id, name }: Props) => {};
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
