export const DEFAULT_ZOMATO_DATASET_URL =
  process.env.ZOMATO_DATASET_URL ??
  "https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/main/zomato.csv";

// Maximum number of restaurants we will ever consider sending to Gemini.
// Keeping this small avoids very large prompts and keeps latency low.
export const MAX_CANDIDATES_FOR_LLM = 20;

export const DEFAULT_MIN_RATING = 3.5;

export const PRICE_RANGE_BUCKETS: Record<
  "low" | "medium" | "high",
  { min: number; max: number }
> = {
  low: { min: 0, max: 500 },
  medium: { min: 500, max: 1500 },
  high: { min: 1500, max: Number.POSITIVE_INFINITY }
};

