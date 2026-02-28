## Phase 1 – UI Skeleton

This folder documents the files that were created or primarily shaped in **Phase 1 (Project Setup & Skeleton UI)**.

Core goals:
- Set up a basic Next.js + TypeScript + Tailwind project in the `web` folder.
- Implement the initial UI for the Zomato AI tool:
  - Global dark gourmet theme.
  - Search form + vibe picker.
  - Recommendation cards with mock data (no real data or AI yet).

### Main files touched in this phase

- Project setup
  - `web/package.json`
  - `web/tsconfig.json`
  - `web/next.config.mjs`
  - `web/next-env.d.ts`
  - `web/tailwind.config.ts`
  - `web/postcss.config.mjs`

- Global layout and styling
  - `web/app/layout.tsx`
  - `web/app/globals.css`

- UI components
  - `web/components/VibePicker.tsx`
  - `web/components/SearchForm.tsx`
  - `web/components/ResultCard.tsx`
  - `web/components/ResultsList.tsx`

- Page entry
  - `web/app/page.tsx`

- Tests
  - `web/jest.config.cjs`
  - `web/jest.setup.ts`
  - `web/__tests__/page.test.tsx`

