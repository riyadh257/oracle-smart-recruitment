# Oracle Smart Recruitment System - Database Schema Documentation

**Version:** 1.0  
**Last Updated:** November 26, 2025  
**Author:** Manus AI  
**Total Tables:** 157

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Recruitment Module](#recruitment-module)
4. [Communication Module](#communication-module)
5. [Analytics Module](#analytics-module)
6. [Security Module](#security-module)
7. [Integration Module](#integration-module)
8. [Relationships](#relationships)
9. [Indexes & Performance](#indexes--performance)

---

## Schema Overview

The Oracle Smart Recruitment System database consists of **157 tables** organized into functional modules. The schema uses MySQL/TiDB with InnoDB storage engine for ACID compliance and foreign key support. All tables follow consistent naming conventions with snake_case for table and column names.

### Design Principles

The schema design follows normalization principles to minimize data redundancy while maintaining query performance through strategic denormalization where appropriate. Timestamps (`created_at`, `updated_at`) track record lifecycle across all tables. Soft deletes are implemented where data retention is required for audit purposes.

### Data Types

The schema uses appropriate MySQL data types for each column. Integer types (`int`) serve as primary and foreign keys. Variable-length strings (`varchar`) store bounded text with explicit length limits. Text fields (`text`) handle unbounded content like descriptions and notes. JSON columns store structured data that doesn't require relational queries. Timestamps use MySQL's native `timestamp` type with automatic timezone handling.

---

## Core Tables

### users

The `users` table stores authentication and profile information for all system users including admins, HR managers, recruiters, interviewers, and candidates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `openId` | varchar(64) | Manus OAuth identifier (unique) |
| `name` | text | User's full name |
| `email` | varchar(320) | Email address |
| `loginMethod` | varchar(64) | Authentication method (oauth, email, etc.) |
| `role` | enum | User role (user, admin) |
| `createdAt` | timestamp | Account creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `lastSignedIn` | timestamp | Last login timestamp |

**Indexes:** Unique index on `openId`, index on `email` for login lookups.

---

## Recruitment Module

### candidates

The `candidates` table stores comprehensive candidate profiles including personal information, work experience, education, and skills.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `userId` | int (FK) | Reference to users table (if registered) |
| `firstName` | varchar(100) | Candidate's first name |
| `lastName` | varchar(100) | Candidate's last name |
| `email` | varchar(320) | Email address (unique) |
| `phone` | varchar(50) | Phone number |
| `location` | varchar(255) | Geographic location |
| `resumeUrl` | varchar(500) | S3 URL to resume/CV file |
| `profilePhotoUrl` | varchar(500) | S3 URL to profile photo |
| `summary` | text | Professional summary |
| `skills` | json | Array of skill strings |
| `experience` | json | Array of work experience objects |
| `education` | json | Array of education objects |
| `languages` | json | Array of language proficiency objects |
| `preferredLanguage` | enum | Preferred communication language (en, ar, fr) |
| `status` | enum | Candidate status (active, inactive, blacklisted) |
| `source` | varchar(100) | Acquisition source (LinkedIn, referral, etc.) |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Unique index on `email`, index on `status` and `source` for filtering.

### companies

The `companies` table stores information about hiring organizations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `name` | varchar(255) | Company name |
| `industry` | varchar(100) | Industry sector |
| `size` | enum | Company size range (1-10, 11-50, etc.) |
| `website` | varchar(500) | Company website URL |
| `logoUrl` | varchar(500) | S3 URL to company logo |
| `description` | text | Company description |
| `location` | varchar(255) | Headquarters location |
| `contactEmail` | varchar(320) | Primary contact email |
| `contactPhone` | varchar(50) | Primary contact phone |
| `adminUserId` | int (FK) | Reference to users table (company admin) |
| `status` | enum | Company status (active, inactive, pending) |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `adminUserId` for admin lookups, index on `status` for filtering.

### jobs

The `jobs` table stores job postings with detailed requirements and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `companyId` | int (FK) | Reference to companies table |
| `title` | varchar(255) | Job title |
| `description` | text | Full job description |
| `requirements` | text | Job requirements |
| `responsibilities` | text | Job responsibilities |
| `qualifications` | text | Required qualifications |
| `department` | varchar(100) | Department name |
| `location` | varchar(255) | Job location |
| `jobType` | enum | Employment type (full-time, part-time, contract, internship, remote) |
| `experienceLevel` | enum | Required experience (entry, mid, senior, executive) |
| `salaryMin` | int | Minimum salary |
| `salaryMax` | int | Maximum salary |
| `salaryCurrency` | varchar(10) | Salary currency code (USD, EUR, etc.) |
| `benefits` | text | Benefits description |
| `skills` | json | Array of required skill strings |
| `applicationDeadline` | timestamp | Application deadline |
| `screeningQuestions` | json | Array of screening question objects |
| `status` | enum | Job status (draft, active, closed, archived) |
| `views` | int | View count |
| `applicationsCount` | int | Application count |
| `postedBy` | int (FK) | Reference to users table (recruiter) |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `companyId`, `status`, `jobType`, and `experienceLevel` for filtering. Composite index on (`status`, `createdAt`) for active job listings.

### applications

The `applications` table tracks candidate applications to jobs through the recruitment pipeline.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `jobId` | int (FK) | Reference to jobs table |
| `candidateId` | int (FK) | Reference to candidates table |
| `status` | enum | Application status (submitted, under_review, shortlisted, interview_scheduled, interviewed, offered, accepted, rejected, withdrawn) |
| `coverLetter` | text | Cover letter content |
| `screeningAnswers` | json | Array of screening answer objects |
| `score` | int | Application score (0-100) |
| `notes` | text | Recruiter notes |
| `reviewedBy` | int (FK) | Reference to users table (reviewer) |
| `reviewedAt` | timestamp | Review timestamp |
| `appliedAt` | timestamp | Application submission timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `jobId` and `candidateId` for lookups. Composite index on (`jobId`, `status`) for pipeline queries. Index on `appliedAt` for chronological sorting.

### interviews

The `interviews` table manages interview scheduling and feedback.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `applicationId` | int (FK) | Reference to applications table |
| `jobId` | int (FK) | Reference to jobs table |
| `candidateId` | int (FK) | Reference to candidates table |
| `interviewerIds` | json | Array of interviewer user IDs |
| `scheduledAt` | timestamp | Interview date/time |
| `duration` | int | Duration in minutes |
| `location` | varchar(255) | Physical location or "Virtual" |
| `meetingLink` | varchar(500) | Video conference link |
| `type` | enum | Interview type (phone, video, in-person, technical) |
| `status` | enum | Interview status (scheduled, completed, cancelled, rescheduled) |
| `feedback` | text | Interviewer feedback |
| `rating` | int | Interview rating (1-5) |
| `notes` | text | Additional notes |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `applicationId`, `candidateId`, and `scheduledAt` for scheduling queries.

### jobAlerts

The `jobAlerts` table stores candidate job alert subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `userId` | int (FK) | Reference to users table |
| `candidateId` | int (FK) | Reference to candidates table |
| `criteria` | json | Alert criteria object (keywords, location, jobType, experienceLevel, salaryMin, salaryMax) |
| `frequency` | enum | Alert frequency (immediate, daily, weekly) |
| `enabled` | boolean | Alert enabled status |
| `lastSentAt` | timestamp | Last alert sent timestamp |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `userId` and `enabled` for active alert queries.

### savedJobs

The `savedJobs` table tracks jobs saved by candidates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `userId` | int (FK) | Reference to users table |
| `candidateId` | int (FK) | Reference to candidates table |
| `jobId` | int (FK) | Reference to jobs table |
| `savedAt` | timestamp | Save timestamp |

**Indexes:** Composite index on (`userId`, `jobId`) for uniqueness. Index on `savedAt` for chronological sorting.

---

## Communication Module

### emailTemplates

The `emailTemplates` table stores reusable email templates for automated communications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `name` | varchar(255) | Template name |
| `subject` | varchar(500) | Email subject line |
| `body` | text | Email body (HTML supported) |
| `category` | enum | Template category (welcome, interview_invitation, rejection, offer, etc.) |
| `language` | enum | Template language (en, ar, fr) |
| `variables` | json | Array of template variable names |
| `createdBy` | int (FK) | Reference to users table |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `category` and `language` for template lookups.

### automatedCampaigns

The `automatedCampaigns` table manages automated email campaign workflows.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `name` | varchar(255) | Campaign name |
| `description` | text | Campaign description |
| `campaignType` | enum | Campaign type (welcome_series, follow_up, nurture, re_engagement, custom) |
| `triggerType` | enum | Trigger type (status_change, time_based, event_based, manual) |
| `triggerConditions` | json | Trigger condition rules |
| `isActive` | boolean | Campaign active status |
| `createdBy` | int (FK) | Reference to users table |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `isActive` and `triggerType` for campaign execution.

### communications

The `communications` table logs all candidate communications across channels.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `candidateId` | int (FK) | Reference to candidates table |
| `channel` | enum | Communication channel (email, sms, whatsapp, phone) |
| `direction` | enum | Direction (inbound, outbound) |
| `subject` | varchar(500) | Message subject |
| `body` | text | Message content |
| `status` | enum | Delivery status (sent, delivered, failed, read) |
| `sentBy` | int (FK) | Reference to users table (sender) |
| `sentAt` | timestamp | Send timestamp |
| `readAt` | timestamp | Read timestamp |

**Indexes:** Index on `candidateId` and `sentAt` for communication history queries.

---

## Analytics Module

### candidateJobMatches

The `candidateJobMatches` table stores AI-powered candidate-job matching scores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `candidateId` | int (FK) | Reference to candidates table |
| `jobId` | int (FK) | Reference to jobs table |
| `matchScore` | int | Overall match score (0-100) |
| `skillsScore` | int | Skills match score (0-100) |
| `experienceScore` | int | Experience match score (0-100) |
| `educationScore` | int | Education match score (0-100) |
| `locationScore` | int | Location match score (0-100) |
| `recommendations` | json | Array of recommendation strings |
| `calculatedAt` | timestamp | Score calculation timestamp |

**Indexes:** Composite index on (`jobId`, `matchScore` DESC) for top candidate queries. Index on `candidateId` for candidate-specific matches.

### predictiveAnalytics

The `predictiveAnalytics` table stores AI predictions for candidate success and retention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `candidateId` | int (FK) | Reference to candidates table |
| `jobId` | int (FK) | Reference to jobs table |
| `successProbability` | int | Success probability score (0-100) |
| `retentionScore` | int | Retention prediction score (0-100) |
| `cultureFitScore` | int | Culture fit score (0-100) |
| `performancePrediction` | enum | Predicted performance (low, medium, high, excellent) |
| `insights` | json | Array of insight strings |
| `calculatedAt` | timestamp | Prediction calculation timestamp |

**Indexes:** Index on `candidateId` and `jobId` for prediction lookups.

### hiringForecasts

The `hiringForecasts` table stores hiring demand predictions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `companyId` | int (FK) | Reference to companies table |
| `department` | varchar(100) | Department name |
| `forecastPeriod` | varchar(50) | Forecast period (Q1 2025, etc.) |
| `predictedHires` | int | Predicted number of hires |
| `estimatedBudget` | int | Estimated hiring budget |
| `confidence` | int | Forecast confidence (0-100) |
| `breakdown` | json | Breakdown by role/level |
| `generatedAt` | timestamp | Forecast generation timestamp |

**Indexes:** Index on `companyId` and `forecastPeriod` for forecast queries.

---

## Security Module

### securityAlerts

The `securityAlerts` table logs security events and threats.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `alertType` | enum | Alert type (failed_login, suspicious_activity, data_exfiltration, unauthorized_access, malware_detected, policy_violation, critical_threat) |
| `severity` | enum | Severity level (low, medium, high, critical) |
| `title` | varchar(255) | Alert title |
| `description` | text | Alert description |
| `userId` | int (FK) | Reference to users table (affected user) |
| `ipAddress` | varchar(45) | Source IP address |
| `userAgent` | text | User agent string |
| `metadata` | json | Additional metadata |
| `status` | enum | Alert status (new, acknowledged, resolved, dismissed) |
| `acknowledgedAt` | timestamp | Acknowledgment timestamp |
| `acknowledgedBy` | int (FK) | Reference to users table (acknowledger) |
| `resolvedAt` | timestamp | Resolution timestamp |
| `resolvedBy` | int (FK) | Reference to users table (resolver) |
| `createdAt` | timestamp | Alert creation timestamp |

**Indexes:** Index on `status` and `severity` for active alert queries. Index on `userId` for user-specific alerts.

### threatPlaybooks

The `threatPlaybooks` table defines automated threat response workflows.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `name` | varchar(255) | Playbook name |
| `description` | text | Playbook description |
| `triggerType` | enum | Trigger type (failed_login_threshold, suspicious_activity, data_exfiltration, malware_detection, policy_violation) |
| `triggerCondition` | json | Trigger condition rules |
| `actions` | json | Array of action objects (type, params) |
| `enabled` | boolean | Playbook enabled status |
| `priority` | int | Execution priority |
| `createdBy` | int (FK) | Reference to users table |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `enabled` and `priority` for playbook execution.

---

## Integration Module

### calendarIntegrations

The `calendarIntegrations` table stores calendar service connections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `userId` | int (FK) | Reference to users table |
| `provider` | enum | Calendar provider (google, outlook) |
| `accessToken` | text | OAuth access token (encrypted) |
| `refreshToken` | text | OAuth refresh token (encrypted) |
| `expiresAt` | timestamp | Token expiration timestamp |
| `calendarId` | varchar(255) | Provider calendar ID |
| `syncEnabled` | boolean | Auto-sync enabled status |
| `lastSyncAt` | timestamp | Last sync timestamp |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `userId` and `provider` for integration lookups.

### sourcingIntegrations

The `sourcingIntegrations` table manages job board and sourcing platform connections.

| Column | Type | Description |
|--------|------|-------------|
| `id` | int (PK) | Auto-incrementing primary key |
| `companyId` | int (FK) | Reference to companies table |
| `platform` | enum | Sourcing platform (linkedin, indeed, glassdoor, custom) |
| `apiKey` | text | API key (encrypted) |
| `apiSecret` | text | API secret (encrypted) |
| `webhookUrl` | varchar(500) | Webhook URL for callbacks |
| `enabled` | boolean | Integration enabled status |
| `lastSyncAt` | timestamp | Last sync timestamp |
| `createdAt` | timestamp | Record creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:** Index on `companyId` and `platform` for integration lookups.

---

## Relationships

### Primary Relationships

The database implements referential integrity through foreign key constraints. The `candidates` table links to `users` for registered candidates. The `applications` table references both `jobs` and `candidates` to track application relationships. The `interviews` table references `applications`, `jobs`, and `candidates` for complete interview context.

### Many-to-Many Relationships

Many-to-many relationships are implemented through junction tables. For example, `interview_interviewers` (not shown) would link `interviews` to multiple `users` as interviewers. Similarly, `job_skills` could link `jobs` to a normalized `skills` table.

### Cascading Deletes

Foreign key constraints use appropriate cascade rules. Deleting a job cascades to delete associated applications and interviews. Deleting a candidate soft-deletes related records to preserve audit history. Deleting a user account requires reassigning or archiving their created records.

---

## Indexes & Performance

### Primary Indexes

Every table has a primary key index on the `id` column for fast row lookups. Foreign key columns have indexes to optimize join performance. Unique constraints on columns like `email` in `candidates` and `users` prevent duplicates and enable fast uniqueness checks.

### Composite Indexes

Composite indexes optimize common query patterns. For example, `(jobId, status)` on `applications` accelerates pipeline queries. `(candidateId, createdAt DESC)` on `communications` speeds up communication history retrieval.

### Query Optimization

Slow query logs identify optimization opportunities. The `EXPLAIN` command analyzes query execution plans. Covering indexes reduce disk I/O by including all columns needed for a query. Partitioning large tables by date ranges improves query performance on time-series data.

---

## Conclusion

The Oracle Smart Recruitment System database schema provides a robust foundation for managing complex recruitment workflows. The normalized design minimizes redundancy while strategic indexes ensure query performance. JSON columns offer flexibility for semi-structured data without sacrificing relational integrity. The schema supports horizontal scaling through read replicas and vertical scaling through database upgrades.

---

## References

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Drizzle ORM Schema Reference](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Database Normalization](https://en.wikipedia.org/wiki/Database_normalization)
