# SkillUp — Cloud Deployment Guide

This guide explains how to deploy both the **Frontend** and **Backend** so that `https://skillupin.web.app` works seamlessly.

---

## 1. Why Did the Error Occur?

When you deploy to **Firebase Hosting** (`skillupin.web.app`), Firebase hosts **only the frontend static files** (`frontend/dist`: HTML, CSS, JavaScript). 

Firebase Hosting does **not** run Python or the FastAPI backend server. 

When you clicked on **Student (Arjun)** on `skillupin.web.app`:
1. The frontend sent an authentication request to `https://skillupin.web.app/api/v1/auth/login`.
2. Because there was no Python backend running on Firebase Hosting, Firebase's Single-Page-App rewrite caught the request and served `index.html` (`<!doctype html>...`) with status 200.
3. The frontend tried to parse that HTML file as JSON, causing:
   ```
   Unexpected token '<', "<!doctype "... is not valid JSON
   ```

---

## 2. Solution Overview

SkillUp is a full-stack platform:
- **Frontend:** React + Vite (hosted on Firebase Hosting)
- **Backend:** Python 3.11 + FastAPI + Scikit-Learn + MongoDB Atlas (needs a Python cloud host)

You need to host your backend on an HTTPS-enabled cloud service and point your frontend to it.

---

## 3. Option A: Free 1-Click Cloud Deployment via Render (Recommended)

[Render.com](https://render.com) provides free cloud hosting for Python FastAPI backends.

### Step 1: Create a Web Service on Render
1. Push this project to GitHub (or create a repository for it).
2. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. In the **Environment Variables** section, add:
   - `MONGODB_URI`: `mongodb+srv://SameerPandey749:Sameer%40Mongo@cluster0.x4ica54.mongodb.net/`
   - `MONGODB_DB_NAME`: `skillup_db`
   - `SECRET_KEY`: `skillup_omegamma_super_secret_local_jwt_key_2026`
6. Click **Create Web Service**. Render will deploy your backend and provide an HTTPS URL (e.g. `https://skillup-api.onrender.com`).

### Step 2: Point Frontend to Render and Redeploy to Firebase
1. In `frontend/.env.production` (or in `frontend/.env`), set:
   ```env
   VITE_API_BASE_URL="https://skillup-api.onrender.com/api/v1"
   ```
   *(Replace with your actual Render URL)*
2. Build and redeploy the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```
3. Visit `https://skillupin.web.app` — demo login and all features will now work live!

---

## 4. Option B: Google Cloud Run (Native Firebase Integration)

Since your Firebase project is `omegamma-ai-in`, you can deploy the backend to Google Cloud Run within the same project.

### Step 1: Deploy Backend to Cloud Run
From the `backend` folder:
```bash
gcloud run deploy skillup-backend \
  --source . \
  --region us-central1 \
  --project omegamma-ai-in \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI="mongodb+srv://SameerPandey749:Sameer%40Mongo@cluster0.x4ica54.mongodb.net/",MONGODB_DB_NAME="skillup_db",SECRET_KEY="skillup_omegamma_super_secret_local_jwt_key_2026"
```

### Step 2: Configure Firebase Hosting Rewrite
In `firebase.json`, add the Cloud Run rewrite:
```json
{
  "hosting": {
    "site": "skillupin",
    "public": "frontend/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "skillup-backend",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
Then deploy:
```bash
firebase deploy --only hosting
```
With this configuration, Firebase Hosting proxies `/api/**` directly to your Cloud Run backend with zero CORS configuration required!

---

## 5. Option C: Quick Live Demonstration (Using Local Backend)

If you want to demo or test `https://skillupin.web.app` immediately with your currently running localhost backend:
1. Start your local backend (running on port 8000).
2. Expose it via an HTTPS tunnel (e.g., using `ngrok` or `localtunnel`):
   ```bash
   npx localtunnel --port 8000
   ```
   This gives an HTTPS URL like `https://funny-tiger-80.loca.lt`.
3. In `frontend/.env.production`:
   ```env
   VITE_API_BASE_URL="https://funny-tiger-80.loca.lt/api/v1"
   ```
4. Build and deploy:
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

