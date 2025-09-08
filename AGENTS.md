# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (components, routes, lib, stores).
  - Routes: `src/routes/*` (TanStack Router; e.g., `index.tsx`, `blog/$slug.tsx`).
  - UI: `src/components/` (PascalCase components; primitives under `components/ui/*`).
  - State: `src/stores/*Store.ts` (Zustand stores).
  - Utilities: `src/lib/*` (helpers like `utils.ts`, `blog.ts`).
- Content: `src/content/posts/*.mdx` (blog posts via MDX).
- Public assets: `public/` (favicons, manifest, static files).
- Config: `vite.config.ts`, `tsconfig.json`, `components.json`.

## Build, Test, and Development Commands
- Install: `bun install`.
- Dev server: `bun run dev` (Vite at `http://localhost:3000`).
- Type check: `bunx tsc --noEmit` (strict TS).
- Build: `bun run build` (Vite build then `tsc`).
- Preview: `bun run serve` (serve production build).
- Tests: `bunx vitest` or `bunx vitest --run` (CI/headless).

## Coding Style & Naming Conventions
- Language: TypeScript, React 19, Tailwind CSS v4.
- Components: PascalCase filenames/exports (e.g., `Header.tsx`).
- Hooks: `useXxx` (e.g., `useTheme`).
- Stores: `*Store.ts` (e.g., `themeStore.ts`).
- Utils: concise lowerCamel names (e.g., `blog.ts`, `utils.ts`).
- Indentation: 2 spaces; prefer semicolons and single quotes.
- Styling: prefer Tailwind utilities; avoid inline styles.

## Testing Guidelines
- Stack: Vitest + Testing Library (`@testing-library/react`, `jsdom`).
- Location: co-locate as `*.test.tsx` or under `__tests__/`.
- Coverage: target 80%+ when practical (`npx vitest --coverage`).
- Tests should render components, assert behavior, not implementation details.

## Commit & Pull Request Guidelines
- Commits: imperative, concise; Conventional Commits encouraged (`feat:`, `fix:`, `chore:`). Example: `fix: resolve pre-commit hook issues`.
- PRs: include summary, scope, linked issues, screenshots/GIFs for UI, and test notes.
- Preflight: run `bun run build`, `bunx tsc --noEmit`, and `bunx vitest` before opening PRs.
- Hooks: Husky + lint-staged use Bun; ensure Bun is installed and available on PATH.

## Security & Configuration Tips
- Do not commit secrets; prefer `.env` (ignored) and runtime config.
- Keep dependencies minimal; verify compatibility with Vite + React 19.
- Place static files in `public/`; import other assets through modules.
