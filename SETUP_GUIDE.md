# 🚀 Career Intelligence Platform - Setup Guide

## Prerequisites (Pehle ye install karein)

1. **Node.js** (v16+ recommended)
   - Download: https://nodejs.org/
   - Check: `node --version`

2. **Python** (v3.8+)
   - Download: https://www.python.org/
   - Check: `python --version`

3. **MySQL Database**
   - Aiven cloud database already configured (check `.env` file)
   - Ya local MySQL install karein

---

## 📋 Step-by-Step Setup

### Step 1: Database Setup (Agar pehle se nahi hai)

Database already configured hai `.env` file mein. Agar fresh setup chahiye:

```sql
-- MySQL mein ye database create karein
CREATE DATABASE Resume_Analyzer;

-- Phir schema.sql run karein (backend/schema.sql)
-- Aur seed data: seed_job_roles.sql
```

---

### Step 2: Backend Setup

```bash
# Backend folder mein jao
cd backend

# Dependencies install karein
npm install

# Environment variables check karein (.env file already hai)
# Agar nahi hai to .env file banao:
# DB_HOST=your_host
# DB_USER=your_user
# DB_PASSWORD=your_password
# DB_NAME=Resume_Analyzer
# DB_PORT=22617
# PORT=5000
# JWT_SECRET=your-secret-key
# GEMINI_API_KEY=AIzaSyAcx1foXwmrUH_O5dWEKaCwzC54vm576N0

# Backend start karein
npm start
# Ya development mode mein:
npm run dev
```

**Backend port:** `http://localhost:5000`

---

### Step 3: NLP Service Setup (Python)

```bash
# NLP service folder mein jao
cd nlp_service

# Python virtual environment banao (optional but recommended)
python -m venv venv

# Virtual environment activate karein
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Dependencies install karein
pip install -r requirements.txt

# NLP service start karein
uvicorn main:app --reload --port 8000
```

**NLP Service port:** `http://localhost:8000`

---

### Step 4: Frontend Setup (React)

```bash
# Frontend folder mein jao
cd career_intelligence_platform

# Dependencies install karein
npm install

# Frontend start karein
npm start
```

**Frontend port:** `http://localhost:3000`

---

## 🎯 Complete Run Command (3 Terminals)

### Terminal 1 - Backend:
```bash
cd backend
npm install  # pehli baar
npm start
```

### Terminal 2 - NLP Service:
```bash
cd nlp_service
pip install -r requirements.txt  # pehli baar
uvicorn main:app --reload --port 8000
```

### Terminal 3 - Frontend:
```bash
cd career_intelligence_platform
npm install  # pehli baar
npm start
```

---

## ✅ Verification Checklist

1. ✅ **Backend running?** 
   - Check: `http://localhost:5000` (should show error or API response)
   - Check console: `🚀 Server listening on port 5000`

2. ✅ **NLP Service running?**
   - Check: `http://localhost:8000/health` (should return `{"status":"ok"}`)
   - Check: `http://localhost:8000/docs` (FastAPI docs)

3. ✅ **Frontend running?**
   - Check: `http://localhost:3000` (React app should open)
   - Browser automatically open hoga

4. ✅ **Database connected?**
   - Backend console mein error nahi aana chahiye
   - Database connection successful message

---

## 🔧 Troubleshooting

### Backend issues:
- **Port 5000 already in use?**
  - `.env` mein `PORT=5001` set karein
  - Ya process kill karein: `netstat -ano | findstr :5000`

- **Database connection error?**
  - `.env` file check karein
  - Database credentials verify karein
  - MySQL service running hai?

### NLP Service issues:
- **Port 8000 already in use?**
  - `uvicorn main:app --reload --port 8001` use karein
  - Backend `.env` mein `NLP_SERVICE_URL=http://localhost:8001` set karein

- **Python dependencies error?**
  - `pip install --upgrade pip`
  - `pip install -r requirements.txt --force-reinstall`

### Frontend issues:
- **Port 3000 already in use?**
  - React automatically next port use karega (3001, 3002, etc.)
  - Ya manually: `PORT=3001 npm start`

- **API calls failing?**
  - Backend running hai check karein
  - `career_intelligence_platform/package.json` mein `"proxy": "http://localhost:5000"` check karein

---

## 📝 Important Notes

1. **Gemini API Key:**
   - Already hardcoded hai `backend/utils/geminiRAG.js` mein
   - Ya `.env` mein `GEMINI_API_KEY` set karein

2. **File Uploads:**
   - Backend `uploads/` folder automatically create hoga
   - Agar permission error aaye to folder manually banao

3. **Database:**
   - Current setup: Aiven cloud MySQL
   - Local MySQL use karne ke liye `.env` update karein

---

## 🎉 Success!

Agar sab kuch sahi se run ho raha hai:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/...`
- NLP Service: `http://localhost:8000/...`

**Test karein:**
1. Frontend open karein
2. Signup/Login karein
3. Resume upload karein
4. Job role select karein
5. Analysis run karein

---

## 📞 Quick Commands Reference

```bash
# Backend
cd backend && npm start

# NLP Service  
cd nlp_service && uvicorn main:app --reload --port 8000

# Frontend
cd career_intelligence_platform && npm start

# Database (agar local)
mysql -u root -p
USE Resume_Analyzer;
```

---

**Happy Coding! 🚀**
