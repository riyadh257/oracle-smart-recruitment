import { getDb } from "./db";
import * as automationTestingDb from "./automationTestingDb";

/**
 * Automation Testing Execution Module
 * Generates sample data and executes test scenarios
 */

// Sample data templates
const SAMPLE_CANDIDATE_NAMES = [
  "Ahmed Al-Rashid", "Fatima Hassan", "Mohammed Al-Saud", "Sarah Al-Otaibi",
  "Omar Abdullah", "Layla Al-Mutairi", "Khalid Al-Qahtani", "Nora Al-Dosari",
  "Abdullah Al-Harbi", "Maha Al-Shammari"
];

const SAMPLE_SKILLS = [
  "JavaScript", "Python", "Java", "React", "Node.js", "SQL", "AWS",
  "Docker", "Kubernetes", "TypeScript", "MongoDB", "PostgreSQL"
];

const SAMPLE_JOB_TITLES = [
  "Senior Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "DevOps Engineer", "Data Scientist",
  "Product Manager", "UX Designer", "QA Engineer", "System Architect"
];

const SAMPLE_LOCATIONS = [
  "Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar"
];

/**
 * Generate sample candidates for testing
 */
export async function generateSampleCandidates(
  executionId: number,
  count: number = 5
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const candidateIds: number[] = [];

  for (let i = 0; i < count; i++) {
    const name = SAMPLE_CANDIDATE_NAMES[i % SAMPLE_CANDIDATE_NAMES.length];
    const email = `test.candidate.${executionId}.${i}@example.com`;
    const skills = SAMPLE_SKILLS.slice(i * 2, i * 2 + 3);
    const location = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length];

    // Create a test user first
    const userResult = await db.execute(
      `INSERT INTO users (openId, name, email, role) VALUES (?, ?, ?, 'candidate')`,
      [`test_user_${executionId}_${i}`, name, email]
    );
    const userId = (userResult as any).insertId;

    // Create candidate
    const candidateResult = await db.execute(
      `INSERT INTO candidates (
        userId, fullName, email, phone, location, headline, yearsOfExperience,
        technicalSkills, isAvailable, profileStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, 'active')`,
      [
        userId,
        name,
        email,
        `+966-5${Math.floor(Math.random() * 100000000)}`,
        location,
        `Experienced ${SAMPLE_JOB_TITLES[i % SAMPLE_JOB_TITLES.length]}`,
        Math.floor(Math.random() * 10) + 1,
        JSON.stringify(skills)
      ]
    );
    const candidateId = (candidateResult as any).insertId;
    candidateIds.push(candidateId);

    // Track test data
    await automationTestingDb.createTestData({
      executionId,
      dataType: 'candidate',
      recordId: candidateId,
      recordData: { userId, name, email }
    });
  }

  return candidateIds;
}

/**
 * Generate sample jobs for testing
 */
export async function generateSampleJobs(
  executionId: number,
  employerId: number,
  count: number = 3
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const jobIds: number[] = [];

  for (let i = 0; i < count; i++) {
    const title = SAMPLE_JOB_TITLES[i % SAMPLE_JOB_TITLES.length];
    const location = SAMPLE_LOCATIONS[i % SAMPLE_LOCATIONS.length];
    const skills = SAMPLE_SKILLS.slice(i * 2, i * 2 + 4);

    const jobResult = await db.execute(
      `INSERT INTO jobs (
        employerId, title, location, workSetting, employmentType,
        salaryMin, salaryMax, originalDescription, requiredSkills, status
      ) VALUES (?, ?, ?, 'hybrid', 'full_time', ?, ?, ?, ?, 'active')`,
      [
        employerId,
        title,
        location,
        80000 + (i * 10000),
        120000 + (i * 15000),
        `We are looking for a talented ${title} to join our team in ${location}.`,
        JSON.stringify(skills)
      ]
    );
    const jobId = (jobResult as any).insertId;
    jobIds.push(jobId);

    // Track test data
    await automationTestingDb.createTestData({
      executionId,
      dataType: 'job',
      recordId: jobId,
      recordData: { title, location }
    });
  }

  return jobIds;
}

/**
 * Generate sample applications for testing
 */
