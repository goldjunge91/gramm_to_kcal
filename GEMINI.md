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

**Primary Command**: `bash "/Users/marco/Github.tmp/gramm_to_kcal/.claude/functions/task/task_stats.sh"`

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

# Multi-File Output System

## Overview

This system enables Claude to deliver multiple files in a single JSON payload. The JSON is processed by a bash script that writes all files in parallel with stylized output.

## How to Use

When the user needs multiple files generated as a single output, follow these instructions:

1. Understand the user's request for multiple files
2. Format your response as a valid JSON object following the schema below
3. Inform the user they can save this output to a file and process it with the write_files.sh script

## JSON Schema for Multi-File Output

```json
{
    "files": [
        {
            "file_name": "path/to/file1.extension",
            "file_type": "text",
            "file_content": "The content of the first file"
        },
        {
            "file_name": "path/to/file2.extension",
            "file_type": "text",
            "file_content": "The content of the second file"
        },
        {
            "file_name": "path/to/binary_file.bin",
            "file_type": "binary",
            "file_content": "base64_encoded_content_here"
        }
    ]
}
```

## Field Definitions

- `file_name`: The path where the file should be written (including filename and extension)
    - IMPORTANT: Always use project-relative paths (e.g., "src/main/java/...") or absolute paths
    - Files will be written to exactly the location specified - no test directories are used
    - For tool creation, always use actual project paths, not test directories
- `file_type`: Either "text" (default) or "binary" for base64-encoded content
- `file_content`: The actual content of the file (base64 encoded for binary files)

## Important Rules

1. ALWAYS validate the JSON before providing it to ensure it's properly formatted
2. ALWAYS ensure all file paths are properly escaped
3. For binary files, encode the content as base64 and specify "binary" as the file_type
4. NEVER include explanatory text or markdown outside the JSON structure
5. When asked to generate multiple files, ALWAYS use this format unless explicitly directed otherwise

## How Users Can Process the Output

Instruct users to:

1. Save the JSON output to a file (e.g., `files.json`)
2. Run the write_files.sh script:
    ```bash
    ./write_files.sh files.json
    ```

## Script Features

The write_files.sh script includes the following enhancements:

- Stylized output with color-coded and emoji status indicators
- Compact progress display with timestamp and elapsed time
- Green circle (🟢) for success items
- White circle (⚪) for neutral items
- Red circle (🔴) for error conditions
- Calendar emoji (📅) for timestamps
- Clock emoji (⏱️) for elapsed time display
- Support for both text and binary files
- Parallel extraction for improved performance
- Detailed error reporting and logging options
- Verbose mode for detailed progress tracking

## Advanced Usage Options

```bash
# Basic usage
./write_files.sh files.json

# Verbose output with detailed progress
./write_files.sh files.json --verbose

# Log details to a file for debugging
./write_files.sh files.json --log-to-file logs/extraction.log

# Write results to a file (silent mode)
./write_files.sh files.json --output-file results.md

# Suppress all console output
./write_files.sh files.json --silent

# Disable compact output format
./write_files.sh files.json --no-compact
```

## Example Response

When asked to generate multiple files, your entire response should be a valid JSON object like this:

```json
{
    "files": [
        {
            "file_name": "example.py",
            "file_type": "text",
            "file_content": "def hello_world():\n    print(\"Hello, world!\")\n\nif __name__ == \"__main__\":\n    hello_world()"
        },
        {
            "file_name": "README.md",
            "file_type": "text",
            "file_content": "# Example Project\n\nThis is an example README file."
        }
    ]
}
```

## Command to Add to CLAUDE.md

To add this system to CLAUDE.md, add the following section:

```markdown
## Multi-File Output System

- When the user mentions "multi-file output", "generate files as json", or similar requests for bundled file generation, use the multi-file output system
- Execute using: `./write_files.sh <json_file>`
- Provide output as a single JSON object following the schema in `./multi_file_instructions.md`
- The JSON must include an array of files, each with file_name, file_type, and file_content fields
- For binary files, encode content as base64 and set file_type to "binary"
- NEVER include explanatory text or markdown outside the JSON structure
```
