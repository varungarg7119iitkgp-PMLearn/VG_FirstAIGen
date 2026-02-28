import type { Restaurant, UserPreferences } from "../types";

export type AiRankingResult = {
  id: string;
  score: number;
  reason: string;
};

export function buildRankingPrompt(
  prefs: UserPreferences,
  candidates: Restaurant[]
): string {
  const prefsSummary = `
User preferences:
- Place: ${prefs.place || "any"}
- Cuisine: ${prefs.cuisine || "any"}
- Minimum rating: ${prefs.minRating}
- Price range: ${prefs.priceRange}
- Vibe: ${prefs.vibe}
`.trim();

  // Keep the payload compact to avoid very large prompts.
  const restaurantsPayload = candidates.slice(0, 10).map((r) => ({
    id: r.id,
    name: r.name.slice(0, 80),
    location: r.location.slice(0, 80),
    // Shorten address and cuisines to keep total size manageable.
    address: r.address.slice(0, 120),
    rating: r.rating,
    cuisines: r.cuisines.map((c) => c.slice(0, 40)),
    approxCostForTwo: r.approxCostForTwo
  }));

  const instructions = `
You are an AI concierge helping a user choose a restaurant based on their preferences and desired vibe.

You will receive:
- The user's preferences (location, cuisine, minimum rating, budget, vibe).
- A list of candidate restaurants drawn from Zomato data.

Your task:
1. Carefully consider how well EACH restaurant matches:
   - The requested location (or nearby areas if there are no direct matches),
   - The requested cuisine,
   - The minimum rating,
   - The budget range,
   - And especially the requested vibe (party, romantic, solo, quick catchup).
2. Rank the restaurants from best to worst match.
3. For each restaurant you recommend, provide a short explanation ("reason") that clearly answers:
   - WHY this place fits the user's vibe and filters,
   - What kind of experience they can expect (e.g. ambience, crowd, suitability for families/couples/groups, etc.).

Important constraints:
- ONLY recommend from the provided restaurants.
- Do not invent new restaurants or modify their fields.
- Do not give the exact same reasons for different restaurants.
- Return your answer as STRICT JSON, with no commentary outside the JSON.

The JSON format must be:
[
  {
    "id": "<id of restaurant from the list>",
    "score": <number between 0 and 1, higher is better>,
    "reason": "<one or two sentences explaining why this fits the vibe and filters>"
  },
  ...
]

Return between 3 and 10 restaurants, sorted from highest score to lowest score.
`.trim();

  return `
${instructions}

${prefsSummary}

Candidate restaurants (JSON array):
${JSON.stringify(restaurantsPayload)}
`.trim();
}

