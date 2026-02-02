const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load API key from environment or use fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBHRUpqJmXTWD8ingi0OdnQVEz2RK-Oqd8';

// Debug: Log which API key is being used (first 10 chars only for security)
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment, using fallback key');
} else {
  console.log('✅ Using GEMINI_API_KEY from environment');
}

/**
 * RAG-based analysis using Gemini AI
 * @param {string} resumeText - Extracted text from resume
 * @param {Array<{name: string, importance: number, required_level: string}>} jobRoleSkills - Job role skills with metadata
 * @param {string} jobRoleTitle - Title of the job role
 * @returns {Promise<{match_score: number, matched_skills: string[], missing_skills: string[], weak_skills: string[], roadmap: Array}>}
 */
async function analyzeWithGeminiRAG(resumeText, jobRoleSkills, jobRoleTitle) {
  // Verify API key is present
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
    throw new Error('Invalid or missing Gemini API key');
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Try multiple models in order of preference (if quota issues)
  const modelNames = [
    'gemini-3-flash-preview',  // User requested
    'gemini-1.5-flash',         // Fallback 1
    'gemini-1.5-pro'            // Fallback 2
  ];

  let lastError = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`🔄 Trying model: ${modelName}`);
      
      return await performAnalysis(model, resumeText, jobRoleSkills, jobRoleTitle);
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Model ${modelName} failed:`, error.message);
      
      // If quota error, don't try other models (same quota)
      if (error.message && error.message.includes('quota')) {
        break;
      }
      
      // If model not found, try next model
      if (error.message && error.message.includes('not found')) {
        continue;
      }
      
      // For other errors, break and throw
      break;
    }
  }
  
  // If all models failed, throw the last error
  throw lastError || new Error('All Gemini models failed');
}

async function performAnalysis(model, resumeText, jobRoleSkills, jobRoleTitle) {
  try {

    // Format job role skills with importance and required level
    const skillsContext = jobRoleSkills.map((skill, idx) => {
      const importanceText = skill.importance >= 4 ? 'Critical' : skill.importance >= 3 ? 'Important' : 'Nice to have';
      return `${idx + 1}. ${skill.name} (${importanceText}, Required Level: ${skill.required_level || 'intermediate'})`;
    }).join('\n');

    const prompt = `You are an expert career advisor and resume analyzer. Analyze the following resume against the job role requirements and provide a detailed assessment.

**Job Role:** ${jobRoleTitle}

**Required Skills for this Role:**
${skillsContext}

**Resume Text:**
${resumeText.substring(0, 8000)}${resumeText.length > 8000 ? '\n[... truncated for length]' : ''}

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

Provide ONLY valid JSON, no additional text or explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1].trim();
    } else if (jsonText.includes('```')) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1].trim();
    }
    
    // Try to extract JSON object if wrapped in text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', jsonText.substring(0, 500));
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
    }

    // Validate and normalize response
    const matchScore = Math.max(0, Math.min(100, parseFloat(analysis.match_score) || 0));
    const matchedSkills = Array.isArray(analysis.matched_skills) ? analysis.matched_skills : [];
    const missingSkills = Array.isArray(analysis.missing_skills) ? analysis.missing_skills : [];
    const weakSkills = Array.isArray(analysis.weak_skills) ? analysis.weak_skills : [];
    
    // Normalize roadmap format
    const roadmap = Array.isArray(analysis.roadmap) ? analysis.roadmap.map(item => {
      if (typeof item === 'string') {
        return { skill: item, steps: [], resources: [] };
      }
      return {
        skill: item.skill || item.name || '',
        steps: Array.isArray(item.steps) ? item.steps : [],
        resources: Array.isArray(item.resources) ? item.resources : []
      };
    }) : [];

    return {
      match_score: Math.round(matchScore * 10) / 10, // Round to 1 decimal
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      weak_skills: weakSkills,
      roadmap: roadmap
    };
  } catch (error) {
    console.error('Gemini RAG analysis error:', error.message || error);
    
    // Provide more helpful error messages
    if (error.message && error.message.includes('API key')) {
      throw new Error(`Gemini API key issue: ${error.message}. Please check your API key in .env file or contact support.`);
    } else if (error.message && error.message.includes('quota')) {
      throw new Error(`Gemini API quota exceeded: ${error.message}. Please check your billing/quota at https://ai.google.dev/`);
    } else if (error.message && error.message.includes('model')) {
      throw new Error(`Gemini model not available: ${error.message}. Trying to use gemini-1.5-flash.`);
    }
    
    throw new Error(`Gemini RAG analysis failed: ${error.message || 'Unknown error'}`);
  }
}

module.exports = { analyzeWithGeminiRAG };
