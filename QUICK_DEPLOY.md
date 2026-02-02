# ⚡ Quick Deployment Steps (Jaldi Se Deploy Karein)

## 🎯 3 Simple Steps

### Step 1: Git Fix Commit Karein
```bash
cd "d:\Career Intelligence Platform"
git add .
git commit -m "Fix test and add deployment configs"
git push origin main
```

### Step 2: Frontend Deploy (Vercel) - 5 Minutes
1. https://vercel.com → Sign up (GitHub se)
2. "Add New Project" → Repository select karein
3. **Root Directory:** `career_intelligence_platform`
4. **Environment Variable:** `REACT_APP_API_BASE_URL` (pehle empty rakhein, baad mein update karengay)
5. Deploy! ✅

### Step 3: Backend + NLP Deploy (Render) - 10 Minutes
1. https://render.com → Sign up (GitHub se)
2. **Backend Service:**
   - New Web Service → Root: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Environment Variables: `.env` file se copy karein
3. **NLP Service:**
   - New Web Service → Root: `nlp_service`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Deploy! ✅

### Step 4: URLs Update Karein
1. Backend URL ko Frontend environment variable mein add karein
2. NLP URL ko Backend environment variable mein add karein
3. Redeploy! ✅

**Complete Guide:** `DEPLOYMENT_GUIDE.md` file mein detailed steps hain!

---

## 📋 Pre-Deployment Checklist

- [x] Test file fix kiya
- [x] Deployment configs add kiye
- [ ] Git commit kiya
- [ ] Vercel account bana
- [ ] Render account bana
- [ ] Services deploy kiye
- [ ] URLs update kiye
- [ ] Testing complete kiya

---

## 🆘 Help Chahiye?

Detailed guide: `DEPLOYMENT_GUIDE.md` file check karein!
