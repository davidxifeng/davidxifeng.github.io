# CRUSH.md

## Development Commands

- **Install dependencies**: `bun install`
- **Start dev server**: `bun run dev` (Vite on port 3000)
- **Build for production**: `bun run build` (Vite + TypeScript compilation)
- **Type check**: `bunx tsc --noEmit` (strict TS)
- **Preview build**: `bun run serve`
- **Run all tests**: `bunx vitest` or `bunx vitest --run` (Vitest with React Testing Library)
- **Run single test**: `bunx vitest /path/to/file.test.tsx` or `bunx vitest --run 'test name'`
- **Lint (pre-commit)**: Husky + lint-staged runs `bun run build` on staged TS/TSX files

## Code Style Guidelines

- **Language/Stack**: TypeScript, React 19, Tailwind CSS v4, TanStack Router
- **Formatting**: 2-space indentation; semicolons; single quotes; no trailing commas
- **Imports**: Use path aliases (`@/components/ui/button`); group by type (React, external, internal); no unused imports
- **Types**: Strict mode enabled; explicit types for props/stores; use interfaces for complex shapes; avoid `any`
- **Naming**: Components/files: PascalCase (e.g., `Button.tsx`); hooks: `useXxx`; stores: `*Store.ts`; utils: lowerCamelCase
- **Components**: Shadcn/ui style (New York); add with `pnpx shadcn@latest add [component]`
- **Error Handling**: Use try-catch for async; validate props with TypeScript; log errors to console (no production secrets)
- **Styling**: Tailwind utilities; CSS variables for themes; avoid inline styles; responsive mobile-first
- **State**: Zustand stores with Immer; persist sensitive state; no global mutations
- **Testing**: Co-locate `*.test.tsx`; target 80% coverage; test behavior, not implementation
- **Security**: No committed secrets; use `.env`; validate inputs; follow OWASP guidelines
- **Cursor Rules**: Use `pnpx shadcn@latest add [component]` for Shadcn components