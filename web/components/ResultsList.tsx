import { ResultCard, type RecommendationCard } from "./ResultCard";

export type ResultsListProps = {
  results: RecommendationCard[];
  isSearching?: boolean;
};

export function ResultsList({ results, isSearching }: ResultsListProps) {
  if (isSearching) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 text-sm text-slate-300">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gourmetGold border-t-transparent" />
        <p>Cooking up recommendations for you…</p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="mt-10 text-center text-sm text-slate-400">
        No recommendations yet. Start by telling me where and what you&apos;re
        in the mood for.
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {results.map((rec) => (
        <ResultCard key={rec.id} recommendation={rec} />
      ))}
    </div>
  );
}

