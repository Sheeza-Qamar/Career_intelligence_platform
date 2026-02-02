# 🎯 Career Intelligence Platform - Complete System Explanation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Complete User Flow](#complete-user-flow)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [RAG + Gemini Integration](#rag--gemini-integration)
7. [Database Structure](#database-structure)
8. [API Endpoints](#api-endpoints)
9. [Key Features](#key-features)

---

## 🎯 System Overview

**Career Intelligence Platform** ek **Smart Resume Analyzer** hai jo:
- Users ki resume ko analyze karta hai
- Job roles ke against match score calculate karta hai
- Missing skills identify karta hai
- Learning roadmap provide karta hai
- **RAG (Retrieval Augmented Generation)** + **Gemini AI** use karta hai intelligent analysis ke liye

---

## 🏗️ Architecture

### **3-Tier Architecture:**

```
┌─────────────────┐
│   Frontend      │  React App (Port 3000)
│   (React)       │
└────────┬────────┘
         │ HTTP/REST API
         │
┌────────▼────────┐
│   Backend       │  Node.js/Express (Port 5000)
│   (API Server)  │
└────┬───────┬───┘
     │       │
     │       └─────────────┐
     │                     │
┌────▼────┐         ┌─────▼─────┐
│  MySQL  │         │   NLP      │
│ Database│         │  Service   │
│         │         │  (Python)  │
│         │         │  Port 8000 │
└─────────┘         └────────────┘
```

### **Components:**

1. **Frontend (React)** - User interface
2. **Backend (Node.js/Express)** - API server, business logic
3. **Database (MySQL)** - Data storage
4. **NLP Service (Python/FastAPI)** - PDF text extraction
5. **Gemini AI** - RAG-based analysis

---

## 👤 Complete User Flow

### **Step 1: Authentication**
```
User → /signup or /login
     → Backend validates credentials
     → JWT token generated
     → Token stored in localStorage
     → User redirected to Home/Upload
```

### **Step 2: Resume Upload**
```
User → /upload
     → Selects PDF file
     → Frontend sends file to Backend
     → Backend saves file to /uploads folder
     → Backend calls NLP Service: POST /extract-text
     → NLP Service extracts text from PDF
     → Text saved in database (resumes table)
     → Resume ID returned to Frontend
     → "Next" button appears
```

### **Step 3: Job Role Selection**
```
User → Clicks "Next" button
     → Navigates to /analyze
     → Frontend fetches job roles: GET /api/job-roles
     → User selects job role from dropdown
     → Clicks "Check Your Job Readiness"
```

### **Step 4: Analysis (RAG + Gemini)**
```
Frontend → POST /api/analyses
         → { resume_id, job_role_id, user_id }

Backend:
  1. Fetches resume text from database
  2. Fetches job role skills (with importance & required_level)
  3. Calls Gemini RAG Service:
     - Sends: Resume text + Job role skills + Job role title
     - Gemini analyzes using RAG
     - Returns: Match score, matched/missing/weak skills, roadmap
  
  4. Saves analysis to database:
     - analyses table (match_score, method='gemini_rag')
     - analysis_skill_gaps table (missing/weak skills)
     - roadmap_items table (learning steps)
     - learning_resources table (resources from Gemini)
  
  5. Returns analysis_id to Frontend

Frontend → Navigates to /analysis/:id
```

### **Step 5: View Results**
```
User → /analysis/:id
     → Frontend fetches: GET /api/analyses/:id
     → Displays:
       - Match percentage (circular chart)
       - Missing skills list
       - Weak skills list
       - Learning roadmap (with resources)
     → User can select different job role and re-analyze
```

---

## 🔧 Backend Architecture

### **File Structure:**
```
backend/
├── server.js              # Entry point
├── src/
│   └── app.js            # Express app setup
├── controllers/          # Business logic
│   ├── authController.js  # Signup/Login
│   ├── resumeController.js # Upload/Get resume
│   ├── jobRoleController.js # Get job roles
│   └── analysisController.js # Analysis logic
├── routes/               # API routes
│   ├── authRoutes.js
│   ├── resumeRoutes.js
│   ├── jobRoleRoutes.js
│   └── analysisRoutes.js
├── middleware/
│   └── authMiddleware.js # JWT verification
├── utils/
│   ├── geminiRAG.js      # RAG + Gemini integration
│   └── resumeParser.js   # Resume text parsing
└── db.js                 # Database connection
```

### **Key Backend Functions:**

#### **1. Resume Upload (`resumeController.js`)**
- Receives PDF file
- Saves to `/uploads` folder
- Calls NLP service for text extraction
- Stores extracted text in database

#### **2. Analysis (`analysisController.js`)**
- **`runAnalysis()`**: Main analysis function
  - Gets resume text from DB
  - Gets job role skills from DB (with importance)
  - Calls `analyzeWithGeminiRAG()`
  - Saves results to database
  - Returns analysis_id

- **`getAnalysis()`**: Fetches analysis results
  - Gets analysis data
  - Gets skill gaps
  - Gets roadmap items
  - Returns complete analysis

#### **3. Gemini RAG (`utils/geminiRAG.js`)**
- **`analyzeWithGeminiRAG()`**: 
  - Formats prompt with resume text + job skills
  - Calls Gemini API
  - Parses JSON response
  - Returns structured analysis

---

## 🎨 Frontend Architecture

### **File Structure:**
```
career_intelligence_platform/src/
├── App.js                 # Router setup
├── components/
│   ├── HomePage.js       # Landing page
│   ├── LoginPage.js      # Login form
│   ├── SignupPage.js    # Signup form
│   ├── Navbar.js         # Navigation bar
│   ├── UploadResumePage.js # Resume upload
│   ├── AnalyzePage.js    # Job role selection
│   └── AnalysisResultPage.js # Results display
└── config.js             # API base URL
```

### **Key Frontend Components:**

#### **1. UploadResumePage (`/upload`)**
- File upload form
- Shows existing resume (if logged in)
- Calls: `POST /api/resumes/upload`
- Shows success/error messages
- "Next" button to proceed

#### **2. AnalyzePage (`/analyze`)**
- Job role selector (type-ahead)
- Shows resume filename
- Calls: `POST /api/analyses`
- Redirects to results page

#### **3. AnalysisResultPage (`/analysis/:id`)**
- Fetches analysis: `GET /api/analyses/:id`
- Displays:
  - Match score (circular chart)
  - Missing skills
  - Weak skills
  - Learning roadmap
- Job role selector for re-analysis
- "Analyze" button for new analysis

---

## 🤖 RAG + Gemini Integration

### **What is RAG?**
**RAG (Retrieval Augmented Generation)** = Database data + AI knowledge

### **How It Works:**

```
┌─────────────────────────────────────────┐
│  1. RETRIEVE (Database)                 │
│     - Resume text (from resumes table)  │
│     - Job role skills (from DB)         │
│     - Skill importance & required_level │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. AUGMENT (Format Prompt)             │
│     - Combine resume + skills           │
│     - Add context & instructions        │
│     - Create structured prompt          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. GENERATE (Gemini AI)                │
│     - Send prompt to Gemini              │
│     - Gemini uses:                      │
│       • Its own knowledge               │
│       • Provided resume data            │
│       • Provided job skills             │
│     - Returns JSON analysis             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. SAVE (Database)                     │
│     - Analysis results                  │
│     - Skill gaps                        │
│     - Roadmap items                     │
│     - Learning resources                │
└─────────────────────────────────────────┘
```

### **Gemini Prompt Structure:**
```
1. Job Role Title
2. Required Skills List (with importance & level)
3. Resume Text (truncated to 8000 chars)
4. Instructions:
   - Analyze match
   - Identify matched/missing/weak skills
   - Calculate match percentage
   - Create learning roadmap
5. Response Format: JSON
```

### **Gemini Response:**
```json
{
  "match_score": 76.9,
  "matched_skills": ["React", "Node.js", "JavaScript"],
  "missing_skills": ["Algorithms", "Databases"],
  "weak_skills": ["Problem Solving"],
  "roadmap": [
    {
      "skill": "Algorithms",
      "steps": ["Step 1: ...", "Step 2: ..."],
      "resources": [
        {
          "title": "Course Name",
          "url": "https://...",
          "type": "course"
        }
      ]
    }
  ]
}
```

---

## 🗄️ Database Structure

### **Main Tables:**

#### **1. `users`**
- User accounts (id, name, email, password_hash)

#### **2. `resumes`**
- Uploaded resumes
- Fields: id, user_id, original_filename, file_url, **extracted_text**, parsed_success

#### **3. `job_roles`**
- Available job roles
- Fields: id, title, description

#### **4. `skills`**
- All skills in system
- Fields: id, name, category

#### **5. `job_role_skills`**
- Skills required for each job role
- Fields: job_role_id, skill_id, **importance**, **required_level**

#### **6. `analyses`**
- Analysis results
- Fields: id, user_id, resume_id, job_role_id, **match_score**, **method** ('gemini_rag')

#### **7. `analysis_skill_gaps`**
- Missing/weak skills identified
- Fields: analysis_id, skill_id, gap_type ('missing'/'weak'), required_level

#### **8. `roadmap_items`**
- Learning roadmap steps
- Fields: analysis_id, skill_id, step_order, status, note

#### **9. `learning_resources`**
- Resources from Gemini
- Fields: skill_id, title, url, provider, difficulty

---

## 🔌 API Endpoints

### **Authentication:**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/me` - Get current user (protected)

### **Resumes:**
- `POST /api/resumes/upload` - Upload PDF resume
- `GET /api/resumes/me` - Get user's resume (protected)

### **Job Roles:**
- `GET /api/job-roles` - Get all job roles

### **Analysis:**
- `POST /api/analyses` - Run analysis
  - Body: `{ resume_id, job_role_id, user_id? }`
  - Returns: `{ analysis_id, match_score, ... }`
  
- `GET /api/analyses/:id` - Get analysis results
  - Returns: Complete analysis with gaps, roadmap, etc.

---

## ✨ Key Features

### **1. Smart Resume Analysis**
- Uses Gemini AI for intelligent matching
- Considers skill importance
- Identifies missing vs weak skills

### **2. RAG-Based Analysis**
- Combines database data with AI knowledge
- More accurate than simple keyword matching
- Context-aware analysis

### **3. Learning Roadmap**
- Step-by-step learning paths
- Specific resources (courses, tutorials)
- Generated by Gemini AI

### **4. Re-Analysis**
- Change job role on results page
- Re-analyze without re-uploading
- Compare different roles

### **5. User Management**
- Signup/Login with JWT
- One resume per user
- Analysis history

---

## 🔄 Complete Flow Diagram

```
User Journey:
┌─────────┐
│ Signup  │ → JWT Token
└────┬────┘
     │
     ▼
┌─────────┐
│ Upload  │ → PDF → NLP Extract → Text Saved
│ Resume  │
└────┬────┘
     │
     ▼
┌─────────┐
│ Select  │ → Job Role Selected
│ Job Role│
└────┬────┘
     │
     ▼
┌─────────┐
│Analyze  │ → RAG + Gemini → Analysis Saved
└────┬────┘
     │
     ▼
┌─────────┐
│ Results │ → Match Score, Gaps, Roadmap
└─────────┘
```

---

## 🎯 Summary

**Your system:**
1. ✅ Users upload resumes (PDF → Text extraction)
2. ✅ Users select job roles
3. ✅ **RAG + Gemini AI** analyzes resume vs job requirements
4. ✅ Shows match percentage, skill gaps, learning roadmap
5. ✅ Users can re-analyze for different roles
6. ✅ All data stored in MySQL database
7. ✅ JWT-based authentication
8. ✅ Clean separation: Frontend (React) ↔ Backend (Node.js) ↔ Database (MySQL) ↔ AI (Gemini)

**Technology Stack:**
- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express, MySQL
- **AI:** Google Gemini (RAG)
- **NLP:** Python FastAPI (Text extraction)
- **Auth:** JWT (JSON Web Tokens)

---

**System ab production-ready hai! 🚀**
