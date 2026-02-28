import type { Vibe } from "../types";

// Simple in-memory store for counting how many times a given vibe
// has been searched during the lifetime of this server process.
const searchCounts: Record<string, number> = {};

export function incrementSearchCount(vibe: Vibe): void {
  const key = String(vibe || "unknown");
  searchCounts[key] = (searchCounts[key] ?? 0) + 1;
}

export function getSearchCount(vibe: Vibe): number {
  const key = String(vibe || "unknown");
  return searchCounts[key] ?? 0;
}

