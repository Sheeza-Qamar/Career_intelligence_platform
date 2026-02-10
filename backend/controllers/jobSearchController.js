const axios = require('axios');
const crypto = require('crypto');
const db = require('../db');

const connection = db.promise();

// Apify API Configuration
// IMPORTANT: Never hard-code real API tokens in source control.
// The token must be provided via environment variable APIFY_API_TOKEN
// in your deployment platform (e.g., Vercel backend project settings).
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || '';
const APIFY_API_BASE_URL = 'https://api.apify.com/v2';

// Actor IDs
const LINKEDIN_ACTOR_ID = 'worldunboxer/rapid-linkedin-scraper';
const INDEED_ACTOR_ID = 'misceres/indeed-scraper';

// Job limits: fetch more results per source (cache stores all for 7 days)
const JOBS_PER_SOURCE = 100;

/**
 * Generate cache key from job role and location
 */
function generateCacheKey(jobRole, location) {
  const normalizedRole = jobRole.toLowerCase().trim();
  const normalizedLocation = location.toLowerCase().trim();
  return crypto.createHash('md5').update(`${normalizedRole}|${normalizedLocation}`).digest('hex');
}

/**
 * Check if cached results exist and still valid.
 * Cache is used only for same job_role + location; invalid after 7 days.
 * New job search (different role/location) = new cache key = fresh fetch.
 */
async function getCachedResults(cacheKey) {
  try {
    const [rows] = await connection.query(
      `SELECT results, total_jobs, indeed_count, linkedin_count 
       FROM job_search_cache 
       WHERE cache_key = ? AND expires_at > NOW()`,
      [cacheKey]
    );

    if (rows.length > 0) {
      const cached = rows[0];
      return {
        cached: true,
        results: typeof cached.results === 'string' ? JSON.parse(cached.results) : cached.results,
        total_jobs: cached.total_jobs,
        indeed_count: cached.indeed_count,
        linkedin_count: cached.linkedin_count
      };
    }
    return { cached: false };
  } catch (error) {
    // If table doesn't exist, just skip caching
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️  job_search_cache table does not exist. Please run the migration. Caching disabled.');
      return { cached: false };
    }
    console.error('Error fetching cache:', error);
    return { cached: false };
  }
}

/**
 * Save all results to cache for 7 days.
 * Cleared effectively when user does a new search (different role/location) or after 7 days.
 */
