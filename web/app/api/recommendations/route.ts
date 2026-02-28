import { NextResponse } from "next/server";
import { getRestaurants } from "@/lib/data/dataset-loader";
import { filterByUserConstraints } from "@/lib/filters/filter-by-user-constraints";
import { filterByVibe } from "@/lib/filters/filter-by-vibe";
import { downsampleCandidates } from "@/lib/filters/sampling";
import type { Recommendation, UserPreferences } from "@/lib/types";
import {
  getRankedRecommendationsFromGemini,
  isGeminiConfigured
} from "@/lib/ai/gemini-client";
import { buildGoogleMapsUrl } from "@/lib/actions/maps-links";
import { buildUberDeepLink } from "@/lib/actions/uber-links";
import { getZomatoUrl } from "@/lib/actions/zomato-links";
import {
  incrementSearchCount,
  getSearchCount
} from "@/lib/social/social-proof-store";
import { isRateLimited } from "@/lib/rate-limit";

function parsePreferences(body: unknown): UserPreferences {
  const obj = (body ?? {}) as Record<string, unknown>;
  const sanitizeText = (value: unknown, maxLength: number): string => {
    if (typeof value !== "string") return "";
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  };

  const rawMinRating =
    typeof obj.minRating === "number" ? obj.minRating : Number(obj.minRating ?? NaN);
  const minRating = Number.isFinite(rawMinRating)
    ? Math.min(Math.max(rawMinRating, 0), 5)
    : 3.5;

  const rawPriceRange = String(obj.priceRange ?? "").toLowerCase();
  const priceRange =
    rawPriceRange === "low" || rawPriceRange === "high" || rawPriceRange === "medium"
      ? rawPriceRange
      : "medium";

  const rawVibe = sanitizeText(obj.vibe, 32).toLowerCase();
  const allowedVibes = ["party", "romantic", "solo", "catchup"] as const;
  const vibe =
    (allowedVibes.find((v) => v === rawVibe) as UserPreferences["vibe"]) ?? "romantic";

  return {
    place: sanitizeText(obj.place, 80),
    cuisine: sanitizeText(obj.cuisine, 80),
    minRating,
    priceRange,
    vibe
  };
}

export async function POST(request: Request) {
  try {
    const identifier =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "local";

    if (isRateLimited(identifier)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const prefs = parsePreferences(body);

    // Track social proof for this vibe.
    incrementSearchCount(prefs.vibe);
    const vibeSearchCount = getSearchCount(prefs.vibe);

    const allRestaurants = await getRestaurants();
    let constrained = filterByUserConstraints(allRestaurants, prefs);

    // If filters are too strict and yield no results, fall back to the full list
    // so that the user still gets some recommendations.
    if (constrained.length === 0) {
      constrained = allRestaurants;
    }

    const withVibeHeuristic = filterByVibe(constrained, prefs);
    const candidates = downsampleCandidates(withVibeHeuristic);

    let recommendations: Recommendation[] = candidates.map((restaurant) => ({
      restaurant,
      googleMapsUrl: buildGoogleMapsUrl(restaurant.name, restaurant.address),
      uberUrl: buildUberDeepLink(restaurant.address),
      zomatoUrl: getZomatoUrl(restaurant)
    }));

    if (isGeminiConfigured() && candidates.length > 0) {
      try {
        const aiRanking = await getRankedRecommendationsFromGemini(
          prefs,
          candidates
        );

        const byId = new Map(aiRanking.map((r) => [r.id, r]));
        recommendations = candidates
          .map<Recommendation>((restaurant) => {
            const match = byId.get(restaurant.id);
            return {
              restaurant,
              googleMapsUrl: buildGoogleMapsUrl(
                restaurant.name,
                restaurant.address
              ),
              uberUrl: buildUberDeepLink(restaurant.address),
              zomatoUrl: getZomatoUrl(restaurant),
              aiReason: match?.reason,
              score: match?.score
            };
          })
          // If Gemini provided scores, order by them; otherwise keep rating order.
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      } catch (geminiError) {
        console.error("Gemini ranking failed, falling back to non-AI list:", geminiError);
      }
    }

    return NextResponse.json(
      {
        preferences: prefs,
        totalMatches: constrained.length,
        returned: recommendations.length,
        recommendations,
        vibeSearchCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in recommendations route:", error);
    return NextResponse.json(
      { error: "Failed to compute recommendations" },
      { status: 500 }
    );
  }
}

