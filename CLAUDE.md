# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev`: Start development server with Turbopack
- `pnpm build`: Build production version
- `pnpm start`: Start production server
- `pnpm test`: Run tests with Vitest
- `pnpm lint`: Run ESLint

## Architecture Overview

This is a CalorieTracker application built with Next.js 15 App Router, focused on two main features:
1. **Calorie Comparison**: Compare multiple products by calories per gram or per 100g
2. **Recipe Management**: Scale recipes and adjust ingredient proportions

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui components with Tailwind CSS
- **Testing**: Vitest with tdd-guard reporter
- **Forms**: React Hook Form with Zod validation
- **State**: React Query (@tanstack/react-query) for data fetching
- **Routing**: TanStack Router
- **Theming**: next-themes for dark/light mode support

### Key Data Models
```typescript
interface Product {
  id: string;
  name: string;
  quantity: number;   // in grams
  kcal: number;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "TL" | "EL" | string;
}

interface Recipe {
  id: string;
  name: string;
  originalPortions: number;
  ingredients: Ingredient[];
}
```

### Project Structure
- `/app/calories/`: Calorie comparison feature
- `/app/recipe/`: Recipe management feature
- `/components/ui/`: shadcn/ui components
- `/lib/`: Utility functions and API logic
- `/hooks/`: Custom React hooks
- `/tests/`: Test files

## Code Conventions (from rules.md)

### Core Rules
- ALWAYS prefer editing existing files over creating new ones
- NEVER use names like `Enhanced*`, `*2`, `*backup` for files
- QueryClient must be set up in `app/layout.tsx`
- API logic lives in `/lib/api/**`, consumed via React Query
- Use `useQuery`, `useMutation`, `useInfiniteQuery` from `@tanstack/react-query`
- Query keys should be formatted as `['domain', id?]`

### Style Guidelines
- Use arrow functions everywhere
- Always specify explicit return types
- Destructure props: `const MyComp = ({ id, name }: Props) => { ... }`
- Avoid `any`, use `unknown` or strict generics
- Import order: react → next → external libs → local imports (`@/`) → relative imports (`./`)

### Security
- All server-side inputs must be validated with Zod
- Use HttpOnly + Secure flags for cookies
- Implement CSRF protection where needed
- Protect sensitive routes with middleware or session logic

## Development Approach

This project follows a **surgical edits** methodology:
- Make minimal, focused changes
- Use targeted logging for debugging
- Fix root causes, not symptoms
- Rely on TypeScript for error catching
- Consult before making major structural changes

## Mobile-First Design

The application is designed with mobile-first principles:
- Responsive design using Tailwind CSS
- Touch-friendly interfaces
- Optimized for various screen sizes
- Accessible components following WCAG guidelines

## Testing

- Tests use Vitest with tdd-guard reporter
- Run tests with `pnpm test`
- Tests organized in `/tests` or co-located with components
- Use `@testing-library/react` for component testing
- Mock with `msw` and `vi.mock()`

## Package Manager

This project uses pnpm with workspace configuration. Always use `pnpm` commands instead of `npm` or `yarn`.