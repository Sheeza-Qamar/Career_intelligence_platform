-- Migration: Create job_search_cache table for caching job search results
-- This table stores job search results for 7 days to avoid unnecessary API calls

CREATE TABLE IF NOT EXISTS job_search_cache (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_role VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  cache_key VARCHAR(500) NOT NULL UNIQUE,
  results JSON NOT NULL,
  total_jobs INT UNSIGNED DEFAULT 0,
  indeed_count INT UNSIGNED DEFAULT 0,
  linkedin_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_cache_key (cache_key),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
