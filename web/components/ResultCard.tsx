export type RecommendationCard = {
  id: string;
  name: string;
  location: string;
  cuisines: string;
  rating: number;
  approxCostForTwo: string;
  aiReason: string;
  socialProof?: string;
  googleMapsUrl?: string;
  uberUrl?: string;
  zomatoUrl?: string;
};

export type ResultCardProps = {
  recommendation: RecommendationCard;
};

export function ResultCard({ recommendation }: ResultCardProps) {
  return (
    <article className="glass-card flex flex-col gap-4 p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">
            {recommendation.name}
          </h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {recommendation.location} • {recommendation.cuisines}
          </p>
          <p className="text-sm font-medium text-gourmetGold">
            ⭐ {recommendation.rating.toFixed(1)} • Approx {recommendation.approxCostForTwo}
          </p>
        </div>
        <div className="rounded-full bg-gourmetGold/10 px-3 py-1 text-xs font-semibold text-gourmetGold">
          {recommendation.socialProof ?? "Popular choice! 🔥"}
        </div>
      </header>

      <section className="rounded-xl bg-white/5 p-3 text-sm text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          AI Why
        </p>
        <p className="mt-1 leading-relaxed">{recommendation.aiReason}</p>
      </section>

      <footer className="flex flex-wrap items-center gap-3">
        {recommendation.googleMapsUrl && (
          <a
            href={recommendation.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="primary-button"
          >
            🗺️ Open in Maps
          </a>
        )}
        {recommendation.uberUrl && (
          <a
            href={recommendation.uberUrl}
            target="_blank"
            rel="noreferrer"
            className="secondary-button"
          >
            🚗 Book Uber
          </a>
        )}
        {recommendation.zomatoUrl && (
          <a
            href={recommendation.zomatoUrl}
            target="_blank"
            rel="noreferrer"
            className="secondary-button"
          >
            🍴 Zomato Menu
          </a>
        )}
      </footer>
    </article>
  );
}

