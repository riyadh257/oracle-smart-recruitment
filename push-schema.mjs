import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Create tables directly from schema
const createStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    loginMethod VARCHAR(64),
    role ENUM('user', 'admin', 'candidate', 'employer') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    headline VARCHAR(500),
    summary TEXT,
    yearsOfExperience INT,
    desiredSalaryMin INT,
    desiredSalaryMax INT,
    preferredWorkSetting ENUM('remote', 'hybrid', 'onsite', 'flexible'),
    willingToRelocate BOOLEAN DEFAULT FALSE,
    technicalSkills JSON,
    softSkills JSON,
    workStyleAttributes JSON,
    personalityTraits JSON,
    cultureFitPreferences JSON,
    resumeUrl TEXT,
    resumeFileKey TEXT,
    aiProfileScore INT,
    aiInferredAttributes JSON,
    profileStatus ENUM('incomplete', 'active', 'inactive') DEFAULT 'incomplete',
    isAvailable BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS employers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    companyName VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    companySize ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
    description TEXT,
    contactEmail VARCHAR(320),
    contactPhone VARCHAR(50),
    cultureAttributes JSON,
    saasToolEnabled BOOLEAN DEFAULT FALSE,
    operationalMetrics JSON,
    predictedHiringNeeds JSON,
    billingModel ENUM('subscription', 'performance', 'hybrid') DEFAULT 'subscription',
    accountStatus ENUM('active', 'inactive') DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employerId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    workSetting ENUM('remote', 'hybrid', 'onsite', 'flexible'),
    employmentType ENUM('full_time', 'part_time', 'contract'),
    salaryMin INT,
    salaryMax INT,
    originalDescription TEXT,
    enrichedDescription TEXT,
    requiredSkills JSON,
    aiInferredRequirements JSON,
    idealCandidateProfile JSON,
    status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
    viewCount INT DEFAULT 0,
    applicationCount INT DEFAULT 0,
    atsJobId VARCHAR(255),
    atsSystem VARCHAR(100),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidateId INT NOT NULL,
    jobId INT NOT NULL,
    coverLetter TEXT,
    overallMatchScore INT,
    skillMatchScore INT,
    cultureFitScore INT,
    wellbeingMatchScore INT,
    matchBreakdown JSON,
    status ENUM('submitted', 'screening', 'interviewing', 'offered', 'rejected') DEFAULT 'submitted',
    qualifiesForBilling BOOLEAN DEFAULT FALSE,
    billingAmount INT,
    atsSynced BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS coachingSessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidateId INT NOT NULL,
    sessionType ENUM('resume_review', 'career_path', 'interview_prep', 'general'),
    userQuery TEXT,
    aiResponse TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employerId INT NOT NULL,
    shiftName VARCHAR(255),
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP NOT NULL,
    requiredHeadcount INT NOT NULL,
    currentHeadcount INT DEFAULT 0,
    skillsRequired JSON,
    staffingGap INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS employeeSkills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employerId INT NOT NULL,
    employeeRef VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    currentSkills JSON,
    skillGaps JSON,
    retentionRisk INT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS billingRecords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employerId INT NOT NULL,
    periodStart TIMESTAMP NOT NULL,
    periodEnd TIMESTAMP NOT NULL,
    qualifiedApplications INT DEFAULT 0,
    scheduledInterviews INT DEFAULT 0,
    totalAmount INT NOT NULL,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS atsIntegrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employerId INT NOT NULL,
    atsSystem VARCHAR(100) NOT NULL,
    atsApiKey TEXT,
    atsEndpoint VARCHAR(500),
    autoSync BOOLEAN DEFAULT TRUE,
    lastSync TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

for (const stmt of createStatements) {
  console.log("Executing:", stmt.substring(0, 60) + "...");
  await connection.query(stmt);
}

console.log("Schema pushed successfully!");
await connection.end();
