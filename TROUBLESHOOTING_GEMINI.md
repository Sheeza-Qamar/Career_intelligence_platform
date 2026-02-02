# 🔧 Gemini API Troubleshooting Guide

## Common Errors aur Solutions

### 1. **API Key Expired / Invalid Error**

**Error:** `API key expired` ya `API_KEY_INVALID`

**Solutions:**
```bash
# Step 1: .env file check karein
cd backend
cat .env  # Windows: type .env

# Step 2: API key verify karein
# Format: AIzaSy... (39 characters long)

# Step 3: Backend COMPLETELY restart karein
# Terminal mein:
Ctrl+C  # Stop karein
npm start  # Phir start karein
```

**Important:** 
- `.env` file update karne ke baad **ALWAYS** backend restart karein
- API key mein spaces nahi hone chahiye
- API key Google AI Studio se generate karein: https://aistudio.google.com/apikey

---

### 2. **Quota Exceeded Error (429)**

**Error:** `You exceeded your current quota`

**Solutions:**
1. **Check Quota:**
   - Visit: https://ai.google.dev/rate-limit
   - Check current usage

2. **New API Key:**
   - Google AI Studio mein naya key generate karein
   - `.env` file update karein
   - Backend restart karein

3. **Wait:**
   - Quota reset time wait karein (usually daily/monthly)

---

### 3. **Model Not Found Error (404)**

**Error:** `models/gemini-xxx is not found`

**Solutions:**
- Current stable models:
  - `gemini-1.5-flash` ✅ (Recommended - fast, cheap)
  - `gemini-1.5-pro` ✅ (More capable, slower)
  - `gemini-2.0-flash-exp` (Experimental)

**Update model name in:** `backend/utils/geminiRAG.js` line 28

---

### 4. **Backend Not Loading New API Key**

**Problem:** `.env` update kiya but purana key use ho raha hai

**Solution:**
```bash
# Step 1: Backend completely stop karein
Ctrl+C

# Step 2: Node process kill karein (agar zarurat ho)
# Windows:
taskkill /F /IM node.exe

# Step 3: Fresh start
cd backend
npm start

# Step 4: Console check karein
# Should see: "✅ Using GEMINI_API_KEY from environment"
# Ya: "⚠️ GEMINI_API_KEY not found in environment, using fallback key"
```

---

## ✅ Verification Steps

### 1. API Key Check:
```bash
cd backend
node -e "require('dotenv').config(); console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found (' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : 'NOT FOUND')"
```

### 2. Model Check:
- `backend/utils/geminiRAG.js` line 28 check karein
- Current: `gemini-1.5-flash` (stable)

### 3. Backend Logs:
```bash
# Backend start karte waqt ye messages aane chahiye:
🚀 Server listening on port 5000
✅ Using GEMINI_API_KEY from environment  # Ya warning message
```

---

## 🔄 Complete Reset Process

Agar sab kuch fail ho raha ho:

```bash
# 1. Backend stop
cd backend
Ctrl+C

# 2. .env file verify
# GEMINI_API_KEY=AIzaSy... (sahi key)

# 3. Clear node cache (optional)
rm -rf node_modules/.cache  # Windows: rmdir /s node_modules\.cache

# 4. Fresh start
npm start

# 5. Test
# Browser mein analysis run karein
# Console mein errors check karein
```

---

## 📝 Current Configuration

**File:** `backend/utils/geminiRAG.js`
- **Model:** `gemini-1.5-flash`
- **API Key Source:** `.env` file (fallback: hardcoded)

**File:** `backend/.env`
- `GEMINI_API_KEY=AIzaSyBHRUpqJmXTWD8ingi0OdnQVEz2RK-Oqd8`

---

## 🆘 Still Not Working?

1. **Check API Key Format:**
   - Should start with `AIzaSy`
   - Should be 39 characters
   - No spaces or quotes

2. **Check Google AI Studio:**
   - Visit: https://aistudio.google.com/apikey
   - Verify key is active
   - Check quota/billing

3. **Check Backend Logs:**
   - Terminal mein error messages dekhein
   - Full error message copy karein

4. **Test API Key Directly:**
```bash
# Simple test (replace YOUR_KEY)
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

**Need Help?** Error message share karein with full details! 🚀
