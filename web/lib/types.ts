export type Restaurant = {
  id: string;
  name: string;
  address: string;
  rating: number;
  cuisines: string[];
  approxCostForTwo: number | null;
  location: string;
  url: string;
};

export type Vibe =
  | "party"
  | "romantic"
  | "solo"
  | "catchup"
  | (string & {});

export type PriceRange = "low" | "medium" | "high";

export type UserPreferences = {
  place: string;
  cuisine: string;
  minRating: number;
  priceRange: PriceRange;
  vibe: Vibe;
};

export type Recommendation = {
  restaurant: Restaurant;
  // In Phase 2 this is a placeholder; AI fills it in later.
  aiReason?: string;
  score?: number;
  googleMapsUrl?: string;
  uberUrl?: string;
  zomatoUrl?: string;
};

