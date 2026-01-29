const axios = require('axios');
const db = require('../db');

const connection = db.promise();

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

async function getSkillsForJobRole(jobRoleId) {
  const [rows] = await connection.query(
    `SELECT s.name FROM skills s
     INNER JOIN job_role_skills jrs ON s.id = jrs.skill_id
     WHERE jrs.job_role_id = ?
     ORDER BY jrs.importance DESC, s.name`,
    [jobRoleId]
  );
  return rows.map((r) => r.name);
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

    const [roles] = await connection.query('SELECT id FROM job_roles WHERE id = ?', [job_role_id]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Job role not found.' });
    }

    const resumeText = resumes[0].extracted_text || '';
    const jobRoleSkills = await getSkillsForJobRole(job_role_id);

    let matchScore = 0;
    let matchedSkills = [];
    let missingSkills = [];
    let weakSkills = [];
    let roadmap = [];

    if (jobRoleSkills.length > 0) {
      try {
        const { data } = await axios.post(
          `${NLP_SERVICE_URL}/analyze`,
          {
            resume_text: resumeText,
            job_role_skills: jobRoleSkills,
            skill_dictionary: jobRoleSkills,
          },
          { timeout: 30000 }
        );
        matchScore = data.match_score ?? 0;
        matchedSkills = data.matched_skills ?? [];
        missingSkills = data.missing_skills ?? [];
        weakSkills = data.weak_skills ?? [];
        roadmap = data.roadmap ?? [];
      } catch (err) {
        console.error('NLP /analyze error:', err.message || err);
        return res.status(502).json({ message: 'Analysis service unavailable. Start the Python NLP service on port 8000.' });
      }
    }

    const [analysisResult] = await connection.query(
      `INSERT INTO analyses (user_id, resume_id, job_role_id, match_score, method)
       VALUES (?, ?, ?, ?, 'tfidf_cosine')`,
      [user_id, resume_id, job_role_id, matchScore]
    );
    const analysisId = analysisResult.insertId;

    for (const skillName of missingSkills) {
      const skillId = await ensureSkillId(skillName);
      await connection.query(
        `INSERT INTO analysis_skill_gaps (analysis_id, skill_id, gap_type, required_level, current_confidence)
         VALUES (?, ?, 'missing', 'intermediate', 0)`,
        [analysisId, skillId]
      );
    }
    for (const skillName of weakSkills) {
      const skillId = await ensureSkillId(skillName);
      await connection.query(
        `INSERT INTO analysis_skill_gaps (analysis_id, skill_id, gap_type, required_level, current_confidence)
         VALUES (?, ?, 'weak', 'intermediate', 0)`,
        [analysisId, skillId]
      );
    }

    let stepOrder = 1;
    for (const item of roadmap) {
      const skillName = item.skill || item;
      const steps = item.steps || [];
      const skillId = await ensureSkillId(skillName);
      await connection.query(
        `INSERT INTO roadmap_items (analysis_id, skill_id, learning_resource_id, step_order, status, note)
         VALUES (?, ?, NULL, ?, 'pending', ?)`,
        [analysisId, skillId, stepOrder, steps.length ? JSON.stringify(steps) : null]
      );
      stepOrder += 1;
    }

    return res.status(201).json({
      analysis_id: analysisId,
      match_score: matchScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      weak_skills: weakSkills,
      roadmap,
    });
  } catch (err) {
    console.error('POST /api/analyses error:', err);
    return res.status(500).json({ message: 'Failed to run analysis.' });
  }
};

/**
 * GET /api/analyses/:id
 */
exports.getAnalysis = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid analysis id.' });
    }

    const [analyses] = await connection.query(
      `SELECT a.id, a.user_id, a.resume_id, a.job_role_id, a.match_score, a.method, a.created_at,
              jr.title AS job_role_title,
              r.original_filename AS resume_filename
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
      roadmap: roadmapRows.map((r) => ({
        skill_name: r.skill_name,
        step_order: r.step_order,
        status: r.status,
        note: r.note,
        resource_title: r.resource_title,
        resource_url: r.resource_url,
      })),
    };

    return res.json(result);
  } catch (err) {
    console.error('GET /api/analyses/:id error:', err);
    return res.status(500).json({ message: 'Failed to fetch analysis.' });
  }
};
