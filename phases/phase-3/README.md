## Phase 3 – Gemini AI Integration & Vibe-Based Reasoning

This folder documents the files that were created or primarily shaped in **Phase 3 (AI Layer – Gemini)**.

Core goals:
- Integrate with the Gemini API using `GEMINI_API_KEY`.
- Rank filtered restaurants according to user preferences and vibe.
- Attach an AI-generated "why this place?" reason to each recommendation.

### Main files touched in this phase

- AI Layer
  - `web/lib/ai/prompt-templates.ts`
    - Builds a structured prompt describing user preferences and the candidate restaurant list.
    - Defines the JSON response format (`id`, `score`, `reason`) that Gemini should return.
  - `web/lib/ai/gemini-client.ts`
    - Reads `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) from the environment.
    - Calls the Gemini `generateContent` HTTP endpoint.
    - Parses the JSON response into a list of `{ id, score, reason }` ranking results.

- API route evolution
  - `web/app/api/recommendations/route.ts`
    - After Phase 2 filtering and sampling:
      - Checks `isGeminiConfigured()`.
      - When configured and candidates exist, calls `getRankedRecommendationsFromGemini`.
      - Maps Gemini results back onto restaurants to produce:
        - `aiReason` – short explanation per recommendation.
        - `score` – AI ranking score (used for ordering when available).
      - Falls back gracefully to non-AI recommendations if Gemini is not configured or errors.

- Data layer refinement
  - `web/lib/data/dataset-loader.ts`
    - CSV parser updated to handle **quoted fields with commas** (e.g., addresses, cuisines).
  - `web/lib/data/dataset-schema.ts`
    - Rating parsing updated to correctly handle strings like `"4.1/5"` by extracting just the numeric component (`4.1`).

### Environment variables

- `GEMINI_API_KEY` – required to enable live AI reasoning.
- `GEMINI_MODEL` (optional) – override the default model name (`gemini-1.5-flash`) if desired.

When `GEMINI_API_KEY` is not set, the `/api/recommendations` endpoint still works using the Phase 2 filters, but returns recommendations **without AI reasons or scores**.

