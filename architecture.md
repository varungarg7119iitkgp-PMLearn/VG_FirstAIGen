## Zomato AI Personal Concierge – Unified Architecture

This document is the **single source of truth** for the architecture of the **Zomato AI Personal Concierge** – an AI restaurant recommendation tool that:
- Takes user preferences (**place, cuisine, rating, price, vibe**).
- Uses real restaurant data from Hugging Face (`ManikaSaini/zomato-restaurant-recommendation`).
- Filters and scores candidates locally.
- Calls **Gemini** (or a compatible LLM) for **vibe-based reasoning** and ranking.
- Returns **clear recommendations** with deep links to Google Maps, Uber, and Zomato.

It focuses on **architecture and phases**, not implementation code. For detailed visual and interaction design, see `ui-design.md`.

---

## 1. Tech Stack & External Services

- **Frontend**
  - Next.js (App Router) + React + TypeScript.

- **Backend**
  - Node.js, implemented via **Next.js API routes**.

- **Data Source**
  - Hugging Face dataset: `ManikaSaini/zomato-restaurant-recommendation`.
  - Fields used: `name`, `address`, `rate`, `cuisines`, `approx_cost(for two people)`, `location`, `url`.

- **LLM / AI Layer**
  - Gemini (or similar LLM).
  - API key stored as `GEMINI_API_KEY` in `.env.local`, used **only on the server**.

