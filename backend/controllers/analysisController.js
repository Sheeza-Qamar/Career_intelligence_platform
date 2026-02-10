const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const db = require('../db');
const { analyzeWithGeminiRAG } = require('../utils/geminiRAG');

const connection = db.promise();

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

async function getSkillsForJobRole(jobRoleId) {
  const [rows] = await connection.query(
    `SELECT s.name, jrs.importance, jrs.required_level 
     FROM skills s
     INNER JOIN job_role_skills jrs ON s.id = jrs.skill_id
     WHERE jrs.job_role_id = ?
     ORDER BY jrs.importance DESC, s.name`,
    [jobRoleId]
  );
  return rows.map((r) => ({
    name: r.name,
    importance: r.importance || 3,
    required_level: r.required_level || 'intermediate'
  }));
}

async function ensureSkillId(skillName) {
  const [existing] = await connection.query('SELECT id FROM skills WHERE name = ?', [skillName]);
  if (existing.length > 0) return existing[0].id;
  const [insert] = await connection.query('INSERT INTO skills (name) VALUES (?)', [skillName]);
  return insert.insertId;
}

/**
 * POST /api/analyses
 * Body: { resume_id, job_role_id }, optional user_id from auth
 */
exports.runAnalysis = async (req, res) => {
  try {
    const { resume_id, job_role_id } = req.body;
    const user_id = req.body.user_id ? parseInt(req.body.user_id, 10) : null;

    if (!resume_id || !job_role_id) {
      return res.status(400).json({ message: 'resume_id and job_role_id are required.' });
    }

    const [resumes] = await connection.query(
      'SELECT id, extracted_text FROM resumes WHERE id = ?',
      [resume_id]
    );
    if (resumes.length === 0) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    const [roles] = await connection.query('SELECT id, title FROM job_roles WHERE id = ?', [job_role_id]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Job role not found.' });
    }

    const resumeText = resumes[0].extracted_text || '';
    const jobRoleSkills = await getSkillsForJobRole(job_role_id);
    const jobRoleTitle = roles[0].title || 'Unknown Role';

    let matchScore = 0;
    let matchedSkills = [];
    let missingSkills = [];
    let weakSkills = [];
    let roadmap = [];

    if (jobRoleSkills.length > 0 && resumeText.trim()) {
      try {
        // Use Gemini RAG for analysis
        const analysisResult = await analyzeWithGeminiRAG(resumeText, jobRoleSkills, jobRoleTitle);
        matchScore = analysisResult.match_score ?? 0;
        // Handle new 3-section format
        matchedSkills = analysisResult.appreciated_core_skills ?? analysisResult.matched_skills ?? [];
        missingSkills = analysisResult.missing_core_skills ?? analysisResult.missing_skills ?? [];
        weakSkills = analysisResult.other_skills ?? analysisResult.weak_skills ?? []; // Other skills stored as weak for backward compatibility
        roadmap = analysisResult.roadmap ?? [];
      } catch (err) {
        console.error('Gemini RAG analysis error:', err.message || err);
        return res.status(502).json({ 
          message: `Analysis failed: ${err.message || 'Gemini RAG service error'}. Please try again.` 
        });
      }
    } else if (jobRoleSkills.length === 0) {
      return res.status(400).json({ message: 'No skills defined for this job role.' });
    } else {
      return res.status(400).json({ message: 'Resume text is empty. Please upload a valid resume.' });
    }

    const [analysisResult] = await connection.query(
      `INSERT INTO analyses (user_id, resume_id, job_role_id, match_score, method)
       VALUES (?, ?, ?, ?, 'gemini_rag')`,
      [user_id, resume_id, job_role_id, matchScore]
    );
    const analysisId = analysisResult.insertId;

    // Create a map of skill names to their metadata for gap insertion
    const skillMetadataMap = {};
    jobRoleSkills.forEach(skill => {
      skillMetadataMap[skill.name.toLowerCase()] = {
        importance: skill.importance,
        required_level: skill.required_level
      };
    });

    // Store appreciated skills - save them with a special marker or include in response
    // For now, we'll store them separately or include in response
    // Appreciated skills are present, so we don't save them as gaps
    
    // Store appreciated skills in a temporary way - we'll include them in the response
    const appreciatedSkillsList = matchedSkills; // These are the appreciated skills

    // Insert missing core skills with proper required_level from job role
    for (const skillName of missingSkills) {
      const skillId = await ensureSkillId(skillName);
      const metadata = skillMetadataMap[skillName.toLowerCase()] || {};
      await connection.query(
        `INSERT INTO analysis_skill_gaps (analysis_id, skill_id, gap_type, required_level, current_confidence)
         VALUES (?, ?, 'missing', ?, 0)`,
        [analysisId, skillId, metadata.required_level || 'intermediate']
      );
    }

    // Insert other skills (stored as 'weak' type for backward compatibility, but represent 'other_skills')
    for (const skillName of weakSkills) {
      const skillId = await ensureSkillId(skillName);
      const metadata = skillMetadataMap[skillName.toLowerCase()] || {};
      await connection.query(
        `INSERT INTO analysis_skill_gaps (analysis_id, skill_id, gap_type, required_level, current_confidence)
         VALUES (?, ?, 'weak', ?, 0)`,
        [analysisId, skillId, metadata.required_level || 'intermediate']
      );
    }

    // Insert roadmap items with learning resources
    let stepOrder = 1;
    for (const item of roadmap) {
      const skillName = item.skill || item.name || '';
      if (!skillName) continue;
      
      const steps = Array.isArray(item.steps) ? item.steps : [];
      const resources = Array.isArray(item.resources) ? item.resources : [];
      const skillId = await ensureSkillId(skillName);

      // Create learning resources if provided
      let learningResourceId = null;
      if (resources.length > 0) {
        // Use the first resource as primary
        const primaryResource = resources[0];
        if (primaryResource.url) {
          try {
            // Check if resource already exists for this skill and URL
            const [existing] = await connection.query(
              `SELECT id FROM learning_resources WHERE skill_id = ? AND url = ? LIMIT 1`,
              [skillId, primaryResource.url]
            );
            
            if (existing.length > 0) {
              learningResourceId = existing[0].id;
            } else {
              const [lrResult] = await connection.query(
                `INSERT INTO learning_resources (skill_id, title, url, provider, difficulty)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                  skillId,
                  primaryResource.title || 'Learning Resource',
                  primaryResource.url,
                  primaryResource.type || 'course',
                  'intermediate'
                ]
              );
              learningResourceId = lrResult.insertId;
            }
          } catch (err) {
            console.error('Error creating learning resource:', err.message);
            // Continue without resource if insertion fails
          }
        }
      }

      // Combine steps, resources, and project ideas in note
      const noteData = {
        steps: steps,
        resources: resources.map(res => ({
          title: res.title || '',
          url: res.url || '',
          type: res.type || 'tutorial',
          thumbnail: res.thumbnail || ''
        })),
        project_ideas: Array.isArray(item.project_ideas) ? item.project_ideas.map(proj => ({
          title: typeof proj === 'string' ? proj : (proj.title || ''),
          description: typeof proj === 'string' ? '' : (proj.description || ''),
          difficulty: typeof proj === 'string' ? 'intermediate' : (proj.difficulty || 'intermediate')
        })) : []
      };

      await connection.query(
        `INSERT INTO roadmap_items (analysis_id, skill_id, learning_resource_id, step_order, status, note)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [
          analysisId,
          skillId,
          learningResourceId,
          stepOrder,
          JSON.stringify(noteData)
        ]
      );
      stepOrder += 1;
    }

    return res.status(201).json({
      analysis_id: analysisId,
      match_score: matchScore,
      appreciated_core_skills: matchedSkills, // Skills present and appreciated
      missing_core_skills: missingSkills,     // Missing core skills
      other_skills: weakSkills,               // Other skills (less important)
      roadmap,
    });
  } catch (err) {
    console.error('POST /api/analyses error:', err);
    return res.status(500).json({ message: 'Failed to run analysis.' });
  }
};


exports.getAnalysis = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid analysis id.' });
    }

    const [analyses] = await connection.query(
      `SELECT a.id, a.user_id, a.resume_id, a.job_role_id, a.match_score, a.method, a.created_at,
              jr.title AS job_role_title,
              r.original_filename AS resume_filename,
              r.file_url AS resume_file_url
       FROM analyses a
       LEFT JOIN job_roles jr ON a.job_role_id = jr.id
       LEFT JOIN resumes r ON a.resume_id = r.id
       WHERE a.id = ?`,
      [id]
    );
    if (analyses.length === 0) {
      return res.status(404).json({ message: 'Analysis not found.' });
    }

    const [gaps] = await connection.query(
      `SELECT asg.id, asg.skill_id, asg.gap_type, asg.required_level, asg.current_confidence, s.name AS skill_name
       FROM analysis_skill_gaps asg
       INNER JOIN skills s ON asg.skill_id = s.id
       WHERE asg.analysis_id = ?
       ORDER BY asg.gap_type, s.name`,
      [id]
    );

    const [roadmapRows] = await connection.query(
      `SELECT ri.id, ri.skill_id, ri.learning_resource_id, ri.step_order, ri.status, ri.note, s.name AS skill_name,
              lr.title AS resource_title, lr.url AS resource_url
       FROM roadmap_items ri
       INNER JOIN skills s ON ri.skill_id = s.id
       LEFT JOIN learning_resources lr ON ri.learning_resource_id = lr.id
       WHERE ri.analysis_id = ?
       ORDER BY ri.step_order`,
      [id]
    );

    const analysis = analyses[0];
    
    // Fetch job role skills to calculate appreciated skills
    const jobRoleSkillsForAnalysis = await getSkillsForJobRole(analysis.job_role_id);
    
    // Calculate appreciated skills: required skills that are NOT in gaps (meaning they're present in resume)
    const missingAndOtherSkillNames = gaps.map(g => g.skill_name.toLowerCase());
    const appreciatedSkills = jobRoleSkillsForAnalysis
      .filter(skill => !missingAndOtherSkillNames.includes(skill.name.toLowerCase()))
      .map(skill => skill.name);
    
    const result = {
      id: analysis.id,
      user_id: analysis.user_id,
      resume_id: analysis.resume_id,
      job_role_id: analysis.job_role_id,
      match_score: Number(analysis.match_score),
      method: analysis.method,
      created_at: analysis.created_at,
      job_role_title: analysis.job_role_title,
      resume_filename: analysis.resume_filename,
      gaps: gaps.map((g) => ({
        skill_id: g.skill_id,
        skill_name: g.skill_name,
        gap_type: g.gap_type,
        required_level: g.required_level,
        current_confidence: Number(g.current_confidence),
      })),
      appreciated_core_skills: appreciatedSkills,
      roadmap: roadmapRows.map((r) => {
        // Parse note field which contains steps, resources, project_ideas
        let parsedNote = null;
        if (r.note) {
          try {
            parsedNote = typeof r.note === 'string' ? JSON.parse(r.note) : r.note;
          } catch {
            // Fallback for old format
            parsedNote = { steps: [], resources: [], project_ideas: [] };
          }
        } else {
          parsedNote = { steps: [], resources: [], project_ideas: [] };
        }
        
        return {
          skill_name: r.skill_name,
          step_order: r.step_order,
          status: r.status,
          steps: Array.isArray(parsedNote.steps) ? parsedNote.steps : [],
          resources: Array.isArray(parsedNote.resources) ? parsedNote.resources : 
            (r.resource_url ? [{ title: r.resource_title || 'Resource', url: r.resource_url, type: 'tutorial' }] : []),
          project_ideas: Array.isArray(parsedNote.project_ideas) ? parsedNote.project_ideas : [],
          // Keep old fields for backward compatibility
          note: r.note,
          resource_title: r.resource_title,
          resource_url: r.resource_url,
        };
      }),
    };

    return res.json(result);
  } catch (err) {
    console.error('GET /api/analyses/:id error:', err);
    return res.status(500).json({ message: 'Failed to fetch analysis.' });
  }
};
