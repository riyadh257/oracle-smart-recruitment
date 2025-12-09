-- Job Seeker Portal Tables Migration
-- Created: 2025-01-XX

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  size VARCHAR(50),
  website VARCHAR(500),
  logo_url VARCHAR(500),
  description TEXT,
  location VARCHAR(255),
  founded_year INT,
  contact_email VARCHAR(320),
  contact_phone VARCHAR(50),
  linkedin_url VARCHAR(500),
  twitter_url VARCHAR(500),
  facebook_url VARCHAR(500),
  status ENUM('active', 'inactive', 'pending_verification') DEFAULT 'pending_verification' NOT NULL,
  verified INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  location VARCHAR(255),
  job_type ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary') DEFAULT 'full_time' NOT NULL,
  work_mode ENUM('onsite', 'remote', 'hybrid') DEFAULT 'onsite' NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT,
  requirements TEXT,
  qualifications TEXT,
  experience_level ENUM('entry', 'mid', 'senior', 'executive') DEFAULT 'mid' NOT NULL,
  min_experience INT,
  max_experience INT,
  education_level VARCHAR(255),
  required_skills TEXT,
  preferred_skills TEXT,
  salary_min INT,
  salary_max INT,
  salary_currency VARCHAR(10) DEFAULT 'USD',
  salary_period ENUM('hourly', 'monthly', 'yearly') DEFAULT 'yearly',
  show_salary INT DEFAULT 1 NOT NULL,
  benefits TEXT,
  application_deadline TIMESTAMP NULL,
  screening_questions TEXT,
  posted_by INT NOT NULL,
  views INT DEFAULT 0 NOT NULL,
  applications_count INT DEFAULT 0 NOT NULL,
  status ENUM('draft', 'active', 'closed', 'cancelled') DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  published_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL,
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_job_type (job_type),
  INDEX idx_experience_level (experience_level),
  INDEX idx_location (location),
  INDEX idx_published_at (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  candidate_id INT NOT NULL,
  user_id INT,
  cover_letter TEXT,
  resume_url VARCHAR(500),
  screening_answers TEXT,
  status ENUM('submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn') DEFAULT 'submitted' NOT NULL,
  match_score INT,
  ai_recommendation TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT,
  interview_id INT,
  offer_amount INT,
  offer_currency VARCHAR(10),
  offer_date TIMESTAMP NULL,
  offer_accepted_at TIMESTAMP NULL,
  offer_rejected_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_job_id (job_id),
  INDEX idx_candidate_id (candidate_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Saved Jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_job_id (job_id),
  UNIQUE KEY unique_user_job (user_id, job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Alerts table
CREATE TABLE IF NOT EXISTS job_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  keywords VARCHAR(500),
  location VARCHAR(255),
  job_type VARCHAR(100),
  experience_level VARCHAR(100),
  salary_min INT,
  frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'daily' NOT NULL,
  enabled INT DEFAULT 1 NOT NULL,
  last_sent_at TIMESTAMP NULL,
  matches_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Views table
CREATE TABLE IF NOT EXISTS job_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  user_id INT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_job_id (job_id),
  INDEX idx_user_id (user_id),
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