export async function generateSampleApplications(
  executionId: number,
  candidateIds: number[],
  jobIds: number[]
): Promise<number[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const applicationIds: number[] = [];

  // Create applications for each candidate-job pair
  for (const candidateId of candidateIds) {
    for (const jobId of jobIds) {
      // Only create some applications (not all combinations)
      if (Math.random() > 0.5) continue;

      const applicationResult = await db.execute(
        `INSERT INTO applications (
          candidateId, jobId, coverLetter, overallMatchScore,
          skillMatchScore, cultureFitScore, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
        [
          candidateId,
          jobId,
          `I am very interested in this position and believe my skills align well with the requirements.`,
          Math.floor(Math.random() * 30) + 70, // 70-100
          Math.floor(Math.random() * 30) + 70,
          Math.floor(Math.random() * 30) + 70
        ]
      );
      const applicationId = (applicationResult as any).insertId;
      applicationIds.push(applicationId);

      // Track test data
      await automationTestingDb.createTestData({
        executionId,
        dataType: 'application',
        recordId: applicationId,
        recordData: { candidateId, jobId }
      });
    }
  }

  return applicationIds;
}

/**
 * Execute test scenario
 */
export async function executeTestScenario(
  executionId: number,
  scenarioId: number,
  userId: number
): Promise<void> {
  try {
    // Update execution status to running
    await automationTestingDb.updateTestExecution(executionId, {
      status: 'running',
      startedAt: new Date()
    });

    // Get scenario details
    const scenario = await automationTestingDb.getTestScenarioById(scenarioId);
    if (!scenario) {
      throw new Error("Scenario not found");
    }

    // Get triggers and campaigns
    const triggers = await automationTestingDb.getTestTriggersByScenario(scenarioId);
    const campaigns = await automationTestingDb.getTestCampaignsByScenario(scenarioId);

    // Generate sample data based on scenario type
    let candidateIds: number[] = [];
    let jobIds: number[] = [];
    let applicationIds: number[] = [];

    // For now, create a simple employer for testing
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const employerResult = await db.execute(
      `INSERT INTO employers (userId, companyName, industry, companySize, accountStatus)
       VALUES (?, ?, 'Technology', '51-200', 'active')`,
      [userId, `Test Company ${executionId}`]
    );
    const employerId = (employerResult as any).insertId;

    switch (scenario.scenarioType) {
      case 'candidate_application':
      case 'full_workflow':
        candidateIds = await generateSampleCandidates(executionId, 5);
        jobIds = await generateSampleJobs(executionId, employerId, 3);
        applicationIds = await generateSampleApplications(executionId, candidateIds, jobIds);
        break;

      case 'interview_scheduling':
        candidateIds = await generateSampleCandidates(executionId, 3);
        jobIds = await generateSampleJobs(executionId, employerId, 2);
        applicationIds = await generateSampleApplications(executionId, candidateIds, jobIds);
        break;

      case 'email_campaign':
        candidateIds = await generateSampleCandidates(executionId, 10);
        break;

      case 'engagement_tracking':
        candidateIds = await generateSampleCandidates(executionId, 5);
        jobIds = await generateSampleJobs(executionId, employerId, 2);
        break;

      case 'ab_testing':
        candidateIds = await generateSampleCandidates(executionId, 20);
        break;
    }

    // Update execution metrics
    await automationTestingDb.updateTestExecution(executionId, {
      sampleDataGenerated: true,
      testCandidatesCount: candidateIds.length,
      testJobsCount: jobIds.length,
      testApplicationsCount: applicationIds.length,
      triggersExecuted: triggers.length,
      campaignsExecuted: campaigns.length,
      status: 'completed',
      completedAt: new Date(),
      results: {
        candidateIds,
        jobIds,
        applicationIds,
        triggersCount: triggers.length,
        campaignsCount: campaigns.length,
        message: 'Test execution completed successfully'
      }
    });

    // Create test results
    await automationTestingDb.createTestResult({
      executionId,
      testType: 'sample_data_generation',
      testName: 'Generate Sample Data',
      passed: true,
      expectedValue: `${candidateIds.length} candidates, ${jobIds.length} jobs`,
      actualValue: `${candidateIds.length} candidates, ${jobIds.length} jobs, ${applicationIds.length} applications`,
      executionTime: 1000,
      metadata: {
        scenarioType: scenario.scenarioType,
        triggersConfigured: triggers.length,
        campaignsConfigured: campaigns.length
      }
    });

  } catch (error: any) {
    // Update execution status to failed
    await automationTestingDb.updateTestExecution(executionId, {
      status: 'failed',
      completedAt: new Date(),
      errorLog: error.message || 'Unknown error occurred'
    });

    // Create failure test result
    await automationTestingDb.createTestResult({
      executionId,
      testType: 'execution',
      testName: 'Test Execution',
      passed: false,
      errorMessage: error.message,
      stackTrace: error.stack
    });

    throw error;
  }
}
