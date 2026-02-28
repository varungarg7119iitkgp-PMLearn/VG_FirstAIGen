## Phase 6 – Hardening & Optional Enhancements

This folder documents the files that were created or primarily shaped in **Phase 6 (Hardening & Enhancements)**.

Core goals:
- Add basic safeguards on the recommendations API:
  - Input validation and sanitization.
  - Simple rate limiting.
  - More defensive AI (Gemini) response handling.
- Lay groundwork for more robust behavior under load and with imperfect model outputs.

### Main files touched in this phase

- Rate limiting
  - `web/lib/rate-limit.ts`
    - Provides an in-memory, per-identifier rate limiter:
      - 1-minute window.
      - `MAX_REQUESTS_PER_WINDOW` (currently 30) allowed per identifier.
    - `isRateLimited(identifier: string): boolean`
      - Tracks counts per identifier (e.g., IP).
      - Returns `true` when the caller has exceeded the allowed rate.

- Request validation & sanitization
  - `web/app/api/recommendations/route.ts`
    - `parsePreferences` enhanced to:
      - Sanitize text fields (`place`, `cuisine`, `vibe`):
        - Trims whitespace.
        - Collapses internal spaces.
        - Clamps length to reasonable maximums.
      - Clamp `minRating` numeric value into the valid range `[0, 5]`, with default `3.5`.
      - Normalize `priceRange` to one of `"low" | "medium" | "high"`, defaulting to `"medium"`.
      - Normalize `vibe` to one of `"party" | "romantic | "solo" | "catchup"`, defaulting to `"romantic"`.
    - Before processing a request:
      - Derives an identifier from headers (`x-forwarded-for`, `x-real-ip`, or `"local"`).
      - Uses `isRateLimited(identifier)` to:
        - Return `HTTP 429` with a friendly message when the caller exceeds the rate.

- Defensive Gemini parsing
  - `web/lib/ai/gemini-client.ts`
    - When parsing the model's text output:
      - Attempts to locate the first `[` and last `]` in the response text.
      - Extracts that slice as the JSON array to parse.
      - Falls back to the whole text if no array brackets are found.
    - This makes the client more tolerant of responses where the model wraps JSON in explanatory text.

- Tests
  - `web/__tests__/rate-limit.test.ts`
    - Ensures the rate limiter:
      - Allows a handful of requests for a given key.
      - Eventually returns `true` (limited) after enough calls within the same window.

### Summary

With Phase 6:
- The `/api/recommendations` endpoint is more robust against:
  - Noisy or malicious input.
  - Overly chatty clients.
  - Slightly off-spec Gemini outputs.
- These changes prepare the project for more serious usage while still keeping the implementation lightweight and suitable for personal use.

