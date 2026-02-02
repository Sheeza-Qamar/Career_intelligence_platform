# 🚀 Deployment Steps - Ab Kya Karna Hai

## ✅ Step 1: COMPLETED
- [x] Git issues fix kiye
- [x] Secrets remove kiye
- [x] Code GitHub par push kiya

---

## 🌐 Step 2: Frontend Deploy Karein (Vercel) - 5 Minutes

### 2.1 Vercel Account Banana
1. Browser mein jao: **https://vercel.com**
2. "Sign Up" button click karein
3. **GitHub account se sign up karein** (easiest way)
4. GitHub ko authorize karein

### 2.2 Project Deploy Karein
1. Vercel dashboard mein **"Add New Project"** click karein
2. Apna repository select karein: **`Career_intelligence_platform`**
3. **Important Settings:**
   - **Root Directory:** `career_intelligence_platform` (dropdown se select karein)
   - **Framework Preset:** Create React App (auto detect hoga)
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `build` (auto)

4. **Environment Variables:**
   - "Environment Variables" section mein jao
   - Add karein:
     ```
     Key: REACT_APP_API_BASE_URL
     Value: (abhi empty rakhein, baad mein backend URL add karengay)
     ```
   - Ya phir abhi skip karein, baad mein add kar sakte hain

5. **"Deploy"** button click karein
6. 2-3 minutes wait karein

### 2.3 Frontend URL Mil Jayega
- Example: `https://career-intelligence-platform.vercel.app`
- **Ye URL note karein** - baad mein use karengay

---

## 🔧 Step 3: Backend Deploy Karein (Render) - 10 Minutes

### 3.1 Render Account Banana
1. Browser mein jao: **https://render.com**
2. "Get Started for Free" click karein
3. **GitHub account se sign up karein**
4. GitHub ko authorize karein

### 3.2 Backend Service Deploy Karein
1. Render dashboard mein **"New +"** button click karein
2. **"Web Service"** select karein
3. GitHub repository connect karein: **`Career_intelligence_platform`**

4. **Settings Configure Karein:**
   - **Name:** `career-intelligence-backend`
   - **Region:** (apne hisab se - closest)
   - **Branch:** `main`
   - **Root Directory:** `backend` ⚠️ **IMPORTANT**
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** **Free** (select karein)

5. **Environment Variables Add Karein:**
   "Environment Variables" section mein ye sab add karein:
   
   ```
   DB_HOST=your-aiven-host.aivencloud.com
   DB_USER=avnadmin
   DB_PASSWORD=your-aiven-db-password
   DB_NAME=Resume_Analyzer
   DB_PORT=22617
   PORT=5000
   JWT_SECRET=<apna-strong-random-string-yahan-dalo>
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your-gemini-api-key
   NLP_SERVICE_URL=<abhi-empty-rakhein-baad-mein-add-karengay>
   ```
   *(DB_PASSWORD aur GEMINI_API_KEY apne Aiven/Google dashboards se copy karein.)*

   **⚠️ Important:**
   - `JWT_SECRET` ko strong random string se replace karein
   - Windows PowerShell mein: `[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))`
   - Ya online generator use karein: https://randomkeygen.com/

6. **"Create Web Service"** click karein
7. Deployment start ho jayega (5-10 minutes lag sakte hain)

### 3.3 Backend URL Mil Jayega
- Example: `https://career-intelligence-backend.onrender.com`
- **Ye URL note karein** - frontend aur NLP service mein use karengay

---

## 🐍 Step 4: NLP Service Deploy Karein (Render) - 10 Minutes

### 4.1 NLP Service Deploy Karein
1. Render dashboard mein phir se **"New +"** button click karein
2. **"Web Service"** select karein
3. Same GitHub repository select karein: **`Career_intelligence_platform`**

4. **Settings Configure Karein:**
   - **Name:** `career-intelligence-nlp`
   - **Region:** (same as backend)
   - **Branch:** `main`
   - **Root Directory:** `nlp_service` ⚠️ **IMPORTANT**
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** **Free** (select karein)

5. **Environment Variables:** Koi zarurat nahi (abhi ke liye)

6. **"Create Web Service"** click karein
7. Deployment start ho jayega (5-10 minutes lag sakte hain)

### 4.2 NLP Service URL Mil Jayega
- Example: `https://career-intelligence-nlp.onrender.com`
- **Ye URL note karein**

---

## 🔄 Step 5: URLs Update Karein - 5 Minutes

### 5.1 Backend Mein NLP Service URL Add Karein
1. Render dashboard mein **backend service** par jao
2. **"Environment"** tab mein jao
3. **"Add Environment Variable"** click karein
4. Add karein:
   ```
   Key: NLP_SERVICE_URL
   Value: https://career-intelligence-nlp.onrender.com
   ```
   (apna actual NLP service URL dalo)
5. **"Save Changes"** click karein
6. Service automatically restart ho jayega

### 5.2 Frontend Mein Backend URL Add Karein
1. Vercel dashboard mein **frontend project** par jao
2. **"Settings"** → **"Environment Variables"** mein jao
3. **"Add New"** click karein
4. Add karein:
   ```
   Key: REACT_APP_API_BASE_URL
   Value: https://career-intelligence-backend.onrender.com
   ```
   (apna actual backend URL dalo)
5. **"Save"** click karein
6. **"Redeploy"** karein (ya automatic ho jayega)

---

## ✅ Step 6: Testing - 5 Minutes

### 6.1 Health Checks Karein

**Backend Health Check:**
Browser mein open karein:
```
https://career-intelligence-backend.onrender.com/api/health
```
Response: `{"status":"ok"}` aana chahiye ✅

**NLP Service Health Check:**
Browser mein open karein:
```
https://career-intelligence-nlp.onrender.com/health
```
Response: `{"status":"ok"}` aana chahiye ✅

**Frontend:**
- Apna Vercel URL browser mein open karein
- Homepage load hona chahiye ✅

### 6.2 Complete Flow Test Karein
1. Frontend par signup/login karein
2. Resume upload karein
3. Analysis run karein
4. Results check karein

---

## 📝 Quick Checklist

- [ ] Vercel account bana
- [ ] Frontend deploy kiya
- [ ] Frontend URL note kiya
- [ ] Render account bana
- [ ] Backend deploy kiya
- [ ] Backend URL note kiya
- [ ] NLP service deploy kiya
- [ ] NLP service URL note kiya
- [ ] Backend mein NLP URL add kiya
- [ ] Frontend mein Backend URL add kiya
- [ ] Health checks pass ho rahe hain
- [ ] Complete flow test kiya

---

## 🎉 Success!

Agar sab kuch sahi se ho gaya, to aapka complete application live hai! 🚀

**Frontend:** `https://your-app.vercel.app`
**Backend:** `https://your-backend.onrender.com`
**NLP Service:** `https://your-nlp.onrender.com`

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Render free tier services 15 minutes inactivity ke baad sleep ho jate hain
   - First request slow hoga (wake-up time: 15-30 seconds)
   - Baad mein fast ho jayega

2. **Environment Variables:**
   - Kabhi bhi `.env` file commit mat karna (already safe hai ✅)
   - Secrets ko hosting platform par directly add karein

3. **Database:**
   - Aapka database already Aiven cloud par hai ✅
   - Koi change ki zarurat nahi

---

## 🆘 Help Chahiye?

Agar koi problem aaye:
1. Deployment logs check karein (hosting platform par)
2. Browser console check karein (F12)
3. Health endpoints test karein
4. Environment variables verify karein

**Good Luck! 🍀**
