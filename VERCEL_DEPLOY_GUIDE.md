# Backend & NLP Service – Vercel Par Deploy (Step by Step)

Aapka frontend pehle se Vercel par hai. Ab **backend** aur **NLP service** bhi Vercel par deploy karenge (Render/Railway ki jagah).

---

## Overview

- **Backend (Node/Express)** → Ek alag Vercel project (root: `backend`)
- **NLP (Python)** → Ek alag Vercel project (root: `nlp_service`)
- **Frontend** → Pehle wala project (root: `career_intelligence_platform`)

Teen alag Vercel projects, same GitHub repo se.

---

## Step 1: GitHub Par Changes Push Karein

Pehle backend + NLP ke liye jo files add ki hain (api, vercel.json, lib, etc.) unhe commit karke push karein:

```powershell
cd "d:\Career Intelligence Platform"
git add .
git status
git commit -m "Add Vercel config for backend and NLP service"
git push origin main
```

---

## Step 2: Backend Vercel Par Deploy Karein

### 2.1 Naya Project

1. **https://vercel.com** → Login
2. **"Add New..."** → **"Project"**
3. **"Import Git Repository"** → `Career_intelligence_platform` select karein
4. **"Import"** click karein

### 2.2 Backend Project Settings

1. **Project Name:** `career-intelligence-backend` (ya koi unique naam)
2. **Root Directory:**  
   - **"Edit"** click karein  
   - **`backend`** select karein  
   - **"Continue"**  
3. **Framework Preset:** Other (ya "No framework" / "Other")
4. **Build Command:** khali chhod dein ya `npm install` (Vercel auto karega)
5. **Output Directory:** khali
6. **Install Command:** `npm install` (default)

### 2.3 Environment Variables (Backend)

**Environment Variables** section mein ye add karein (sab **Production** ke liye):

| Key | Value |
|-----|--------|
| `DB_HOST` | `your-aiven-host.aivencloud.com` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(apna Aiven password - dashboard se copy karein)* |
| `DB_NAME` | `Resume_Analyzer` |
| `DB_PORT` | `22617` |
| `JWT_SECRET` | *(apna strong random string)* |
| `JWT_EXPIRES_IN` | `7d` |
| `GEMINI_API_KEY` | *(apna Gemini API key)* |
| `NLP_SERVICE_URL` | *(abhi khali; Step 3 ke baad NLP URL dalenge)* |

**Important:**  
- `NLP_SERVICE_URL` abhi **empty** rakhein.  
- NLP deploy hone ke baad value hogi: `https://<nlp-project>.vercel.app/api`  
  (trailing slash ke bina: `https://xxx.vercel.app/api`)

### 2.4 Deploy

1. **"Deploy"** click karein
2. Deploy complete hone ka wait karein
3. **Backend URL** copy karein, e.g.  
   `https://career-intelligence-backend-xxx.vercel.app`  
   Isi URL ko baad mein frontend ke `REACT_APP_API_BASE_URL` mein use karenge.

---

## Step 3: NLP Service Vercel Par Deploy Karein

### 3.1 Naya Project

1. Vercel dashboard → **"Add New..."** → **"Project"**
2. Phir se **same repo** `Career_intelligence_platform` select karein
3. **"Import"** click karein

### 3.2 NLP Project Settings

1. **Project Name:** `career-intelligence-nlp` (ya koi unique naam)
2. **Root Directory:**  
   - **"Edit"** → **`nlp_service`** select karein → **"Continue"**
3. **Framework Preset:** Other
4. **Build Command:** khali (Vercel Python auto handle karega)
5. **Output Directory:** khali

### 3.3 Environment Variables (NLP)

NLP ke liye koi zaruri env vars nahi (abhi). Agar baad mein chahiye to add kar sakte hain.

### 3.4 Deploy

1. **"Deploy"** click karein
2. Deploy complete hone ka wait karein
3. **NLP base URL** copy karein:  
   `https://career-intelligence-nlp-xxx.vercel.app`  
   Backend ko dena hai: **`https://career-intelligence-nlp-xxx.vercel.app/api`**  
   (yani URL ke end par `/api` laga dena).

---

## Step 4: URLs Update Karein

### 4.1 Backend Mein NLP URL

1. Vercel → **Backend project** → **Settings** → **Environment Variables**
2. **`NLP_SERVICE_URL`** add karein (ya update karein):  
   **Value:** `https://career-intelligence-nlp-xxx.vercel.app/api`  
   (apna NLP project URL + `/api`)
3. Save karein
4. **Deployments** → latest deployment → **"Redeploy"** (optional par recommended)

### 4.2 Frontend Mein Backend URL

1. Vercel → **Frontend project** (career-intelligence) → **Settings** → **Environment Variables**
2. **`REACT_APP_API_BASE_URL`** add/update karein:  
   **Value:** `https://career-intelligence-backend-xxx.vercel.app`  
   (apna backend project URL, bina trailing slash)
3. Save karein
4. **Deployments** → **"Redeploy"** (taake naya env variable use ho)

---

## Step 5: Test Karein

### 5.1 Health / API Checks

- **Backend:**  
  `https://career-intelligence-backend-xxx.vercel.app/api/health`  
  Response: `{"status":"ok"}`
- **NLP:**  
  `https://career-intelligence-nlp-xxx.vercel.app/api/health`  
  Response: `{"status":"ok"}`
- **Frontend:**  
  `https://career-intelligence.vercel.app`  
  Homepage load honi chahiye

### 5.2 Flow Test

1. Frontend se login/signup
2. Resume upload
3. Analysis run karke result check karein

---

## Summary

| Service | Vercel Project Name | Root Directory | URL (example) |
|--------|----------------------|----------------|----------------|
| Frontend | career-intelligence | `career_intelligence_platform` | https://career-intelligence.vercel.app |
| Backend | career-intelligence-backend | `backend` | https://career-intelligence-backend-xxx.vercel.app |
| NLP | career-intelligence-nlp | `nlp_service` | https://career-intelligence-nlp-xxx.vercel.app/api |

- **Backend env:** `NLP_SERVICE_URL` = NLP project URL + `/api`
- **Frontend env:** `REACT_APP_API_BASE_URL` = Backend project URL (bina `/api`)

---

## Agar Error Aaye

1. **Backend deploy fail:**  
   - Root Directory **`backend`** hai confirm karein  
   - Logs mein `api/index.js` ya db/env errors check karein

2. **NLP deploy fail:**  
   - Root Directory **`nlp_service`** hai confirm karein  
   - `api/` aur `lib/` dono repo mein hon

3. **Resume upload / analysis fail:**  
   - Frontend env: `REACT_APP_API_BASE_URL` = backend URL  
   - Backend env: `NLP_SERVICE_URL` = NLP URL + `/api`  
   - Dono projects redeploy karke phir test karein

Is guide ke hisaab se backend aur NLP dono Vercel par deploy ho sakte hain. Agar kisi step par exact error message aaye to woh bata dena, us hisaab se next fix bata sakte hain.
