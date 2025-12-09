-- B2C Training & Skill Development System Migration
-- This script creates all new tables for the job seeker journey

-- Training Programs
CREATE TABLE IF NOT EXISTS `trainingPrograms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `category` ENUM('technical','soft_skills','industry_specific','certification','language','leadership') NOT NULL,
  `level` ENUM('beginner','intermediate','advanced','expert') DEFAULT 'beginner' NOT NULL,
  `duration` INT,
  `format` ENUM('self_paced','instructor_led','hybrid','workshop') DEFAULT 'self_paced' NOT NULL,
  `price` INT DEFAULT 0,
  `isFree` TINYINT DEFAULT 1 NOT NULL,
  `thumbnailUrl` TEXT,
  `videoPreviewUrl` TEXT,
  `skillsGained` JSON,
  `prerequisites` JSON,
  `learningOutcomes` JSON,
  `instructorName` VARCHAR(255),
  `instructorBio` TEXT,
  `enrollmentCount` INT DEFAULT 0,
  `averageRating` INT DEFAULT 0,
  `reviewCount` INT DEFAULT 0,
  `isPublished` TINYINT DEFAULT 0 NOT NULL,
  `isFeatured` TINYINT DEFAULT 0,
  `certificateAwarded` TINYINT DEFAULT 0,
  `certificateTemplate` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `category_idx` (`category`),
  INDEX `level_idx` (`level`),
  INDEX `isPublished_idx` (`isPublished`),
  INDEX `isFeatured_idx` (`isFeatured`)
);

-- Course Modules
CREATE TABLE IF NOT EXISTS `courseModules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `programId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `orderIndex` INT NOT NULL,
  `duration` INT,
  `isRequired` TINYINT DEFAULT 1 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`programId`) REFERENCES `trainingPrograms`(`id`) ON DELETE CASCADE,
  INDEX `programId_idx` (`programId`),
  INDEX `orderIndex_idx` (`orderIndex`)
);

-- Course Lessons
CREATE TABLE IF NOT EXISTS `courseLessons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moduleId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `contentType` ENUM('video','article','quiz','assignment','interactive','download') NOT NULL,
  `contentUrl` TEXT,
  `contentKey` TEXT,
  `duration` INT,
  `orderIndex` INT NOT NULL,
  `isPreview` TINYINT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`moduleId`) REFERENCES `courseModules`(`id`) ON DELETE CASCADE,
  INDEX `moduleId_idx` (`moduleId`),
  INDEX `orderIndex_idx` (`orderIndex`)
);

-- Program Enrollments
CREATE TABLE IF NOT EXISTS `programEnrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `programId` INT NOT NULL,
  `status` ENUM('enrolled','in_progress','completed','dropped','expired') DEFAULT 'enrolled' NOT NULL,
  `progress` INT DEFAULT 0,
  `enrolledAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `startedAt` TIMESTAMP NULL,
  `completedAt` TIMESTAMP NULL,
  `certificateUrl` TEXT,
  `certificateKey` TEXT,
  `lastAccessedAt` TIMESTAMP NULL,
  `timeSpent` INT DEFAULT 0,
  `currentModuleId` INT NULL,
  `currentLessonId` INT NULL,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`programId`) REFERENCES `trainingPrograms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`currentModuleId`) REFERENCES `courseModules`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`currentLessonId`) REFERENCES `courseLessons`(`id`) ON DELETE SET NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `programId_idx` (`programId`),
  INDEX `status_idx` (`status`),
  UNIQUE INDEX `unique_user_program` (`userId`, `programId`)
);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS `lessonProgress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollmentId` INT NOT NULL,
  `lessonId` INT NOT NULL,
  `status` ENUM('not_started','in_progress','completed') DEFAULT 'not_started' NOT NULL,
  `progress` INT DEFAULT 0,
  `timeSpent` INT DEFAULT 0,
  `completedAt` TIMESTAMP NULL,
  `lastAccessedAt` TIMESTAMP NULL,
  `notes` TEXT,
  FOREIGN KEY (`enrollmentId`) REFERENCES `programEnrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lessonId`) REFERENCES `courseLessons`(`id`) ON DELETE CASCADE,
  INDEX `enrollmentId_idx` (`enrollmentId`),
  INDEX `lessonId_idx` (`lessonId`),
  UNIQUE INDEX `unique_enrollment_lesson` (`enrollmentId`, `lessonId`)
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS `quizAttempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollmentId` INT NOT NULL,
  `lessonId` INT NOT NULL,
  `attemptNumber` INT NOT NULL,
  `score` INT,
  `maxScore` INT NOT NULL,
  `passed` TINYINT DEFAULT 0,
  `answers` JSON,
  `startedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `completedAt` TIMESTAMP NULL,
  `timeSpent` INT,
  FOREIGN KEY (`enrollmentId`) REFERENCES `programEnrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lessonId`) REFERENCES `courseLessons`(`id`) ON DELETE CASCADE,
  INDEX `enrollmentId_idx` (`enrollmentId`),
  INDEX `lessonId_idx` (`lessonId`)
);

