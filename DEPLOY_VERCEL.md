# Deploy the Web App (Next.js) to Vercel

The **same UI/UX** you see in the `web/` app (Next.js, Tailwind, dark gourmet theme) is deployed to **Vercel**. There is no separate "vercel" codebase — Vercel hosts the existing **web** app.

---

## 1. Prerequisites

- GitHub repo pushed: `varungarg7119iitkgp-PMLearn/VG_FirstAIGen`
- A [Vercel account](https://vercel.com) (sign in with GitHub).

---

## 2. Import the project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** the repository: `varungarg7119iitkgp-PMLearn/VG_FirstAIGen`.
3. **Root Directory:** click **Edit** and set to **`web`** (so Vercel builds the Next.js app, not the repo root).
4. **Framework Preset:** Vercel should auto-detect **Next.js**. Leave as is.
5. **Build Command:** `npm run build` (default).
6. **Output Directory:** leave default (Next.js default).
7. **Install Command:** `npm install` (default).

---

## 3. Environment variables

Before deploying, add:

| Name               | Value                    | Notes                          |
|--------------------|--------------------------|--------------------------------|
| `GEMINI_API_KEY`   | Your Gemini API key      | **Required** for AI rankings.  |
| `GEMINI_MODEL`     | `gemini-2.0-flash`       | Optional; this is the default. |
| `ZOMATO_DATASET_URL` | (leave empty to use default) | Optional; default Hugging Face URL is used if unset. |

In Vercel: **Project → Settings → Environment Variables** (or during import). Add for **Production**, and optionally **Preview** if you use branch previews.

---

## 4. Deploy

Click **Deploy**. Vercel will:

- Run `npm install` and `npm run build` inside the **web** directory.
- Assign a URL like `your-project.vercel.app` (or your custom domain).

---

## 5. After deployment

- Your **same web UI** (vibe picker, search form, result cards, Maps/Uber/Zomato links) runs on Vercel.
- Updates: change code in **web/** in Cursor → commit → push to **main** → Vercel will auto-redeploy.
- No separate "vercel" folder or repo; **web** is the only codebase for this deployment.

---

## Quick reference

| Field / Action      | Value / Result                    |
|--------------------|-----------------------------------|
| **Root Directory**| `web`                             |
| **Framework**      | Next.js (auto)                    |
| **Build**          | `npm run build`                   |
| **Env (required)** | `GEMINI_API_KEY`                  |
| **Env (optional)** | `GEMINI_MODEL`, `ZOMATO_DATASET_URL` |
