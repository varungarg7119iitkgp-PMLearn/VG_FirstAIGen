# Project structure and deploy targets

One **Git repo** (`VG_FirstAIGen`) contains **two app codebases** and is used for **three ways** to run or host the Zomato AI Personal Concierge.

---

## Repo layout (correct terminology)

| Folder / file        | What it is                          | Deploy / run target        |
|----------------------|-------------------------------------|----------------------------|
| **web/**             | Next.js app (React, Tailwind, API)  | **Vercel** or local `npm run dev` |
| **streamlit_app/**   | Streamlit app (Python)              | **Streamlit Cloud** or local `streamlit run app.py` |
| **phases/**, **\*.md** | Docs, architecture, phase READMEs | Not deployed               |

There is **no** separate `vercel/` folder. Vercel deploys the **web** app by using **Root Directory: `web`** in the Vercel project settings.

---

## Deploy targets (chain of thinking)

1. **Web app (Next.js) → Vercel**  
   - **Code:** `web/`  
   - **UI:** Same as local web (vibe picker, cards, Maps/Uber/Zomato).  
   - **Deploy:** Connect repo in Vercel, set Root Directory to `web`, add `GEMINI_API_KEY`, deploy.  
   - **Doc:** [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

2. **Streamlit app → Streamlit Cloud**  
   - **Code:** `streamlit_app/`  
   - **UI:** Streamlit widgets and custom CSS.  
   - **Deploy:** Streamlit Cloud, main file `streamlit_app/app.py`, add secrets.  
   - **Doc:** [DEPLOY_STREAMLIT.md](./DEPLOY_STREAMLIT.md)

3. **Local only**  
   - **Web:** `cd web && npm install && npm run dev`  
   - **Streamlit:** `cd streamlit_app && streamlit run app.py`

---

## Summary

- **2 app codebases:** `web/` (Next.js), `streamlit_app/` (Streamlit).  
- **3 ways to run/host:** Local (web + Streamlit), **Vercel** (web), **Streamlit Cloud** (streamlit_app).  
- **Vercel** = same UI as **web**, better rendering and hosting for that front-end; no separate “vercel” repo or folder.