- **Action Layer (Deep Links)**
  - **Google Maps**: `https://www.google.com/maps/search/?api=1&query={name}+{address}`
  - **Uber**: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]={address}`
  - **Zomato**: direct redirect using the `url` field from the dataset.

---

## 2. High-Level System Overview

- **Frontend Web App**
  - Renders the main page with:
    - A **Search Form** (place, cuisine, rating, price).
    - A **Vibe Picker** (Romantic, Solo, Party, etc.).
    - A **Results List** of **Result Cards** with AI explanations and deep links.

- **Backend API (`/api/recommendations`)**
  - Validates user preferences.
  - Uses the **Data Layer** to load and filter restaurants.
  - Uses the **AI Layer** (Gemini) for ranking and reasoning.
  - Uses the **Action Layer** to attach deep links.
  - Returns structured `Recommendation` objects to the frontend.

- **Core Logical Layers**
  - **Data Layer**
    - Loads the CSV from Hugging Face.
    - Normalizes and caches restaurant data.
    - Applies user-constraint filters and vibe heuristics.
  - **AI Layer (Gemini)**
    - Uses `GEMINI_API_KEY` to call Gemini.
    - Ranks candidates and generates vibe-based reasons.
  - **Action Layer**
    - Builds Google Maps, Uber, and Zomato URLs.
  - **UI Layer**
    - Next.js components for form input, vibe selection, and displaying results/social proof.

---

## 3. Project Phases (Flow of Development)

This section describes **how to build the project step by step**, and what architectural pieces become “real” in each phase.

### Phase 1 – Project Setup & Skeleton UI

**Goal:** Have a running Next.js app with the basic screen and form, but no real data or AI.

- **What exists in this phase**
  - Root config files:
    - `package.json`, `tsconfig.json`, `next.config.mjs`.
    - `.env.local` set up (with placeholders for `GEMINI_API_KEY`, `ZOMATO_DATASET_URL`).
  - Basic app structure:
    - `app/layout.tsx` – HTML shell and global styles.
    - `app/page.tsx` – main page component.
  - UI components (static / stubbed):
    - `VibePicker` – selectable list of vibes.
    - `SearchForm` – fields for place, cuisine, rating, price, vibe; submit does nothing or logs.
    - Placeholder `ResultsList` / `ResultCard` – show mock data or “no results yet”.

- **Architecture focus**
  - Confirm routing, layout, and component boundaries.
  - Ensure the app can be deployed locally and that environment variables are wired (even if blank).

---

### Phase 2 – Data Layer & Non-AI Filtering

**Goal:** Load real Zomato data from Hugging Face and return filtered restaurants **without AI**.

- **Data Layer modules**
  - `lib/types.ts`
    - Defines core types: `Restaurant`, `UserPreferences`, `Vibe`, `Recommendation` (no AI fields yet).
  - `lib/config.ts`
    - Constants: dataset URL, max candidates, rating thresholds, price buckets.
  - `lib/data/dataset-schema.ts`
    - Describes how raw CSV columns map to `Restaurant` fields.
  - `lib/data/dataset-loader.ts`
    - Fetches CSV from `ZOMATO_DATASET_URL` or default Hugging Face URL.
    - Parses and normalizes fields:
      - `rate` → `rating: number`.
      - `approx_cost(for two people)` → `approxCostForTwo: number`.
      - `cuisines` → `string[]`.
    - Caches the resulting `Restaurant[]` in memory.

- **Filter Logic modules**
  - `lib/filters/filter-by-user-constraints.ts`
    - Filters by:
      - `place` (matches `location` / `address`).
      - `cuisine` (membership in `cuisines` array).
      - `minRating` (numeric threshold).
      - `priceRange` (mapped to numeric cost intervals).
  - `lib/filters/filter-by-vibe.ts` (can be a stub in this phase)
    - Placeholder for later vibe-based heuristics.
  - `lib/filters/sampling.ts`
    - Downsamples large filtered sets to a manageable size (e.g., 30–50 entries).

- **API route**
  - `app/api/recommendations/route.ts`
    - Accepts `UserPreferences` (place, cuisine, minRating, priceRange, vibe).
    - Calls Data Layer and filtering logic.
    - Returns filtered `Restaurant[]` (no AI yet).

- **UI behavior**
  - `SearchForm` now calls `/api/recommendations`.
  - `ResultsList` / `ResultCard` display basic restaurant information from real data.

---

### Phase 3 – Gemini Integration & Vibe-Based Reasoning

**Goal:** Introduce the AI Layer so recommendations are ranked by **vibe** and include AI explanations.

- **AI Layer modules**
  - `lib/ai/gemini-client.ts`
    - Reads `GEMINI_API_KEY` from `process.env.GEMINI_API_KEY` (in `.env.local`).
    - Encapsulates HTTP calls to Gemini:
      - Builds request payload with:
        - User preferences.
        - Candidate restaurants (after filtering/sampling).
      - Sets authorization header with the API key.
      - Handles errors, timeouts, and response parsing.
    - Exposes a function such as:
      - `getRankedRecommendations(preferences, candidates): Promise<AiRankingResult[]>`.
  - `lib/ai/prompt-templates.ts`
    - Defines system and user prompts that:
      - Clearly state the task: recommend from **only the provided restaurants**.
      - Emphasize constraints: place, cuisine, rating, price, vibe.
      - Ask for a strict JSON response: `[{ name, score, reason }, ...]`.
      - Encourage vibe-based reasoning in `reason`.

- **API route evolution**
  - `app/api/recommendations/route.ts` now:
    1. Uses the same **Data Layer** and **Filter Logic** from Phase 2.
    2. Calls the **AI Layer** with the filtered candidate list.
    3. Maps `AiRankingResult` objects back to `Restaurant` entries.
    4. Produces `Recommendation` objects that include:
       - Restaurant data.
       - AI-generated `aiReason` and optional score/rank.

- **UI behavior**
  - `ResultCard` now shows:
    - “AI Reason” (vibe-based explanation from Gemini).
    - Sorted recommendations according to AI ranking.

---

### Phase 4 – Action Layer (Google Maps, Uber, Zomato)

**Goal:** Make recommendations **actionable** with deep links.

- **Action Layer modules**
  - `lib/actions/maps-links.ts`
    - `buildGoogleMapsUrl(name, address)` → `https://www.google.com/maps/search/?api=1&query={name}+{address}`
    - Handles URL encoding for name and address.
  - `lib/actions/uber-links.ts`
    - `buildUberDeepLink(address)` → `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]={address}`
    - Encodes the full address for URL safety.
  - `lib/actions/zomato-links.ts`
    - `getZomatoUrl(restaurant)` → returns the restaurant’s `url` field.

- **Integration into API route**
  - After AI ranking, the route attaches to each `Recommendation`:
    - `googleMapsUrl`
    - `uberUrl`
    - `zomatoUrl`

- **UI behavior**
  - `ResultCard` adds three primary buttons:
    - **Take Me There** → opens `googleMapsUrl` in a new tab.
    - **Get a Ride** → opens `uberUrl`.
    - **View on Zomato** → opens `zomatoUrl`.

---

### Phase 5 – Social Proof & UX Polish

**Goal:** Add trust-building social proof and improve the user experience.

- **Social Layer (optional)**
  - `lib/social/social-proof-store.ts`
    - Stores and reads simple counters per `vibe`:
      - `incrementSearchCount(vibe)` when an API request is made.
      - `getSearchCount(vibe)` to display counts.
    - Can be in-memory (sufficient for personal use).
  - `components/SocialProofBadge.tsx`
    - Shows messages like:
      - “3 searches for Romantic today”.

