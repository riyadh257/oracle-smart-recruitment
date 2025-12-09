import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('Creating communication features tables...');

try {
  // Create bulk_broadcast_campaigns table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS bulk_broadcast_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      body TEXT NOT NULL,
      senderName VARCHAR(255),
      senderEmail VARCHAR(320),
      segmentType ENUM('all', 'filtered', 'custom') DEFAULT 'all' NOT NULL,
      segmentFilter JSON,
      status ENUM('draft', 'scheduled', 'sending', 'sent', 'failed') DEFAULT 'draft' NOT NULL,
      scheduledAt TIMESTAMP NULL,
      sentAt TIMESTAMP NULL,
      totalRecipients INT DEFAULT 0,
      sentCount INT DEFAULT 0,
      deliveredCount INT DEFAULT 0,
      openedCount INT DEFAULT 0,
      clickedCount INT DEFAULT 0,
      failedCount INT DEFAULT 0,
      createdBy INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id),
      INDEX status_idx (status),
      INDEX createdBy_idx (createdBy)
    )
  `);
  console.log('✓ Created bulk_broadcast_campaigns table');

  // Create email_workflows table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS email_workflows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      triggerEvent ENUM('candidate_applied', 'interview_scheduled', 'interview_completed', 'offer_sent', 'candidate_rejected', 'manual') NOT NULL,
      triggerConditions JSON,
      emailSubject VARCHAR(500) NOT NULL,
      emailBody TEXT NOT NULL,
      delayMinutes INT DEFAULT 0 NOT NULL,
      isActive TINYINT DEFAULT 1 NOT NULL,
      createdBy INT NOT NULL,
      executionCount INT DEFAULT 0,
      lastExecutedAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id),
      INDEX triggerEvent_idx (triggerEvent),
      INDEX isActive_idx (isActive)
    )
  `);
  console.log('✓ Created email_workflows table');

  // Create workflow_executions table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workflowId INT NOT NULL,
      candidateId INT NOT NULL,
      triggerData JSON,
      status ENUM('pending', 'sent', 'failed', 'skipped') DEFAULT 'pending' NOT NULL,
      scheduledFor TIMESTAMP NOT NULL,
      executedAt TIMESTAMP NULL,
      errorMessage TEXT,
      emailDelivered TINYINT DEFAULT 0,
      emailOpened TINYINT DEFAULT 0,
      emailClicked TINYINT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (workflowId) REFERENCES email_workflows(id) ON DELETE CASCADE,
      FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
      INDEX workflowId_idx (workflowId),
      INDEX candidateId_idx (candidateId),
      INDEX status_idx (status),
      INDEX scheduledFor_idx (scheduledFor)
    )
  `);
  console.log('✓ Created workflow_executions table');

  // Create ab_tests_new table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ab_tests_new (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      testType ENUM('email_subject', 'email_body', 'send_time', 'sender_name') NOT NULL,
      status ENUM('draft', 'running', 'completed', 'cancelled') DEFAULT 'draft' NOT NULL,
      startedAt TIMESTAMP NULL,
      completedAt TIMESTAMP NULL,
      targetAudience JSON,
      sampleSize INT NOT NULL,
      confidenceLevel INT DEFAULT 95,
      createdBy INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id),
      INDEX status_idx (status),
      INDEX createdBy_idx (createdBy)
    )
  `);
  console.log('✓ Created ab_tests_new table');

  // Create ab_test_variants table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ab_test_variants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL,
      variantName VARCHAR(100) NOT NULL,
      emailSubject VARCHAR(500),
      emailBody TEXT,
      senderName VARCHAR(255),
      sendTime VARCHAR(50),
      recipientCount INT DEFAULT 0,
      sentCount INT DEFAULT 0,
      deliveredCount INT DEFAULT 0,
      openedCount INT DEFAULT 0,
      clickedCount INT DEFAULT 0,
      conversionCount INT DEFAULT 0,
      openRate INT DEFAULT 0,
      clickRate INT DEFAULT 0,
      conversionRate INT DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (testId) REFERENCES ab_tests_new(id) ON DELETE CASCADE,
      INDEX testId_idx (testId)
    )
  `);
  console.log('✓ Created ab_test_variants table');

  // Create ab_test_results table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ab_test_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      testId INT NOT NULL,
      winnerVariantId INT,
      statisticalSignificance TINYINT DEFAULT 0,
      pValue INT DEFAULT 0,
      confidenceLevel INT DEFAULT 95,
      recommendation TEXT,
      relativeImprovement INT DEFAULT 0,
      absoluteImprovement INT DEFAULT 0,
      analysisCompletedAt TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (testId) REFERENCES ab_tests_new(id) ON DELETE CASCADE,
      FOREIGN KEY (winnerVariantId) REFERENCES ab_test_variants(id),
      INDEX testId_idx (testId)
    )
  `);
  console.log('✓ Created ab_test_results table');

  console.log('\n✅ All communication features tables created successfully!');
} catch (error) {
  console.error('❌ Error creating tables:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
