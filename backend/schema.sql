-- Resume_Analyzer database schema (reference – do not run blindly; tables may already exist)
-- USE Resume_Analyzer;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  category VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_role_skills (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_role_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  importance TINYINT UNSIGNED DEFAULT 3,
  required_level ENUM('basic', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  CONSTRAINT fk_job_role_skills_role
    FOREIGN KEY (job_role_id) REFERENCES job_roles(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_job_role_skills_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE CASCADE,
  UNIQUE KEY uniq_job_role_skill (job_role_id, skill_id)
);

CREATE TABLE IF NOT EXISTS resumes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_url VARCHAR(255) NULL,
  extracted_text LONGTEXT NOT NULL,
  parsed_success TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resumes_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS analyses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  resume_id BIGINT UNSIGNED NOT NULL,
  job_role_id BIGINT UNSIGNED NOT NULL,
  match_score DECIMAL(5,2) NOT NULL,
  method VARCHAR(100) DEFAULT 'tfidf_cosine',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analyses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_analyses_resume
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_analyses_job_role
    FOREIGN KEY (job_role_id) REFERENCES job_roles(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_skill_gaps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  analysis_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  gap_type ENUM('missing', 'weak') DEFAULT 'missing',
  required_level ENUM('basic', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  current_confidence DECIMAL(5,4) DEFAULT 0.0,
  CONSTRAINT fk_gap_analysis
    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_gap_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  skill_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  provider VARCHAR(150) NULL,
  difficulty ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  CONSTRAINT fk_resource_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  analysis_id BIGINT UNSIGNED NOT NULL,
  skill_id BIGINT UNSIGNED NOT NULL,
  learning_resource_id BIGINT UNSIGNED NULL,
  step_order INT UNSIGNED NOT NULL,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  note TEXT NULL,
  CONSTRAINT fk_roadmap_analysis
    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_roadmap_skill
    FOREIGN KEY (skill_id) REFERENCES skills(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_roadmap_resource
    FOREIGN KEY (learning_resource_id) REFERENCES learning_resources(id)
    ON DELETE SET NULL
);
