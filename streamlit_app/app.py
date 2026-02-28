import os
import time
from typing import List, Dict, Any

import pandas as pd
import requests
import streamlit as st

DEFAULT_ZOMATO_DATASET_URL = (
    os.getenv(
        "ZOMATO_DATASET_URL",
        "https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation/resolve/main/zomato.csv",
    )
)


def _get_gemini_api_key() -> str | None:
    """Prefer Streamlit secrets, fall back to environment variable, without failing if secrets.toml is missing."""
    env_val = os.getenv("GEMINI_API_KEY")
    try:
        return st.secrets.get("GEMINI_API_KEY", env_val)
    except Exception:
        # When secrets.toml does not exist, Streamlit raises FileNotFoundError.
        return env_val


GEMINI_API_KEY = _get_gemini_api_key()
# Use gemini-2.0-flash (gemini-1.5-flash can 404). Override with GEMINI_MODEL env.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

MAX_CANDIDATES_FOR_LLM = 20

PRICE_RANGE_BUCKETS = {
    "low": {"min": 0, "max": 500},
    "medium": {"min": 500, "max": 1500},
    "high": {"min": 1500, "max": float("inf")},
}


@st.cache_data(show_spinner=False)
def load_restaurants() -> pd.DataFrame:
    df = pd.read_csv(DEFAULT_ZOMATO_DATASET_URL)

    # Normalize schema
    df = df.rename(
        columns={
            "name": "name",
            "address": "address",
            "rate": "rate",
            "cuisines": "cuisines",
            "approx_cost(for two people)": "approx_cost_for_two",
            "location": "location",
            "url": "url",
        }
    )

    # Clean rating "4.1/5" -> 4.1
    df["rating"] = (
        df["rate"]
        .astype(str)
        .str.extract(r"([\d.]+)", expand=False)
        .astype(float)
        .fillna(0.0)
    )

    # Clean approx cost -> number
    df["approx_cost_for_two"] = (
        df["approx_cost_for_two"]
        .astype(str)
        .str.replace(r"[₹,\s]", "", regex=True)
        .replace("", pd.NA)
        .astype("float")
    )

    # Split cuisines
    df["cuisines_list"] = (
        df["cuisines"]
        .astype(str)
        .str.split(",")
        .apply(lambda xs: [x.strip() for x in xs if x.strip()])
    )

    df["id"] = df.index.astype(str)
    return df


def filter_by_user_constraints(df: pd.DataFrame, prefs: Dict[str, Any]) -> pd.DataFrame:
    place = prefs["place"].strip().lower()
    cuisine = prefs["cuisine"].strip().lower()
    min_rating = float(prefs["minRating"])
    price_range = prefs["priceRange"]
    bucket = PRICE_RANGE_BUCKETS.get(price_range, PRICE_RANGE_BUCKETS["medium"])

    mask = pd.Series(True, index=df.index)

    if place:
        haystack = (df["location"].astype(str) + " " + df["address"].astype(str)).str.lower()
        mask &= haystack.str.contains(place, na=False)

    if cuisine:
        mask &= df["cuisines_list"].apply(
            lambda cs: any(cuisine in c.lower() for c in cs)
        )

    mask &= df["rating"] >= min_rating

    has_cost = df["approx_cost_for_two"].notna()
    mask &= ~has_cost | (
        (df["approx_cost_for_two"] >= bucket["min"])
        & (df["approx_cost_for_two"] <= bucket["max"])
    )

    result = df[mask].copy()
    if result.empty:
        # fall back to all restaurants if filters are too strict
        result = df.copy()

    return result


def filter_by_vibe(df: pd.DataFrame, vibe: str) -> pd.DataFrame:
    df = df.copy()
    vibe = (vibe or "").lower()

    def boost(row: pd.Series) -> float:
        name = str(row["name"]).lower()
        cuisines = " ".join(row["cuisines_list"]).lower()
        score = 0.0
        if vibe == "romantic":
            if "lounge" in name or "continental" in cuisines:
                score += 0.2
        elif vibe == "party":
            if "bar" in name or "club" in name or "bar" in cuisines:
                score += 0.2
        elif vibe == "solo":
            if "cafe" in cuisines or "coffee" in cuisines:
                score += 0.2
        return score

    df["rating_boosted"] = df["rating"] + df.apply(boost, axis=1)
    df = df.sort_values(by="rating_boosted", ascending=False)
    return df


