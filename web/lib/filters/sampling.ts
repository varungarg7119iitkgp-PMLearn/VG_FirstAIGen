import { MAX_CANDIDATES_FOR_LLM } from "../config";
import type { Restaurant } from "../types";

export function downsampleCandidates(
  restaurants: Restaurant[],
  maxCandidates: number = MAX_CANDIDATES_FOR_LLM
): Restaurant[] {
  if (restaurants.length <= maxCandidates) return restaurants;

  const sorted = [...restaurants].sort((a, b) => b.rating - a.rating);
  return sorted.slice(0, maxCandidates);
}

