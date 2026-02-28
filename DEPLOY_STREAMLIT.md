# Deploy this app to Streamlit Community Cloud

## 1. Push your code to GitHub

From the project root, run:

```bash
git add .
git commit -m "Add Zomato AI Concierge Streamlit app"
git remote add origin https://github.com/varungarg7119iitkgp-PMLearn/VG_FirstAIGen.git
git push -u origin main
```

(If `origin` already exists, use `git push -u origin main` only.)

## 2. In the Streamlit "Deploy an app" form

| Field | Value |
|-------|--------|
| **Repository** | `varungarg7119iitkgp-PMLearn/VG_FirstAIGen` |
| **Branch** | `main` |
| **Main file path** | `streamlit_app/app.py` ← use **forward slashes** |
| **App URL (optional)** | `zomatorecovarungargai` (or any name you like) |

## 3. After deployment: add secrets

In the app’s **Settings → Secrets**, add your Gemini API key:

```toml
GEMINI_API_KEY = "your-api-key-here"
```

Save and let the app redeploy. Your app will be live at `https://zomatorecovarungargai.streamlit.app` (or the URL you chose).