def downsample(df: pd.DataFrame, max_candidates: int = MAX_CANDIDATES_FOR_LLM) -> pd.DataFrame:
    if len(df) <= max_candidates:
        return df
    return df.sort_values(by="rating_boosted", ascending=False).head(max_candidates)


def build_gemini_prompt(prefs: Dict[str, Any], candidates: List[Dict[str, Any]]) -> str:
    prefs_summary = f"""
User preferences:
- Place: {prefs.get('place') or 'any'}
- Cuisine: {prefs.get('cuisine') or 'any'}
- Minimum rating: {prefs.get('minRating')}
- Price range: {prefs.get('priceRange')}
- Vibe: {prefs.get('vibe')}
""".strip()

    compact_candidates = []
    for c in candidates[:10]:
        compact_candidates.append(
            {
                "id": c["id"],
                "name": c["name"][:80],
                "location": c["location"][:80],
                "address": c["address"][:120],
                "rating": float(c["rating"]),
                "cuisines": [s[:40] for s in c["cuisines_list"]],
                "approxCostForTwo": c["approx_cost_for_two"],
            }
        )

    instructions = """
You are an AI concierge helping a user choose a restaurant based on their preferences and desired vibe.

You will receive:
- The user's preferences (location, cuisine, minimum rating, budget, vibe).
- A list of candidate restaurants drawn from Zomato data.

Your task:
1. Carefully consider how well EACH restaurant matches:
   - The requested location (or nearby areas if there are no direct matches),
   - The requested cuisine,
   - The minimum rating,
   - The budget range,
   - And especially the requested vibe (party, romantic, solo, quick catchup).
2. Rank the restaurants from best to worst match.
3. For each restaurant you recommend, provide a short explanation ("reason") that clearly answers:
   - WHY this place fits the user's vibe and filters,
   - What kind of experience they can expect (e.g. ambience, crowd, suitability for families/couples/groups, etc.).

Important constraints:
- ONLY recommend from the provided restaurants.
- Do not invent new restaurants or modify their fields.
- Do not give the exact same reasons for different restaurants.
- Return your answer as STRICT JSON, with no commentary outside the JSON.

The JSON format must be:
[
  {
    "id": "<id of restaurant from the list>",
    "score": <number between 0 and 1, higher is better>,
    "reason": "<one or two sentences explaining why this fits the vibe and filters>"
  },
  ...
]

Return between 3 and 10 restaurants, sorted from highest score to lowest score.
""".strip()

    import json

    return f"""{instructions}

{prefs_summary}

Candidate restaurants (JSON array):
{json.dumps(compact_candidates)}
""".strip()


def call_gemini(prefs: Dict[str, Any], candidates: pd.DataFrame) -> List[Dict[str, Any]]:
    if not GEMINI_API_KEY or candidates.empty:
        return []

    records = candidates.to_dict(orient="records")
    prompt = build_gemini_prompt(prefs, records)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.6,
            "topP": 0.9,
            "maxOutputTokens": 768,
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }

    last_error = None
    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=40)
            if resp.status_code == 429:
                last_error = resp
                wait_sec = (2 ** attempt) * 2  # 2s, 4s, 8s
                if attempt < 2:
                    time.sleep(wait_sec)
                    continue
            resp.raise_for_status()
            break
        except requests.exceptions.HTTPError as e:
            if e.response is not None and e.response.status_code == 429 and attempt < 2:
                last_error = e.response
                wait_sec = (2 ** attempt) * 2
                time.sleep(wait_sec)
                continue
            raise
    else:
        if last_error is not None:
            last_error.raise_for_status()

    data = resp.json()
    raw_text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
        .strip()
    )

    # Try to extract JSON array from the response text
    start = raw_text.find("[")
    end = raw_text.rfind("]")
    json_text = raw_text if start == -1 or end == -1 or end <= start else raw_text[start : end + 1]

    try:
        import json

        parsed = json.loads(json_text)
        if not isinstance(parsed, list):
            return []
        results = []
        for item in parsed:
            rid = str(item.get("id", "")).strip()
            reason = str(item.get("reason", "")).strip()
            score = float(item.get("score") or 0)
            if rid and reason:
                results.append({"id": rid, "score": score, "reason": reason})
        return results
    except Exception:
        return []


