# 🎯 Next Steps - Backend & NLP Service Deploy

## ✅ Step 1: COMPLETED
- [x] Frontend deployed on Vercel: https://career-intelligence.vercel.app/

---

## 🔧 Step 2: Backend Deploy Karein (Render) - 10 Minutes

### 2.1 Render Account Banana (Agar nahi hai)
1. Browser mein jao: **https://render.com**
2. **"Get Started for Free"** click karein
3. **GitHub account se sign up karein**
4. GitHub ko authorize karein

### 2.2 Backend Service Deploy Karein

1. Render dashboard mein **"New +"** button click karein
2. **"Web Service"** select karein
3. GitHub repository connect karein: **`Career_intelligence_platform`**

4. **Settings Configure Karein:**
   ```
   Name: career-intelligence-backend
   Region: (apne hisab se - closest select karein)
   Branch: main
   Root Directory: backend ⚠️ IMPORTANT - ye zaruri hai!
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free (select karein)
   ```

5. **Environment Variables Add Karein:**
   "Environment Variables" section mein ye sab add karein (ek ek karke):
   
   ```
   DB_HOST = your-aiven-host.aivencloud.com
   DB_USER = avnadmin
   DB_PASSWORD = your-aiven-db-password
   DB_NAME = Resume_Analyzer
   DB_PORT = 22617
   PORT = 5000
   JWT_SECRET = <strong-random-string-yahan-dalo>
   JWT_EXPIRES_IN = 7d
   GEMINI_API_KEY = your-gemini-api-key
   NLP_SERVICE_URL = <abhi-empty-rakhein-baad-mein-add-karengay>
   ```
   *(DB_PASSWORD aur GEMINI_API_KEY apne dashboards se copy karein.)*

   **⚠️ Important:**
   - `JWT_SECRET` ko strong random string se replace karein
   - Windows PowerShell mein ye command run karein:
     ```powershell
     [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
     ```
   - Ya online generator use karein: https://randomkeygen.com/
   - `NLP_SERVICE_URL` abhi empty rakhein, baad mein add karengay

6. **"Create Web Service"** click karein
7. Deployment start ho jayega (5-10 minutes lag sakte hain)
8. **Backend URL note karein** - Example: `https://career-intelligence-backend.onrender.com`

---

## 🐍 Step 3: NLP Service Deploy Karein (Render) - 10 Minutes

### 3.1 NLP Service Deploy Karein

1. Render dashboard mein phir se **"New +"** button click karein
2. **"Web Service"** select karein
3. Same GitHub repository select karein: **`Career_intelligence_platform`**

4. **Settings Configure Karein:**
   ```
   Name: career-intelligence-nlp
   Region: (same as backend)
   Branch: main
   Root Directory: nlp_service ⚠️ IMPORTANT - ye zaruri hai!
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   Plan: Free (select karein)
   ```

5. **Environment Variables:** Koi zarurat nahi (abhi ke liye)

6. **"Create Web Service"** click karein
7. Deployment start ho jayega (5-10 minutes lag sakte hain)
8. **NLP Service URL note karein** - Example: `https://career-intelligence-nlp.onrender.com`

---

## 🔄 Step 4: URLs Update Karein - 5 Minutes

### 4.1 Backend Mein NLP Service URL Add Karein

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

### 4.2 Frontend Mein Backend URL Add Karein

1. Vercel dashboard mein jao: **https://vercel.com**
2. Apna project **"career-intelligence"** select karein
3. **"Settings"** → **"Environment Variables"** mein jao
4. **"Add New"** click karein
5. Add karein:
   ```
   Key: REACT_APP_API_BASE_URL
   Value: https://career-intelligence-backend.onrender.com
   ```
   (apna actual backend URL dalo)
6. **Environment:** Sab select karein (Production, Preview, Development)
7. **"Save"** click karein
8. **"Deployments"** tab par jao
9. Latest deployment par **"Redeploy"** click karein

---

## ✅ Step 5: Testing - 5 Minutes

### 5.1 Health Checks Karein

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
- Apna frontend URL open karein: https://career-intelligence.vercel.app/
- Homepage load hona chahiye ✅

### 5.2 Complete Flow Test Karein

1. Frontend par signup/login karein
2. Resume upload karein
3. Analysis run karein
4. Results check karein

---

## 📝 Quick Checklist

- [ ] Render account bana (agar nahi hai)
- [ ] Backend deploy kiya
- [ ] Backend URL note kiya
- [ ] NLP service deploy kiya
- [ ] NLP service URL note kiya
- [ ] Backend mein NLP URL add kiya
- [ ] Frontend mein Backend URL add kiya
- [ ] Frontend redeploy kiya
- [ ] Health checks pass ho rahe hain
- [ ] Complete flow test kiya

---

## ⚠️ Important Notes

1. **Render Free Tier:**
   - Services 15 minutes inactivity ke baad sleep ho jate hain
   - First request slow hoga (wake-up time: 15-30 seconds)
   - Baad mein fast ho jayega

2. **Root Directory:**
   - Backend: `backend` ⚠️ zaruri hai
   - NLP Service: `nlp_service` ⚠️ zaruri hai
   - Agar galat root directory select kiya to deployment fail ho jayega

3. **Environment Variables:**
   - Backend mein sab environment variables add karein
   - Frontend mein sirf `REACT_APP_API_BASE_URL` add karein
   - Redeploy zaruri hai after adding environment variables

---

## 🎉 Success!

Agar sab kuch sahi se ho gaya, to aapka complete application live hai! 🚀

**Frontend:** https://career-intelligence.vercel.app/ ✅
**Backend:** `https://your-backend.onrender.com` (deploy karke URL mil jayega)
**NLP Service:** `https://your-nlp.onrender.com` (deploy karke URL mil jayega)

---

## 🆘 Help Chahiye?

Agar koi problem aaye:
1. Deployment logs check karein (Render/Vercel dashboard par)
2. Browser console check karein (F12)
3. Health endpoints test karein
4. Environment variables verify karein

**Good Luck! 🍀**
