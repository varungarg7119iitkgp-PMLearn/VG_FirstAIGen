## Phase 5 – Social Proof & UX Polish

This folder documents the files that were created or primarily shaped in **Phase 5 (Social Proof & UX Polish)**.

Core goals:
- Add lightweight social proof based on how often each vibe is searched.
- Wire the frontend to call the real `/api/recommendations` endpoint instead of using mock data.
- Improve UX around loading and error handling.

### Main files touched in this phase

- Social proof store
  - `web/lib/social/social-proof-store.ts`
    - In-memory counters keyed by vibe:
      - `incrementSearchCount(vibe)` – increments the count whenever a search is made.
      - `getSearchCount(vibe)` – retrieves the current count for the given vibe.

- API route evolution
  - `web/app/api/recommendations/route.ts`
    - After parsing preferences:
      - Calls `incrementSearchCount(prefs.vibe)` and reads `vibeSearchCount`.
    - Response JSON now includes:
      - `vibeSearchCount` – the number of searches for the selected vibe during this server process lifetime.

- Frontend wiring & UX
  - `web/app/page.tsx`
    - Replaces mock data with a real call to `/api/recommendations` using `fetch`:
      - Sends the `SearchForm` values as the request body.
      - Maps the API `recommendations` into `RecommendationCard` objects for the UI.
    - Uses `vibeSearchCount` from the API to build a social proof string like:
      - `"3 searches for romantic today"`, attached to each recommendation card.
    - Adds:
      - `isSearching` state for loading feedback.
      - `error` state to show a friendly error message if the request fails.

- UI integration
  - `web/components/ResultCard.tsx`
    - Extended `RecommendationCard` type to include:
      - `googleMapsUrl?`, `uberUrl?`, `zomatoUrl?` (from earlier phases).
    - Already displays `socialProof` text from the mapped recommendations.

- Tests
  - `web/__tests__/social-proof.test.tsx`
    - Verifies that:
      - `incrementSearchCount` and `getSearchCount` work together to increase the count for a given vibe.

With Phase 5, the homepage now:
- Calls the backend API for real, filtered, AI-enhanced recommendations.
- Displays social proof per vibe.
- Handles loading and basic error states in a user-friendly way.