def build_summary_line(prefs: Dict[str, Any]) -> str:
    vibe = prefs.get("vibe", "")
    cuisine = prefs.get("cuisine", "")
    price_range = prefs.get("priceRange", "medium")

    if vibe == "romantic":
        vibe_part = "Looks like something special with someone special"
    elif vibe == "party":
        vibe_part = "Party mode on tonight"
    elif vibe == "solo":
        vibe_part = "Craving some peaceful solo time"
    elif vibe == "catchup":
        vibe_part = "Time for a cosy catchup"
    else:
        vibe_part = "You’re in the mood for something tasty"

    cuisine_part = f" with {cuisine} on the menu" if cuisine else ""

    if price_range == "high":
        price_part = " — we’ll keep it premium but worth it."
    elif price_range == "low":
        price_part = " — keeping it budget-friendly without losing the fun."
    else:
        price_part = " — balancing taste and budget just right."

    return f"{vibe_part}{cuisine_part}, and we’ve got your back.{price_part}"


def build_google_maps_url(name: str, address: str) -> str:
    import urllib.parse

    query = urllib.parse.quote_plus(f"{name} {address}".strip())
    return f"https://www.google.com/maps/search/?api=1&query={query}"


def build_uber_deep_link(address: str) -> str:
    import urllib.parse

    encoded = urllib.parse.quote(address.strip())
    return f"https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]={encoded}"