-- Program Reviews
CREATE TABLE IF NOT EXISTS `programReviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `programId` INT NOT NULL,
  `userId` INT NOT NULL,
  `rating` INT NOT NULL,
  `review` TEXT,
  `isVerifiedEnrollment` TINYINT DEFAULT 0,
  `helpfulCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`programId`) REFERENCES `trainingPrograms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `programId_idx` (`programId`),
  INDEX `userId_idx` (`userId`),
  UNIQUE INDEX `unique_user_program` (`userId`, `programId`)
);

-- Skills Taxonomy
CREATE TABLE IF NOT EXISTS `skillsTaxonomy` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `category` ENUM('technical','soft_skill','language','certification','tool','framework','domain_knowledge') NOT NULL,
  `description` TEXT,
  `parentSkillId` INT NULL,
  `demandScore` INT DEFAULT 0,
  `isVerifiable` TINYINT DEFAULT 0,
  `relatedSkills` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `category_idx` (`category`),
  INDEX `parentSkillId_idx` (`parentSkillId`)
);

-- Candidate Skills
CREATE TABLE IF NOT EXISTS `candidateSkills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `skillId` INT NOT NULL,
  `proficiencyLevel` ENUM('beginner','intermediate','advanced','expert') DEFAULT 'beginner' NOT NULL,
  `yearsOfExperience` INT,
  `isVerified` TINYINT DEFAULT 0,
  `verificationSource` ENUM('certificate','test','endorsement','self_reported'),
  `verificationDate` TIMESTAMP NULL,
  `lastUsed` TIMESTAMP NULL,
  `acquiredFrom` ENUM('work','training','education','self_study'),
  `acquiredAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`skillId`) REFERENCES `skillsTaxonomy`(`id`) ON DELETE CASCADE,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `skillId_idx` (`skillId`),
  UNIQUE INDEX `unique_candidate_skill` (`candidateId`, `skillId`)
);

-- Career Paths
CREATE TABLE IF NOT EXISTS `careerPaths` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `industry` VARCHAR(255),
  `startingRole` VARCHAR(255),
  `targetRole` VARCHAR(255),
  `estimatedDuration` INT,
  `requiredSkills` JSON,
  `recommendedPrograms` JSON,
  `milestones` JSON,
  `salaryRange` JSON,
  `demandTrend` ENUM('declining','stable','growing','high_demand'),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `industry_idx` (`industry`),
  INDEX `demandTrend_idx` (`demandTrend`)
);

-- Candidate Career Goals
CREATE TABLE IF NOT EXISTS `candidateCareerGoals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `careerPathId` INT NULL,
  `targetRole` VARCHAR(255) NOT NULL,
  `targetIndustry` VARCHAR(255),
  `targetSalary` INT,
  `targetDate` TIMESTAMP NULL,
  `currentProgress` INT DEFAULT 0,
  `skillGaps` JSON,
  `recommendedActions` JSON,
  `status` ENUM('active','achieved','abandoned','on_hold') DEFAULT 'active' NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`careerPathId`) REFERENCES `careerPaths`(`id`) ON DELETE SET NULL,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `careerPathId_idx` (`careerPathId`),
  INDEX `status_idx` (`status`)
);

-- Skill Assessments
CREATE TABLE IF NOT EXISTS `skillAssessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `skillId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `difficulty` ENUM('beginner','intermediate','advanced','expert') NOT NULL,
  `duration` INT,
  `passingScore` INT NOT NULL,
  `questions` JSON,
  `isActive` TINYINT DEFAULT 1 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`skillId`) REFERENCES `skillsTaxonomy`(`id`) ON DELETE CASCADE,
  INDEX `skillId_idx` (`skillId`),
  INDEX `difficulty_idx` (`difficulty`)
);

