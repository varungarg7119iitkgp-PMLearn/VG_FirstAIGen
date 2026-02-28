import type { Restaurant, UserPreferences } from "../types";

// Phase 2: simple placeholder heuristics.
// Later phases can refine this logic with more sophisticated matching.
export function filterByVibe(
  restaurants: Restaurant[],
  prefs: UserPreferences
): Restaurant[] {
  const vibe = prefs.vibe;
  if (!vibe) return restaurants;

  const lowerVibe = vibe.toLowerCase();

  return restaurants.map((restaurant) => {
    const name = restaurant.name.toLowerCase();
    const cuisines = restaurant.cuisines.map((c) => c.toLowerCase()).join(" ");

    let scoreBoost = 0;
    if (lowerVibe === "romantic") {
      if (name.includes("lounge") || cuisines.includes("continental")) scoreBoost += 0.2;
    } else if (lowerVibe === "party") {
      if (name.includes("bar") || name.includes("club") || cuisines.includes("bar")) scoreBoost += 0.2;
    } else if (lowerVibe === "solo") {
      if (cuisines.includes("cafe") || cuisines.includes("coffee")) scoreBoost += 0.2;
    }

    return {
      ...restaurant,
      rating: restaurant.rating + scoreBoost
    };
  });
}