def run_app() -> None:
    st.set_page_config(
        page_title="Zomato AI Personal Concierge",
        page_icon="🍽️",
        layout="wide",
    )

    st.markdown(
        """
<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

html, body, [class^="css"]  {
  font-family: 'Poppins', sans-serif;
}

/* Dark gradient on app root only – avoid touching inner layout so form stays visible */
.stApp {
  background: linear-gradient(to bottom, #0f0f0f, #1a1a1a);
}
.stApp [data-testid="stAppViewContainer"] {
  padding-top: 24px;
  padding-bottom: 48px;
  padding-left: 1rem;
  padding-right: 1rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(24px);
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  background: #E23744;
  color: #fff;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(226, 55, 68, 0.35);
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.25);
  padding: 8px 18px;
  font-size: 13px;
  color: #f5f5f5;
}

/* Form container: glass card */
[data-testid="stForm"] {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(24px);
}

/* Primary submit button (Find places) - only button in form */
[data-testid="stForm"] button {
  background: #E23744 !important;
  color: #fff !important;
  font-weight: 600 !important;
  border-radius: 999px !important;
  padding: 10px 24px !important;
  border: none !important;
}
[data-testid="stForm"] button:hover {
  background: #c42f3a !important;
  box-shadow: 0 10px 30px rgba(226, 55, 68, 0.35);
}

/* Vibe radio: horizontal pills */
[data-testid="stForm"] [role="radiogroup"] {
  gap: 12px;
}
[data-testid="stForm"] [role="radiogroup"] label {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  border-radius: 999px !important;
  padding: 8px 16px !important;
}
[data-testid="stForm"] [role="radiogroup"] label[data-checked="true"],
[data-testid="stForm"] [role="radiogroup"] label:has(input:checked) {
  background: rgba(226, 55, 68, 0.25) !important;
  border-color: #E23744 !important;
  color: #fff !important;
}
</style>
""",
        unsafe_allow_html=True,
    )

    st.markdown(
        """
<div style="text-align:center; margin-bottom:32px;">
  <p style="letter-spacing:0.3em; text-transform:uppercase; color:#FFC107; font-size:11px; font-weight:600; margin-bottom:8px;">
    Zomato AI Personal Concierge
  </p>
  <h1 style="font-size:32px; color:#ffffff; font-weight:600; margin-bottom:8px;">
    Find the perfect place <span style="color:#E23744;">for tonight's vibe</span>
  </h1>
  <p style="max-width:620px; margin:0 auto; color:#cbd5f5; font-size:13px;">
    Tell me where you are, what you're craving, and the mood you're in. I'll match it with Zomato data and AI to suggest spots your friends and family will love.
  </p>
</div>
""",
        unsafe_allow_html=True,
    )

    try:
        df = load_restaurants()
    except Exception as e:
        st.warning(f"Could not load restaurant data. Please check your connection and refresh. ({e!s})")
        df = pd.DataFrame()

    with st.form("search_form"):
        col1, col2 = st.columns(2)
        with col1:
            place = st.selectbox(
                "Location",
                ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "MG Road"],
                index=0,
            )
        with col2:
            cuisine = st.selectbox(
                "Cuisine",
                ["North Indian", "South Indian", "Chinese", "Italian", "Cafe", "Fast Food"],
                index=0,
            )

        col3, col4 = st.columns(2)
        with col3:
            min_rating = st.selectbox("Minimum rating", [3.0, 3.5, 4.0, 4.5], index=1)
        with col4:
            price_range = st.selectbox(
                "Budget (for two)",
                [("Low", "low"), ("Medium", "medium"), ("High", "high")],
                format_func=lambda x: x[0],
                index=1,
            )[1]

        st.markdown("#### Choose your vibe ✨")
        vibe = st.radio(
            "Vibe",
            options=["party", "romantic", "solo", "catchup"],
            format_func=lambda x: {
                "party": "💃 Party",
                "romantic": "🕯️ Romantic",
                "solo": "📚 Solo Peace",
                "catchup": "👥 Quick Catchup",
            }[x],
            index=1,
            horizontal=True,
            label_visibility="collapsed",
        )

        submitted = st.form_submit_button("Find places")

    if submitted:
        prefs = {
            "place": place,
            "cuisine": cuisine,
            "minRating": float(min_rating),
            "priceRange": price_range,
            "vibe": vibe,
        }

        with st.spinner("Cooking up recommendations for you…"):
            filtered = filter_by_user_constraints(df, prefs)
            scored = filter_by_vibe(filtered, prefs["vibe"])
            candidates = downsample(scored)
            try:
                ai_results = call_gemini(prefs, candidates)
            except requests.exceptions.HTTPError as e:
                if e.response is not None and e.response.status_code == 429:
                    st.error(
                        "**Rate limit reached.** The AI service is temporarily limiting requests. "
                        "You can try again in a minute, or browse the suggestions below (without AI reasons)."
                    )
                ai_results = []

        st.markdown(
            f"<p style='text-align:center; color:#e5e7eb; font-size:13px; margin-top:16px;'>{build_summary_line(prefs)}</p>",
            unsafe_allow_html=True,
        )

        if not candidates.empty:
            ai_by_id = {r["id"]: r for r in ai_results}
            rows = []
            for _, row in candidates.iterrows():
                rid = row["id"]
                ai = ai_by_id.get(rid, {})
                rows.append(
                    {
                        "name": row["name"],
                        "location": row["location"],
                        "cuisines": ", ".join(row["cuisines_list"]),
                        "rating": row["rating"],
                        "approx_cost": row["approx_cost_for_two"],
                        "ai_reason": ai.get(
                            "reason",
                            "This place matches your filters and vibe based on ratings, cuisine, and budget.",
                        ),
                        "maps_url": build_google_maps_url(row["name"], row["address"]),
                        "uber_url": build_uber_deep_link(row["address"]),
                        "zomato_url": row["url"],
                    }
                )

            rows = rows[:10]

            for r in rows:
                st.markdown(
                    f"""
<div class="glass-card" style="padding:18px; margin-top:18px;">
  <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
    <div>
      <h3 style="color:#ffffff; font-size:18px; margin:0 0 4px 0;">{r['name']}</h3>
      <p style="color:#9ca3af; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 4px 0;">
        {r['location']} • {r['cuisines']}
      </p>
      <p style="color:#FFC107; font-size:13px; font-weight:500; margin:0;">
        ⭐ {r['rating']:.1f} • Approx ₹{int(r['approx_cost']) if r['approx_cost'] and not pd.isna(r['approx_cost']) else 'N/A'}
      </p>
    </div>
    <div style="background:rgba(255,193,7,0.1); color:#FFC107; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:600;">
      Popular choice! 🔥
    </div>
  </div>
  <div style="margin-top:10px; padding:10px; border-radius:12px; background:rgba(255,255,255,0.04); color:#e5e7eb; font-size:13px;">
    <p style="margin:0 0 4px 0; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af;">AI Why</p>
    <p style="margin:0; line-height:1.5;">{r['ai_reason']}</p>
  </div>
  <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
    <a href="{r['maps_url']}" target="_blank" class="primary-button">🗺️ Open in Maps</a>
    <a href="{r['uber_url']}" target="_blank" class="secondary-button">🚗 Book Uber</a>
    <a href="{r['zomato_url']}" target="_blank" class="secondary-button">🍴 Zomato Menu</a>
  </div>
</div>
""",
                    unsafe_allow_html=True,
                )
        else:
            st.info("No restaurants found for those filters. Try relaxing your rating or budget.")


if __name__ == "__main__":
    run_app()

