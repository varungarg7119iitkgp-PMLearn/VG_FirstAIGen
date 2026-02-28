## Phase 2 – Data Layer & Filtering

This folder documents the files that were created or primarily shaped in **Phase 2 (Data Layer & Non‑AI Filtering)**.

Core goals:
- Load and normalize the Zomato dataset from Hugging Face.
- Apply user constraint filters (place, cuisine, rating, price).
- Add lightweight vibe heuristics and candidate downsampling.
- Expose a `/api/recommendations` endpoint that returns filtered restaurants (without AI reasons yet).

### Main files touched in this phase

- Types & configuration
  - `web/lib/types.ts`
  - `web/lib/config.ts`

- Data loading & normalization
  - `web/lib/data/dataset-schema.ts`
  - `web/lib/data/dataset-loader.ts`

- Filter logic
  - `web/lib/filters/filter-by-user-constraints.ts`
  - `web/lib/filters/filter-by-vibe.ts`
  - `web/lib/filters/sampling.ts`

- API route
  - `web/app/api/recommendations/route.ts`

- Tests
  - `web/__tests__/filters.test.tsx`

