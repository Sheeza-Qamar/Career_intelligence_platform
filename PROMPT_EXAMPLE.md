# 📝 Gemini RAG Prompt - Complete Example

## 🔍 Actual Prompt Structure

Yeh exact prompt hai jo Gemini AI ko bheja ja raha hai:

---

## 📋 Prompt Template

```
You are an expert career advisor and resume analyzer. Analyze the following resume against the job role requirements and provide a detailed assessment.

**Job Role:** [JOB_ROLE_TITLE]

**Required Skills for this Role:**
[SKILLS_LIST_WITH_IMPORTANCE]

**Resume Text:**
[RESUME_TEXT - max 8000 chars]

**Your Task:**
Analyze the resume and provide a comprehensive assessment. Consider:
1. Which required skills are clearly present in the resume (matched_skills)
2. Which critical/important skills are missing (missing_skills)
3. Which skills are mentioned but seem weak or need improvement (weak_skills)
4. Calculate an accurate match percentage (match_score) based on skill presence and quality
5. Create a learning roadmap with actionable steps and resources for missing/weak skills

**Important Guidelines:**
- Be precise: Only mark skills as "matched" if there's clear evidence in the resume
- Consider skill importance: Critical skills (importance 4-5) should weigh more in match score
- For weak skills: Include skills that are mentioned but lack depth or experience
- Match score should be realistic: 0-100% based on how well the resume matches requirements
- For roadmap: Provide practical, step-by-step learning paths with specific resources (courses, tutorials, projects)

**Response Format (JSON only, no markdown):**
{
  "match_score": <number 0-100>,
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill3", "skill4", ...],
  "weak_skills": ["skill5", ...],
  "roadmap": [
    {
      "skill": "skill_name",
      "steps": [
        "Step 1: Description",
        "Step 2: Description",
        ...
      ],
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com/resource",
          "type": "course|tutorial|project|documentation"
        }
      ]
    }
  ]
}

Provide ONLY valid JSON, no additional text or explanation.
```

---

## 💡 Real Example (With Actual Data)

### **Example Input:**

**Job Role:** Full Stack Developer

**Required Skills:**
```
1. React (Critical, Required Level: advanced)
2. Node.js (Important, Required Level: intermediate)
3. JavaScript (Critical, Required Level: advanced)
4. MongoDB (Important, Required Level: intermediate)
5. TypeScript (Nice to have, Required Level: basic)
6. AWS (Nice to have, Required Level: basic)
```

**Resume Text:**
```
John Doe
Email: john@example.com
Phone: 123-456-7890

PROFESSIONAL SUMMARY
Experienced software developer with 3 years of experience in web development.
Proficient in React, JavaScript, and Node.js. Strong problem-solving skills.

SKILLS
- React
- JavaScript
- Node.js
- HTML/CSS
- Git

EXPERIENCE
Software Developer | ABC Company | 2021-2024
- Developed web applications using React and Node.js
- Built RESTful APIs
- Collaborated with team on various projects

EDUCATION
BS Computer Science | XYZ University | 2021
```

### **Complete Prompt Sent to Gemini:**

```
You are an expert career advisor and resume analyzer. Analyze the following resume against the job role requirements and provide a detailed assessment.

**Job Role:** Full Stack Developer

**Required Skills for this Role:**
1. React (Critical, Required Level: advanced)
2. Node.js (Important, Required Level: intermediate)
3. JavaScript (Critical, Required Level: advanced)
4. MongoDB (Important, Required Level: intermediate)
5. TypeScript (Nice to have, Required Level: basic)
6. AWS (Nice to have, Required Level: basic)

**Resume Text:**
John Doe
Email: john@example.com
Phone: 123-456-7890

PROFESSIONAL SUMMARY
Experienced software developer with 3 years of experience in web development.
Proficient in React, JavaScript, and Node.js. Strong problem-solving skills.

SKILLS
- React
- JavaScript
- Node.js
- HTML/CSS
- Git

EXPERIENCE
Software Developer | ABC Company | 2021-2024
- Developed web applications using React and Node.js
- Built RESTful APIs
- Collaborated with team on various projects

EDUCATION
BS Computer Science | XYZ University | 2021

**Your Task:**
Analyze the resume and provide a comprehensive assessment. Consider:
1. Which required skills are clearly present in the resume (matched_skills)
2. Which critical/important skills are missing (missing_skills)
3. Which skills are mentioned but seem weak or need improvement (weak_skills)
4. Calculate an accurate match percentage (match_score) based on skill presence and quality
5. Create a learning roadmap with actionable steps and resources for missing/weak skills

**Important Guidelines:**
- Be precise: Only mark skills as "matched" if there's clear evidence in the resume
- Consider skill importance: Critical skills (importance 4-5) should weigh more in match score
- For weak skills: Include skills that are mentioned but lack depth or experience
- Match score should be realistic: 0-100% based on how well the resume matches requirements
- For roadmap: Provide practical, step-by-step learning paths with specific resources (courses, tutorials, projects)

**Response Format (JSON only, no markdown):**
{
  "match_score": <number 0-100>,
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill3", "skill4", ...],
  "weak_skills": ["skill5", ...],
  "roadmap": [
    {
      "skill": "skill_name",
      "steps": [
        "Step 1: Description",
        "Step 2: Description",
        ...
      ],
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com/resource",
          "type": "course|tutorial|project|documentation"
        }
      ]
    }
  ]
}

Provide ONLY valid JSON, no additional text or explanation.
```

---

## 📊 Expected Gemini Response

```json
{
  "match_score": 66.7,
  "matched_skills": ["React", "JavaScript", "Node.js"],
  "missing_skills": ["MongoDB"],
  "weak_skills": [],
  "roadmap": [
    {
      "skill": "MongoDB",
      "steps": [
        "Step 1: Learn MongoDB basics and NoSQL concepts",
        "Step 2: Practice CRUD operations",
        "Step 3: Build a project using MongoDB with Node.js"
      ],
      "resources": [
        {
          "title": "MongoDB University - M001",
          "url": "https://university.mongodb.com/courses/M001/about",
          "type": "course"
        },
        {
          "title": "MongoDB Node.js Driver Documentation",
          "url": "https://docs.mongodb.com/drivers/node/",
          "type": "documentation"
        }
      ]
    }
  ]
}
```

---

## 🔧 Code Location

**File:** `backend/utils/geminiRAG.js`
**Function:** `performAnalysis()`
**Lines:** 75-125

---

## 📝 Key Points

1. **Role Definition:** Gemini ko expert career advisor role diya
2. **Structured Data:** Job role + Skills + Resume text clearly separated
3. **Clear Instructions:** 5 specific tasks defined
4. **Guidelines:** Importance weighting, precision requirements
5. **Format:** Strict JSON format request
6. **Context:** Resume text (max 8000 chars) + Skills with importance

---

## 💡 Prompt Engineering Best Practices Used

✅ **Clear Role Definition** - "expert career advisor"  
✅ **Structured Input** - Sections clearly marked  
✅ **Specific Tasks** - Numbered list of what to do  
✅ **Guidelines** - How to handle edge cases  
✅ **Output Format** - Exact JSON structure  
✅ **Context Provided** - Resume + Job requirements  

---

**Yeh exact prompt hai jo Gemini ko bhej rahe hain!** 🚀
