import type { Restaurant } from "../types";

export function getZomatoUrl(restaurant: Restaurant): string {
  return restaurant.url;
}