-- Assessment Results
CREATE TABLE IF NOT EXISTS `assessmentResults` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessmentId` INT NOT NULL,
  `candidateId` INT NOT NULL,
  `score` INT NOT NULL,
  `passed` TINYINT NOT NULL,
  `answers` JSON,
  `timeSpent` INT,
  `attemptNumber` INT NOT NULL,
  `completedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`assessmentId`) REFERENCES `skillAssessments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  INDEX `assessmentId_idx` (`assessmentId`),
  INDEX `candidateId_idx` (`candidateId`)
);

-- Certifications
CREATE TABLE IF NOT EXISTS `certifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `issuingOrganization` VARCHAR(255) NOT NULL,
  `issueDate` TIMESTAMP NULL,
  `expiryDate` TIMESTAMP NULL,
  `credentialId` VARCHAR(255),
  `credentialUrl` TEXT,
  `certificateUrl` TEXT,
  `certificateKey` TEXT,
  `isVerified` TINYINT DEFAULT 0,
  `relatedSkills` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `issuingOrganization_idx` (`issuingOrganization`)
);

-- Saved Jobs
CREATE TABLE IF NOT EXISTS `savedJobsNew` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `jobId` INT NOT NULL,
  `notes` TEXT,
  `savedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `jobId_idx` (`jobId`),
  UNIQUE INDEX `unique_candidate_job` (`candidateId`, `jobId`)
);

-- Job Alerts
CREATE TABLE IF NOT EXISTS `jobAlerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `keywords` JSON,
  `location` VARCHAR(255),
  `jobType` ENUM('full_time','part_time','contract','internship'),
  `workSetting` ENUM('remote','hybrid','onsite','flexible'),
  `salaryMin` INT,
  `frequency` ENUM('instant','daily','weekly') DEFAULT 'daily' NOT NULL,
  `isActive` TINYINT DEFAULT 1 NOT NULL,
  `lastSent` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `isActive_idx` (`isActive`)
);

-- Resume Templates
CREATE TABLE IF NOT EXISTS `resumeTemplates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` ENUM('professional','creative','modern','traditional','technical') NOT NULL,
  `thumbnailUrl` TEXT,
  `templateData` JSON,
  `isActive` TINYINT DEFAULT 1 NOT NULL,
  `usageCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `category_idx` (`category`),
  INDEX `isActive_idx` (`isActive`)
);

-- Candidate Resumes
CREATE TABLE IF NOT EXISTS `candidateResumes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidateId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `templateId` INT NULL,
  `resumeData` JSON,
  `fileUrl` TEXT,
  `fileKey` TEXT,
  `isDefault` TINYINT DEFAULT 0,
  `version` INT DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`templateId`) REFERENCES `resumeTemplates`(`id`) ON DELETE SET NULL,
  INDEX `candidateId_idx` (`candidateId`),
  INDEX `templateId_idx` (`templateId`)
);

-- Career Assessments
CREATE TABLE IF NOT EXISTS `careerAssessments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `assessmentType` ENUM('personality','skills','interests','values','work_style') NOT NULL,
  `questions` JSON,
  `scoringRubric` JSON,
  `duration` INT,
  `isActive` TINYINT DEFAULT 1 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `assessmentType_idx` (`assessmentType`),
  INDEX `isActive_idx` (`isActive`)
);

-- Assessment Responses
CREATE TABLE IF NOT EXISTS `assessmentResponses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assessmentId` INT NOT NULL,
  `candidateId` INT NOT NULL,
  `responses` JSON,
  `results` JSON,
  `recommendedCareers` JSON,
  `completedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`assessmentId`) REFERENCES `careerAssessments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidateId`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  INDEX `assessmentId_idx` (`assessmentId`),
  INDEX `candidateId_idx` (`candidateId`)
);

-- Application Notes
CREATE TABLE IF NOT EXISTS `applicationNotes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `userId` INT NOT NULL,
  `note` TEXT NOT NULL,
  `isInternal` TINYINT DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `applicationId_idx` (`applicationId`),
  INDEX `userId_idx` (`userId`)
);
