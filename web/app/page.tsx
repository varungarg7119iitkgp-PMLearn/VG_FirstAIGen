'use client';

import { useState } from "react";
import { SearchForm, type SearchFormValues } from "../components/SearchForm";
import { ResultsList } from "../components/ResultsList";
import type { RecommendationCard } from "../components/ResultCard";

type ApiRecommendation = {
  restaurant: {
    id: string;
    name: string;
    address: string;
    rating: number;
    cuisines: string[];
    approxCostForTwo: number | null;
    location: string;
    url: string;
  };
  aiReason?: string;
  score?: number;
  googleMapsUrl?: string;
  uberUrl?: string;
  zomatoUrl?: string;
};

type RecommendationsResponse = {
  totalMatches: number;
  returned: number;
  vibeSearchCount?: number;
  recommendations: ApiRecommendation[];
};

function formatCost(approxCostForTwo: number | null): string {
  if (approxCostForTwo == null || Number.isNaN(approxCostForTwo)) {
    return "N/A";
  }
  return `₹${approxCostForTwo.toLocaleString("en-IN")}`;
}

function buildSummaryLine(values: SearchFormValues): string {
  const { vibe, cuisine, priceRange } = values;

  const vibePart =
    vibe === "romantic"
      ? "Looks like something special with someone special"
      : vibe === "party"
      ? "Party mode on tonight"
      : vibe === "solo"
      ? "Craving some peaceful solo time"
      : vibe === "catchup"
      ? "Time for a cosy catchup"
      : "You’re in the mood for something tasty";

  const cuisinePart = cuisine ? ` with ${cuisine} on the menu` : "";

  const pricePart =
    priceRange === "high"
      ? " — we’ll keep it premium but worth it."
      : priceRange === "low"
      ? " — keeping it budget-friendly without losing the fun."
      : " — balancing taste and budget just right.";

  return `${vibePart}${cuisinePart}, and we’ve got your back.${pricePart}`;
}

export default function HomePage() {
  const [results, setResults] = useState<RecommendationCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<SearchFormValues | null>(null);

  const handleSearch = async (values: SearchFormValues) => {
    setIsSearching(true);
    setError(null);
    setResults([]);
    setLastQuery(values);

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as RecommendationsResponse;
      const socialProof =
        typeof data.vibeSearchCount === "number" && data.vibeSearchCount > 0
          ? `${data.vibeSearchCount} searches for ${values.vibe} today`
          : undefined;

      const mapped: RecommendationCard[] = data.recommendations
        .slice(0, 10)
        .map((rec) => ({
          id: rec.restaurant.id,
          name: rec.restaurant.name,
          location: rec.restaurant.location,
          cuisines: rec.restaurant.cuisines.join(", "),
          rating: rec.restaurant.rating,
          approxCostForTwo: formatCost(rec.restaurant.approxCostForTwo),
          aiReason:
            rec.aiReason ??
            "This place matches your filters and vibe based on ratings, cuisine, and budget.",
          socialProof,
          googleMapsUrl: rec.googleMapsUrl,
          uberUrl: rec.uberUrl,
          zomatoUrl: rec.zomatoUrl
        }));

      setResults(mapped);
    } catch (err) {
      console.error("Search failed", err);
      setError(
        "Something went wrong while fetching recommendations. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gourmetGold">
          Zomato AI Personal Concierge
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          Find the perfect place{" "}
          <span className="text-zomatoRed">for tonight&apos;s vibe</span>
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-300">
          Tell me where you are, what you&apos;re craving, and the mood you&apos;re
          in. I&apos;ll match it with Zomato data and AI to suggest spots your
          friends and family will love.
        </p>
      </header>

      <SearchForm onSearch={handleSearch} isSearching={isSearching} />

      {lastQuery && !error && (results.length > 0 || isSearching) && (
        <section className="mt-6 text-center text-sm text-slate-200">
          <p className="font-semibold">
            {buildSummaryLine(lastQuery)}
          </p>
          {!isSearching && results.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Here are the top {results.length} spots we think fit your vibe best.
            </p>
          )}
        </section>
      )}

      <section aria-label="Recommendations">
        {error ? (
          <div className="mt-8 text-center text-sm text-red-400">
            {error}
          </div>
        ) : (
          <ResultsList results={results} isSearching={isSearching} />
        )}
      </section>
    </main>
  );
}

