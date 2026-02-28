import { PRICE_RANGE_BUCKETS } from "../config";
import type { Restaurant, UserPreferences } from "../types";

export function filterByUserConstraints(
  restaurants: Restaurant[],
  prefs: UserPreferences
): Restaurant[] {
  const place = prefs.place.trim().toLowerCase();
  const cuisine = prefs.cuisine.trim().toLowerCase();
  const ratingThreshold = prefs.minRating;
  const priceBucket = PRICE_RANGE_BUCKETS[prefs.priceRange];

  return restaurants.filter((restaurant) => {
    if (place) {
      const haystack = `${restaurant.location} ${restaurant.address}`.toLowerCase();
      if (!haystack.includes(place)) return false;
    }

    if (cuisine) {
      const cuisines = restaurant.cuisines.map((c) => c.toLowerCase());
      const matches = cuisines.some((c) => c.includes(cuisine));
      if (!matches) return false;
    }

    if (restaurant.rating < ratingThreshold) {
      return false;
    }

    if (restaurant.approxCostForTwo != null) {
      const cost = restaurant.approxCostForTwo;
      if (cost < priceBucket.min || cost > priceBucket.max) {
        return false;
      }
    }

    return true;
  });
}