async function saveToCache(cacheKey, jobRole, location, results) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const indeedCount = results.filter(job => job.source === 'indeed').length;
    const linkedinCount = results.filter(job => job.source === 'linkedin').length;

    await connection.query(
      `INSERT INTO job_search_cache 
       (cache_key, job_role, location, results, total_jobs, indeed_count, linkedin_count, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       results = VALUES(results),
       total_jobs = VALUES(total_jobs),
       indeed_count = VALUES(indeed_count),
       linkedin_count = VALUES(linkedin_count),
       expires_at = VALUES(expires_at),
       created_at = CURRENT_TIMESTAMP`,
      [
        cacheKey,
        jobRole,
        location,
        JSON.stringify(results),
        results.length,
        indeedCount,
        linkedinCount,
        expiresAt
      ]
    );
  } catch (error) {
    // If table doesn't exist, just skip caching (don't throw)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('⚠️  job_search_cache table does not exist. Skipping cache save. Please run the migration.');
      return;
    }
    console.error('Error saving to cache:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Call Apify actor to fetch LinkedIn jobs
 * Expected input (from actor docs): job_title, job_type, jobs_entries, location, start_jobs, work_schedule
 */
async function fetchLinkedInJobs(jobRole, location) {
  try {
    console.log(`🔍 Fetching LinkedIn jobs for: ${jobRole} in ${location}`);

    const encodedActorId = LINKEDIN_ACTOR_ID.replace(/\//g, '~');
    const runResponse = await axios.post(
      `${APIFY_API_BASE_URL}/acts/${encodedActorId}/run-sync-get-dataset-items?format=json`,
      {
        job_title: jobRole,
        job_type: 'F',
        jobs_entries: JOBS_PER_SOURCE,
        location: location,
        start_jobs: 0,
        work_schedule: '1'
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout (Apify allows up to 300 seconds)
      }
    );

    // Response is directly the dataset items array
    const jobs = Array.isArray(runResponse.data) ? runResponse.data : (runResponse.data?.items || []);
    
    // Transform LinkedIn jobs to unified format (show all returned, cap at JOBS_PER_SOURCE)
    return jobs.slice(0, JOBS_PER_SOURCE).map(job => ({
      company_name: job.company_name || 'N/A',
      job_title: job.job_title || 'N/A',
      apply_url: job.apply_url || job.job_url || '#',
      employment_type: job.employment_type || 'Full-time',
      location: job.location || location,
      source: 'linkedin',
      salary_range: job.salary_range || null,
      job_description: job.job_description || null,
      company_logo_url: job.company_logo_url || null,
      time_posted: job.time_posted || null
    }));
  } catch (error) {
    console.error('LinkedIn API error:', error.response?.data || error.message);
    throw new Error(`LinkedIn job fetch failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Infer Indeed country code from location (actor expects "country": "US" or "PK" etc.)
 */
function getIndeedCountry(location) {
  const loc = (location || '').toLowerCase();
  if (loc.includes('pakistan') || ['lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta'].some(c => loc.includes(c))) {
    return 'PK';
  }
  if (loc.includes('uk') || loc.includes('united kingdom')) return 'GB';
  if (loc.includes('canada')) return 'CA';
  if (loc.includes('india')) return 'IN';
  return 'US';
}

/**
 * Call Apify actor to fetch Indeed jobs
 * Expected input (from actor docs): country, followApplyRedirects, location, maxItemsPerSearch, parseCompanyDetails, position, saveOnlyUniqueItems
 */
async function fetchIndeedJobs(jobRole, location) {
  try {
    const country = getIndeedCountry(location);
    console.log(`🔍 Fetching Indeed jobs for: ${jobRole} in ${location} (country: ${country})`);

    const encodedActorId = INDEED_ACTOR_ID.replace(/\//g, '~');
    const runResponse = await axios.post(
      `${APIFY_API_BASE_URL}/acts/${encodedActorId}/run-sync-get-dataset-items?format=json`,
      {
        country: country,
        followApplyRedirects: false,
        location: location.trim(),
        maxItemsPerSearch: JOBS_PER_SOURCE,
        parseCompanyDetails: false,
        position: jobRole,
        saveOnlyUniqueItems: true
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout (Apify allows up to 300 seconds)
      }
    );

    // Response is directly the dataset items array
    const jobs = Array.isArray(runResponse.data) ? runResponse.data : (runResponse.data?.items || []);
    
    // Transform Indeed jobs to unified format
    return jobs.slice(0, JOBS_PER_SOURCE).map(job => ({
      company_name: job.company || 'N/A',
      job_title: job.positionName || 'N/A',
      apply_url: job.url || '#',
      employment_type: Array.isArray(job.jobType) ? job.jobType[0] : (job.jobType || 'Full-time'),
      location: job.location || location,
      source: 'indeed',
      salary: job.salary || null,
      rating: job.rating || null,
      reviews_count: job.reviewsCount || null
    }));
  } catch (error) {
    console.error('Indeed API error:', error.response?.data || error.message);
    throw new Error(`Indeed job fetch failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * POST /api/job-search
 * Search for jobs using Apify APIs (LinkedIn + Indeed)
 * Body: { job_role: string, location: string }
 */
exports.searchJobs = async (req, res) => {
  try {
    const { job_role, location } = req.body;

    // Validation
    if (!job_role || !location) {
      return res.status(400).json({
        success: false,
        message: 'job_role and location are required.'
      });
    }

    // Generate cache key
    const cacheKey = generateCacheKey(job_role, location);

    // Check cache first
    const cached = await getCachedResults(cacheKey);
    if (cached.cached) {
      console.log(`✅ Returning cached results for: ${job_role} in ${location}`);
      return res.json({
        success: true,
        cached: true,
        total_jobs: cached.total_jobs,
        indeed_count: cached.indeed_count,
        linkedin_count: cached.linkedin_count,
        jobs: cached.results
      });
    }

    console.log(`🔄 Cache miss - Fetching fresh data for: ${job_role} in ${location}`);

    // Fetch jobs from both sources in parallel
    const [linkedinJobs, indeedJobs] = await Promise.allSettled([
      fetchLinkedInJobs(job_role, location),
      fetchIndeedJobs(job_role, location)
    ]);

    // Process results
    const allJobs = [];
    let linkedinCount = 0;
    let indeedCount = 0;

    if (linkedinJobs.status === 'fulfilled') {
      allJobs.push(...linkedinJobs.value);
      linkedinCount = linkedinJobs.value.length;
    } else {
      console.error('LinkedIn fetch failed:', linkedinJobs.reason);
    }

    if (indeedJobs.status === 'fulfilled') {
      allJobs.push(...indeedJobs.value);
      indeedCount = indeedJobs.value.length;
    } else {
      console.error('Indeed fetch failed:', indeedJobs.reason);
    }

    // If both failed, return error
    if (allJobs.length === 0) {
      const errors = [];
      if (linkedinJobs.status === 'rejected') errors.push(`LinkedIn: ${linkedinJobs.reason.message}`);
      if (indeedJobs.status === 'rejected') errors.push(`Indeed: ${indeedJobs.reason.message}`);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs from both sources.',
        errors: errors
      });
    }

    // Save to cache
    await saveToCache(cacheKey, job_role, location, allJobs);

    // Return results
    return res.json({
      success: true,
      cached: false,
      total_jobs: allJobs.length,
      indeed_count: indeedCount,
      linkedin_count: linkedinCount,
      jobs: allJobs
    });

  } catch (error) {
    console.error('Job search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search jobs. Please try again.',
      error: error.message
    });
  }
};

/**
 * GET /api/job-search/cache/clear
 * Clear expired cache entries (maintenance endpoint)
 */
exports.clearExpiredCache = async (req, res) => {
  try {
    const [result] = await connection.query(
      'DELETE FROM job_search_cache WHERE expires_at < NOW()'
    );
    
    return res.json({
      success: true,
      deleted_count: result.affectedRows,
      message: `Cleared ${result.affectedRows} expired cache entries.`
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cache.',
      error: error.message
    });
  }
};
