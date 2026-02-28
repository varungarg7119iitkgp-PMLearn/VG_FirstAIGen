'use client';

import { useState } from "react";
import { VibePicker } from "./VibePicker";

export type SearchFormValues = {
  place: string;
  cuisine: string;
  minRating: number;
  priceRange: string;
  vibe: string;
};

export type SearchFormProps = {
  initialValues?: Partial<SearchFormValues>;
  onSearch: (values: SearchFormValues) => void;
  isSearching?: boolean;
};

export function SearchForm({
  initialValues,
  onSearch,
  isSearching
}: SearchFormProps) {
  const [place, setPlace] = useState(initialValues?.place ?? "Indiranagar");
  const [cuisine, setCuisine] = useState(initialValues?.cuisine ?? "North Indian");
  const [minRating, setMinRating] = useState(initialValues?.minRating ?? 3.5);
  const [priceRange, setPriceRange] = useState(
    initialValues?.priceRange ?? "medium"
  );
  const [vibe, setVibe] = useState(initialValues?.vibe ?? "romantic");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch({
      place,
      cuisine,
      minRating,
      priceRange,
      vibe
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card mx-auto flex w-full max-w-3xl flex-col gap-6 p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Location
          </label>
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-zomatoRed focus:ring-1 focus:ring-zomatoRed"
          >
            <option value="Indiranagar">Indiranagar</option>
            <option value="Koramangala">Koramangala</option>
            <option value="HSR Layout">HSR Layout</option>
            <option value="Whitefield">Whitefield</option>
            <option value="MG Road">MG Road</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Cuisine</label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-zomatoRed focus:ring-1 focus:ring-zomatoRed"
          >
            <option value="North Indian">North Indian</option>
            <option value="South Indian">South Indian</option>
            <option value="Chinese">Chinese</option>
            <option value="Italian">Italian</option>
            <option value="Cafe">Cafe</option>
            <option value="Fast Food">Fast Food</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Minimum rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-zomatoRed focus:ring-1 focus:ring-zomatoRed"
          >
            <option value={3}>3.0+</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">
            Budget (for two)
          </label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-100 outline-none focus:border-zomatoRed focus:ring-1 focus:ring-zomatoRed"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <VibePicker value={vibe} onChange={setVibe} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400">
          Powered by real Zomato data and Gemini&apos;s vibe-based reasoning.
        </p>
        <button
          type="submit"
          className="primary-button"
          disabled={isSearching}
        >
          {isSearching ? "Searching…" : "Find places"}
        </button>
      </div>
    </form>
  );
}

