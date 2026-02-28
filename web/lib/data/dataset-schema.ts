import type { Restaurant } from "../types";

// Shape of a single row in the Zomato CSV.
export type RawRestaurantRow = {
  name: string;
  address: string;
  rate: string;
  cuisines: string;
  "approx_cost(for two people)": string;
  location: string;
  url: string;
};

export function mapRawRowToRestaurant(
  raw: RawRestaurantRow,
  index: number
): Restaurant {
  // Ratings in the dataset often look like "4.1/5" — we only want the "4.1" part.
  const ratingMatch = raw.rate.match(/[\d.]+/);
  const rating = ratingMatch ? parseFloat(ratingMatch[0]) : NaN;
  const approxCost = parseInt(
    raw["approx_cost(for two people)"].replace(/[,₹\s]/g, ""),
    10
  );

  return {
    id: `${index}`,
    name: raw.name.trim(),
    address: raw.address.trim(),
    rating: Number.isFinite(rating) ? rating : 0,
    cuisines: raw.cuisines
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    approxCostForTwo: Number.isFinite(approxCost) ? approxCost : null,
    location: raw.location.trim(),
    url: raw.url.trim()
  };
}

