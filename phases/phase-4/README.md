## Phase 4 – Action Layer (Google Maps, Uber, Zomato)

This folder documents the files that were created or primarily shaped in **Phase 4 (Action Layer & Deep Links)**.

Core goals:
- Add an "Action" layer that turns AI recommendations into **one-click actions**:
  - Open the restaurant in **Google Maps**.
  - Open **Uber** with the destination pre-filled.
  - Open the original **Zomato** listing.
- Wire these links into the API response and UI cards.

### Main files touched in this phase

- Action helpers
  - `web/lib/actions/maps-links.ts`
    - `buildGoogleMapsUrl(name, address)` →  
      `https://www.google.com/maps/search/?api=1&query={name}+{address}`
  - `web/lib/actions/uber-links.ts`
    - `buildUberDeepLink(address)` →  
      `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]={address}`
  - `web/lib/actions/zomato-links.ts`
    - `getZomatoUrl(restaurant)` → returns the dataset `url` field.

- Types
  - `web/lib/types.ts`
    - `Recommendation` extended with:
      - `googleMapsUrl?: string`
      - `uberUrl?: string`
      - `zomatoUrl?: string`

- API route
  - `web/app/api/recommendations/route.ts`
    - After Phase 2 filters and optional Phase 3 AI ranking:
      - Attaches `googleMapsUrl`, `uberUrl`, and `zomatoUrl` to each `Recommendation`.
    - When Gemini ranking is available:
      - Keeps the same deep links while adding `aiReason` and `score`.

- UI
  - `web/components/ResultCard.tsx`
    - Uses the deep-link URLs:
      - **Open in Maps** (🗺️) → `googleMapsUrl`
      - **Book Uber** (🚗) → `uberUrl`
      - **Zomato Menu** (🍴) → `zomatoUrl`
    - Renders them as external `<a>` links with `target="_blank"` so actions open in a new tab/window.

With Phase 4, each recommendation card in the UI now offers direct, frictionless navigation to Maps, Uber, and Zomato for the selected restaurant.

