import { DEFAULT_ZOMATO_DATASET_URL } from "../config";
import type { Restaurant } from "../types";
import { mapRawRowToRestaurant, type RawRestaurantRow } from "./dataset-schema";

let cachedRestaurants: Restaurant[] | null = null;

// Simple CSV parser that supports quoted fields with commas.
function parseCsv(text: string): RawRestaurantRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        // Toggle quote state or handle escaped quote.
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result.map((value) => value.trim());
  };

  const headers = parseLine(lines[0]);
  const rows: RawRestaurantRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = parseLine(lines[i]);
    if (columns.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = columns[index] ?? "";
    });
    rows.push(row as RawRestaurantRow);
  }

  return rows;
}

// Read at most maxBytes from a response body as text to avoid creating
// extremely large strings when the remote dataset is huge.
async function readLimitedText(
  response: Response,
  maxBytes: number
): Promise<string> {
  const body = response.body;
  if (!body) {
    return "";
  }

  const reader = (body as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    if (received + value.length > maxBytes) {
      const remaining = maxBytes - received;
      if (remaining > 0) {
        chunks.push(value.subarray(0, remaining));
      }
      break;
    }

    chunks.push(value);
    received += value.length;
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder("utf-8");
  return decoder.decode(merged);
}

export async function getRestaurants(): Promise<Restaurant[]> {
  if (cachedRestaurants) {
    return cachedRestaurants;
  }

  const response = await fetch(DEFAULT_ZOMATO_DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to load Zomato dataset: ${response.status}`);
  }

  // Cap the amount of data we read into memory to avoid extremely large strings.
  // This is sufficient for a personal assistant use case and keeps memory usage predictable.
  const text = await readLimitedText(response, 5 * 1024 * 1024); // 5 MB
  const rawRows = parseCsv(text);
  const restaurants = rawRows.map(mapRawRowToRestaurant);

  cachedRestaurants = restaurants;
  return restaurants;
}

