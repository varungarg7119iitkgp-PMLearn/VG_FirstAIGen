## UI Design – Zomato AI Personal Concierge

This document captures the **visual and interaction design** for the Zomato AI web tool. It complements `architecture.md`, which focuses on data flow and system layers.

---

## 1. Global Look & Feel

- **Font**
  - Global font: `'Poppins', sans-serif`.

- **Theme**
  - “Dark Mode Gourmet” aesthetic.
  - Background:
    - `linear-gradient(to bottom, #0f0f0f, #1a1a1a)` (deep charcoal gradient).
    - Consider slight variations (deep navy → black or dark chocolate → black) to make food images and accents pop.

- **Accent Colors**
  - Primary actions: **Zomato Red** – `#E23744`.
  - Ratings and social proof highlights: **Warm Gold** – `#FFC107`.
  - Text:
    - Primary text: light gray / off-white (e.g., `#f5f5f5`).
    - Secondary text: medium gray (e.g., `#b0b0b0`).

---

## 2. Layout Direction

- Inspired by the provided restaurant landing page designs:
  - Hero-like main section with:
    - Short tagline and description.
    - Prominent **Search Form** and **Vibe Selector**.
  - Recommendations area below:
    - Grid or vertical list of **Recommendation Cards** with food imagery (when available).
  - Consistent padding and generous spacing for a premium feel.

---

## 3. Core Components

### 3.1 Vibe Selector

- **Purpose**
  - Let users pick the “vibe” of the outing (e.g., party, romantic, solo).

- **Design**
  - Displayed as a responsive **grid of buttons**.
  - Each button contains:
    - An emoji.
    - A short label.
  - Example options:
    - `💃 Party`
    - `🕯️ Romantic`
    - `📚 Solo Peace`
    - `👥 Quick Catchup`

- **Interaction**
  - Hover:
    - Slight **scale-up** (e.g., `transform: scale(1.03)`).
    - Subtle glow or shadow using Zomato Red or gold.
  - Selected state:
    - Filled background in Zomato Red with light text.
    - Clear border or glow to indicate active selection.

---

### 3.2 Input Form

- **Fields**
  - Location: “Where are we eating? 📍”
  - Cuisine: “What are we craving? 🍽️”
  - Minimum rating: dropdown/slider.
  - Price range: dropdown or pill buttons.
  - Vibe: connected to **Vibe Selector** component.

- **Visual Style**
  - Minimal, dark input fields:
    - Slightly lighter background than page gradient.
    - Subtle 1px border in dark gray; border accent on focus in Zomato Red.
  - Rounded corners for inputs and buttons.
  - Placeholders include relevant emojis, as above, to keep tone friendly.

---

### 3.3 Recommendation Cards

- **Container**
  - Dark **glassmorphism** style:
    - Semi-transparent background with blur (e.g., `backdrop-filter: blur(16px)`).
    - Soft border with low-opacity white or gray.
  - Rounded corners and subtle drop shadow to float above the gradient background.

- **Content Layout**
  - Top row:
    - Restaurant name, rating (in gold), location/cuisine summary.
    - **Social Proof badge** at the top-right: e.g. “Popular choice! 🔥” in gold.
  - Middle:
    - Key details:
      - Cuisines list.
      - Approximate cost for two.
  - Bottom:
    - **“AI Why”** box:
      - Distinct sub-panel or highlighted area within the card.
      - Light text color for readability.
      - Short explanation text, e.g.:
        - “Since you chose ‘Romantic’, this place has cozy lighting and high ratings for ambience.”

- **Action Buttons**
  - Positioned together at the bottom of each card.
  - Large, pill-shaped buttons with icons:
    - “Open in Maps” `🗺️`
    - “Book Uber” `🚗`
    - “Zomato Menu” `🍴`
  - Primary color: Zomato Red background with light text.
  - Hover:
    - Slight scale-up and increased brightness.

---

## 4. States & Animations

- **Loading / Searching**
  - While waiting for recommendations:
    - Use skeleton cards or a simple animated loader.
    - Optionally show a fun message like “Cooking up recommendations…”.

- **Transition to Recommendations**
  - When data arrives:
    - Cards appear with a **fade-in + slide-up** effect.
    - Timing: short (200–400ms) for responsiveness, possibly staggered for each card.

- **Empty State**
  - Friendly message:
    - “We couldn’t find a match for those filters. Try relaxing your budget or rating.”

- **Error State**
  - Clear, non-technical wording and a retry button.

---

## 5. Responsive Behavior

- **Desktop**
  - Hero section centered, with form and vibe selector prominent.
  - Recommendation cards in a grid (2–3 columns depending on width).

- **Tablet / Mobile**
  - Single-column layout.
  - Vibe selector becomes a horizontal scrollable row or stacked grid.
  - Cards remain full-width with preserved glassmorphism styling.

---

## 6. Visual Consistency Notes

- Use Zomato Red sparingly for **primary actions and highlights**, not for large blocks of background.
- Use Warm Gold primarily for:
  - Ratings stars or numbers.
  - Social proof badges (“Popular choice! 🔥”).
- Keep sufficient contrast between text and backgrounds for readability.