- **UI/UX improvements**
  - `components/LoadingState.tsx` and `components/ErrorState.tsx`:
    - Clear feedback during API calls and on errors.
  - Layout and visual polish:
    - Better spacing, typography, and responsive design.
  - Sensible defaults:
    - Default `minRating`, `priceRange`, and `vibe` if the user doesn’t choose explicitly.

---

### Phase 6 – Hardening & Optional Enhancements

**Goal:** Make the tool robust and extensible (optional for MVP).

- Add basic safeguards:
  - Request validation and sanitization on `/api/recommendations`.
  - Simple rate limiting or throttling.
  - More defensive handling of Gemini errors / partial responses.
- Extend filter & vibe logic:
  - Multiple cuisines selection.
  - More nuanced price buckets.
  - Richer vibe heuristics before AI.
- Persistence (beyond in-memory):
  - Use a small database for social proof or usage logs if desired.

---

## 4. Detailed Data & Control Flow (End-to-End)

This section summarizes how data moves through the system **once all key phases are implemented**.

1. **User input (UI Layer)**
   - On `app/page.tsx`, the user:
     - Enters `place`, `cuisine`, `minRating`, `priceRange`.
     - Selects a `vibe` via `VibePicker`.
     - Submits the `SearchForm`.

2. **API request (`/api/recommendations`)**
   - The frontend sends a POST request with `UserPreferences`.
   - The API route:
     - Validates input and maps it to typed `UserPreferences`.

3. **Data Layer (CSV → Restaurants)**
   - The API calls `getRestaurants()`:
     - If a cached `Restaurant[]` exists, reuse it.
     - Otherwise, fetches the CSV from Hugging Face using `ZOMATO_DATASET_URL` (or default), parses, normalizes, and caches.

4. **Filter Logic (Constraints + Vibe + Sampling)**
   - `filter-by-user-constraints`:
     - Filters by place, cuisine, rating, price.
   - `filter-by-vibe`:
     - Optionally prunes or reorders based on vibe heuristics.
   - `sampling`:
     - Reduces the candidate list to at most `MAX_CANDIDATES` for Gemini.

5. **AI Layer (Gemini)**
   - The filtered candidate list and user preferences are passed to `getRankedRecommendations`:
     - `gemini-client` constructs a prompt using `prompt-templates`.
     - Uses `process.env.GEMINI_API_KEY` to authenticate with Gemini.
     - Gemini returns a structured list of ranked candidates and reasons.
   - The API maps AI results back to `Restaurant` objects and forms `Recommendation` objects containing:
     - Restaurant details.
     - `aiReason` for each recommendation.

6. **Action Layer (Deep Links)**
   - For each `Recommendation`, Action helpers attach:
     - `googleMapsUrl` (Google Maps).
     - `uberUrl` (Uber ride).
     - `zomatoUrl` (original listing).

7. **Social Proof (if enabled)**
   - The API increments a per-vibe search counter.
   - Optionally returns aggregated counts to the frontend.

8. **Response to UI Layer**
   - The API returns the final list of enriched `Recommendation` objects as JSON.

9. **UI Rendering**
   - `ResultsList` renders a `ResultCard` for each recommendation:
     - Shows restaurant data, AI reason, and (optionally) social proof.
     - Buttons for **Take Me There**, **Get a Ride**, **View on Zomato** use the deep links.
   - Loading and error states are shown using dedicated components.

---

## 5. Folder & Module Map (Summary)

Although the **phases** drive how you build, the following logical structure keeps concerns separate:

- **Root**
  - `package.json`, `tsconfig.json`, `next.config.mjs`, `.env.local`, `README.md`, `architecture.md`.

- **App & UI**
  - `app/layout.tsx`, `app/page.tsx`.
  - `app/api/recommendations/route.ts` – orchestration of Data, AI, and Action layers.
  - `components/` – `VibePicker`, `SearchForm`, `ResultsList`, `ResultCard`, `SocialProofBadge`, `LoadingState`, `ErrorState`.

- **Domain & Backend**
  - `lib/types.ts`, `lib/config.ts`.
  - `lib/data/` – `dataset-loader.ts`, `dataset-schema.ts`.
  - `lib/filters/` – `filter-by-user-constraints.ts`, `filter-by-vibe.ts`, `sampling.ts`.
  - `lib/ai/` – `gemini-client.ts`, `prompt-templates.ts`.
  - `lib/actions/` – `maps-links.ts`, `uber-links.ts`, `zomato-links.ts`.
  - `lib/social/` – `social-proof-store.ts` (optional).

This unified architecture file should be your **single reference** when planning and implementing the project phase by phase, without needing to consult multiple documents.
