const { GoogleGenerativeAI } = require('@google/generative-ai');
const { chunkResume } = require('./resumeChunker');
const { generateEmbedding, generateEmbeddingsBatch, findSimilarChunks } = require('./vectorSearch');

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
    // ============================================
    // PROPER RAG IMPLEMENTATION
    // ============================================
    
    // STEP 1: CHUNK the resume into meaningful sections
    console.log('📄 Chunking resume...');
    const resumeChunks = chunkResume(resumeText);
    console.log(`✅ Created ${resumeChunks.length} chunks from resume`);
    
    // STEP 2: GENERATE EMBEDDINGS for chunks
    console.log('🔢 Generating embeddings for chunks...');
    const chunkTexts = resumeChunks.map(chunk => chunk.text);
    const chunkEmbeddings = await generateEmbeddingsBatch(chunkTexts);
    
    // Attach embeddings to chunks
    const chunksWithEmbeddings = resumeChunks.map((chunk, idx) => ({
      ...chunk,
      embedding: chunkEmbeddings[idx]
    }));
    
    // STEP 3: CREATE QUERY and generate query embedding
    const skillsList = jobRoleSkills.map(skill => {
      const importanceText = skill.importance >= 4 ? 'Critical' : skill.importance >= 3 ? 'Important' : 'Nice to have';
      return `${skill.name} (${importanceText}, Level: ${skill.required_level || 'intermediate'})`;
    }).join(', ');
    
    const query = `Job role: ${jobRoleTitle}. Required skills: ${skillsList}. Find relevant resume sections that match these skills.`;
    console.log('🔍 Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    
    // STEP 4: RETRIEVE similar chunks (semantic search)
    console.log('🔎 Finding similar chunks...');
    // Increase topK to get more context, but prioritize high similarity
    const topK = Math.min(8, chunksWithEmbeddings.length); // Get top 8 most relevant chunks for better context
    const relevantChunks = findSimilarChunks(queryEmbedding, chunksWithEmbeddings, topK);
    console.log(`✅ Retrieved ${relevantChunks.length} relevant chunks with similarity scores:`, 
      relevantChunks.map(c => `${c.chunk.type}:${(c.similarity * 100).toFixed(1)}%`).join(', '));
    
    // STEP 5: AUGMENT prompt with retrieved chunks
    const retrievedContext = relevantChunks
      .map((item, idx) => {
        const chunk = item.chunk;
        return `[${chunk.type.toUpperCase()} Section - Relevance: ${(item.similarity * 100).toFixed(1)}%]:\n${chunk.text}`;
      })
      .join('\n\n---\n\n');
    
    // Format job role skills with importance and required level
    const skillsContext = jobRoleSkills.map((skill, idx) => {
      const importanceText = skill.importance >= 4 ? 'Critical' : skill.importance >= 3 ? 'Important' : 'Nice to have';
      return `${idx + 1}. ${skill.name} (${importanceText}, Required Level: ${skill.required_level || 'intermediate'})`;
    }).join('\n');

    const prompt = `You are an expert career advisor and resume analyzer with deep knowledge of industry requirements. Analyze the following resume sections (retrieved using semantic search) against the job role requirements and provide a detailed, accurate assessment.

**Job Role:** ${jobRoleTitle}

**Required Skills for this Role (from Database):**
${skillsContext}

**Relevant Resume Sections (Retrieved via RAG - Most Relevant Parts):**
${retrievedContext}

**Complete Resume Text (for full context):**
${resumeText.substring(0, 12000)}${resumeText.length > 12000 ? '\n[... truncated for length]' : ''}

**CRITICAL ANALYSIS INSTRUCTIONS:**

1. **Appreciated Core Skills (appreciated_core_skills):**
   - List skills that are:
     * Present in the resume with clear evidence
     * User has actual experience/projects/work with them
     * Core/Technical skills required for ${jobRoleTitle} role
     * Directly relevant and important for the job
   - Example for Full Stack Developer: React, Node.js, JavaScript, MongoDB, Express.js, PostgreSQL, REST APIs, Git, TypeScript, SQL
   - These are skills that user ALREADY HAS and are APPRECIATED for this role
   - DO NOT include skills that are just mentioned without experience

2. **Missing Core Skills (missing_core_skills):**
   - List skills that are:
     * CRITICAL or VERY IMPORTANT for ${jobRoleTitle} role
     * Required based on database skills list AND industry standards
     * NOT found in the resume at all
     * Without these skills, user cannot effectively perform the job
   - Focus on core technical skills that are essential
   - Example for Full Stack Developer: If missing - System Design, Algorithms, Database Design, API Design, Authentication/Security
   - These are MUST-HAVE skills that are missing

3. **Other Skills (other_skills):**
   - List skills that are:
     * Nice-to-have but NOT critical
     * Their presence or absence doesn't make a huge difference
     * NOT present in resume
     * Complementary or optional skills
   - Example: Docker, AWS, CI/CD, Testing frameworks (if not core), Design tools (if not required)
   - These are skills that would be good to have but not essential

4. **Match Score Calculation:**
   - Base on: Appreciated core skills vs Required core skills
   - Weight: Critical skills (importance 4-5) = 50%, Important skills (importance 3) = 35%, Other skills = 15%
   - Formula: (Appreciated Core Skills / Total Required Core Skills) * 100
   - Be realistic: 70-90% = Good match, 50-70% = Moderate, <50% = Needs improvement

5. **Learning Roadmap (ONLY for Missing Core Skills):**
   - Create roadmap for EACH missing core skill
   - Provide specific, actionable learning steps
   - Include REAL, VERIFIED, and CURRENT YouTube resources with working video URLs
   - **CRITICAL for YouTube links:**
     * ONLY provide YouTube links that you KNOW exist and are currently available
     * Use popular, well-known channels (freeCodeCamp, Traversy Media, The Net Ninja, Academind, etc.)
     * Use full YouTube URLs: https://www.youtube.com/watch?v=VIDEO_ID
     * DO NOT make up or guess YouTube video IDs
     * If unsure about a specific video, use official documentation or course platforms instead
   - For YouTube videos: Extract video ID and create thumbnail URL: https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg
   - Include: Course names, tutorial links, official documentation
   - Suggest practical project ideas with descriptions and difficulty levels
   - Focus on learning that leads to real experience

**IMPORTANT - For ${jobRoleTitle} Role:**
- Understand what Full Stack Developer actually needs:
  * Frontend: React/Vue/Angular, HTML/CSS, JavaScript/TypeScript
  * Backend: Node.js/Python/Java, REST APIs, Database (MongoDB/PostgreSQL/MySQL)
  * DevOps: Git, Docker, Deployment
  * Tools: Express.js, Nest.js, etc.
- DO NOT mark essential Full Stack technologies as "weak" if they're mentioned in resume
- Only mark as weak if: No experience shown, OR completely unrelated to Full Stack

**Response Format (JSON only, no markdown):**
{
  "match_score": <number 0-100>,
  "appreciated_core_skills": ["skill1", "skill2", ...],
  "missing_core_skills": ["skill3", "skill4", ...],
  "other_skills": ["skill5", ...],
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
          "url": "https://www.youtube.com/watch?v=VIDEO_ID (MUST be a real, working YouTube video URL)",
          "type": "youtube|course|tutorial|documentation",
          "thumbnail": "https://img.youtube.com/vi/VIDEO_ID/mqdefault.jpg (will be auto-generated)"
        }
      ],
      "project_ideas": [
        {
          "title": "Project Title",
          "description": "Project description and what you'll learn",
          "difficulty": "beginner|intermediate|advanced"
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
    
    // Handle new 3-section format
    const appreciatedSkills = Array.isArray(analysis.appreciated_core_skills) 
      ? analysis.appreciated_core_skills 
      : Array.isArray(analysis['core_skills present']) 
        ? analysis['core_skills present'] 
        : Array.isArray(analysis.matched_skills) 
          ? analysis.matched_skills 
          : [];
    
    const missingSkills = Array.isArray(analysis.missing_core_skills) 
      ? analysis.missing_core_skills 
      : Array.isArray(analysis.missing_skills) 
        ? analysis.missing_skills 
        : [];
    
    const otherSkills = Array.isArray(analysis.other_skills) 
      ? analysis.other_skills 
      : Array.isArray(analysis.good_to_have_skills) 
        ? analysis.good_to_have_skills 
        : [];
    
    // Normalize roadmap format with YouTube thumbnails
    const roadmap = Array.isArray(analysis.roadmap) ? analysis.roadmap.map(item => {
      if (typeof item === 'string') {
        return { skill: item, steps: [], resources: [], project_ideas: [] };
      }
      
      // Process resources and add YouTube thumbnails
      const resources = Array.isArray(item.resources) ? item.resources.map(resource => {
        const resourceObj = typeof resource === 'string' 
          ? { title: resource, url: '', type: 'tutorial' }
          : resource;
        
        // Extract YouTube video ID and create thumbnail URL
        let thumbnail = resourceObj.thumbnail || '';
        if (resourceObj.url) {
          // Handle different YouTube URL formats
          let videoId = null;
          
          // Format 1: https://www.youtube.com/watch?v=VIDEO_ID
          const watchMatch = resourceObj.url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
          if (watchMatch && watchMatch[1]) {
            videoId = watchMatch[1];
          }
          
          // Format 2: https://youtu.be/VIDEO_ID
          if (!videoId) {
            const shortMatch = resourceObj.url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
            if (shortMatch && shortMatch[1]) {
              videoId = shortMatch[1];
            }
          }
          
          // Format 3: https://www.youtube.com/embed/VIDEO_ID
          if (!videoId) {
            const embedMatch = resourceObj.url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
            if (embedMatch && embedMatch[1]) {
              videoId = embedMatch[1];
            }
          }
          
          if (videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          }
        }
        
        return {
          title: resourceObj.title || 'Resource',
          url: resourceObj.url || '',
          type: resourceObj.type || 'tutorial',
          thumbnail: thumbnail
        };
      }) : [];
      
      // Process project ideas
      const projectIdeas = Array.isArray(item.project_ideas) ? item.project_ideas.map(project => {
        if (typeof project === 'string') {
          return { title: project, description: '', difficulty: 'intermediate' };
        }
        return {
          title: project.title || project,
          description: project.description || '',
          difficulty: project.difficulty || 'intermediate'
        };
      }) : [];
      
      return {
        skill: item.skill || item.name || '',
        steps: Array.isArray(item.steps) ? item.steps : [],
        resources: resources,
        project_ideas: projectIdeas
      };
    }) : [];

    return {
      match_score: Math.round(matchScore * 10) / 10, // Round to 1 decimal
      appreciated_core_skills: appreciatedSkills,
      missing_core_skills: missingSkills,
      other_skills: otherSkills,
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
