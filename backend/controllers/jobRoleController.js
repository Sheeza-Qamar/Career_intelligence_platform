const db = require('../db');

const connection = db.promise();

/**
 * GET /api/job-roles
 * Returns list of job roles with optional skills_count.
 */
exports.list = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT
        jr.id,
        jr.title,
        jr.description,
        COUNT(jrs.skill_id) AS skills_count
      FROM job_roles jr
      LEFT JOIN job_role_skills jrs ON jr.id = jrs.job_role_id
      GROUP BY jr.id, jr.title, jr.description
      ORDER BY jr.title
    `);

    const jobRoles = rows.map((r) => ({
      id: r.id,
      name: r.title,
      title: r.title,
      description: r.description || null,
      skills_count: Number(r.skills_count) || 0,
    }));

    return res.json(jobRoles);
  } catch (err) {
    console.error('GET /api/job-roles error:', err);
    return res.status(500).json({ message: 'Failed to fetch job roles.' });
  }
};
