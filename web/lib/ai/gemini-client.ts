import type { Restaurant, UserPreferences } from "../types";
import { buildRankingPrompt, type AiRankingResult } from "./prompt-templates";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-1.5-flash"; // can be overridden if needed

type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY);
}

export async function getRankedRecommendationsFromGemini(
  prefs: UserPreferences,
  candidates: Restaurant[]
): Promise<AiRankingResult[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  if (!candidates.length) return [];

  const prompt = buildRankingPrompt(prefs, candidates);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL
    )}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 768
        }
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} – ${text}`
    );
  }

  const data = (await response.json()) as GenerateContentResponse;
  const rawText =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

  let parsed: unknown;
  try {
    // Some models sometimes wrap JSON in explanatory text. Try to extract the JSON array.
    const start = rawText.indexOf("[");
    const end = rawText.lastIndexOf("]");
    const jsonText =
      start !== -1 && end !== -1 && end > start
        ? rawText.slice(start, end + 1)
        : rawText;

    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error("Failed to parse Gemini JSON response");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response JSON is not an array");
  }

  return parsed
    .map((item) => ({
      id: String((item as any).id ?? ""),
      score: Number((item as any).score ?? 0),
      reason: String((item as any).reason ?? "")
    }))
    .filter((r) => r.id && r.reason);
}

