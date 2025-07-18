1. ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
2. NEVER use Enhanced or any other name to make new file from old.
The User will DIE if you do so.

Set up QueryClient in app/layout.tsx
Use useQuery, useMutation, useInfiniteQuery from @tanstack/react-query
Place API logic in /lib/api/ and call via hooks
Use query keys prefixed by domain: ['user', id]

Prefer arrow functions
Annotate return types
Always destructure props
Avoid any type, use unknown or strict generics
Group imports: react → next → libraries → local

Each component and hook should include a short comment on usage
Document top-level files (like app/layout.tsx) and configs
Keep project_status.md up to date with getting started, design tokens, and component usage notes

Validate all server-side inputs (API routes)
Use HTTPS-only cookies and CSRF tokens when applicable
Protect sensitive routes with middleware or session logic

Design Principles
1. Don't overengineer: Simple beats complex
2. No fallbacks: One correct path, no alternatives
3. One way: One way to do things, not many
4. Clarity over compatibility: Clear code beats backward compatibility
5. Throw errors: Fail fast when preconditions aren't met
6. No backups: Trust the primary mechanism
7. Separation of concerns: Each function should have a single responsibility

Development Methodology

8. Surgical changes only: Make minimal, focused fixes
9. Evidence-based debugging: Add minimal, targeted logging
10. Fix root causes: Address the underlying issue, not just symptoms
11. Simple > Complex: Let TypeScript catch errors instead of excessive runtime checks
12. Collaborative process: Work with user to identify most efficient solution