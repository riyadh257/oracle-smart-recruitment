/**
 * Test Database Seeding Script
 * 
 * This script populates the database with sample data for testing purposes.
 * Run with: pnpm seed:test
 * 
 * WARNING: This will add test data to your database. Only run in development/test environments.
 */

import { getDb } from "./db";
import { 
  users, 
  candidates, 
  jobs, 
  applications, 
  employers, 
  videoInterviews 
} from "../drizzle/schema";

async function seedTestData() {
  console.log("[Seed] Starting test data seeding...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Database not available");
    process.exit(1);
  }

  try {
    // 1. Create test users
    console.log("[Seed] Creating test users...");
    const testUsers = await db.insert(users).values([
      {
        openId: "test-admin-001",
        name: "Admin User",
        email: "admin@test.com",
        loginMethod: "manus",
        role: "admin",
      },
      {
        openId: "test-employer-001",
        name: "Employer User",
        email: "employer@test.com",
        loginMethod: "manus",
        role: "user",
      },
      {
        openId: "test-candidate-001",
        name: "Candidate User",
        email: "candidate@test.com",
        loginMethod: "manus",
        role: "user",
      },
    ]);
    console.log(`[Seed] Created ${testUsers.length || 3} test users`);

    // 2. Create test employer profiles
    console.log("[Seed] Creating test employer profiles...");
    const testEmployers = await db.insert(employers).values([
      {
        userId: 2, // Employer user
        companyName: "Tech Innovations Saudi",
        industry: "Technology",
        companySize: "201-500",
        description: "Leading technology company in Saudi Arabia specializing in AI and cloud solutions",
        contactEmail: "hr@techinnovations.sa",
        contactPhone: "+966-11-234-5678",
        billingModel: "performance",
        accountStatus: "active",
      },
      {
        userId: 1, // Admin user
        companyName: "Riyadh Financial Services",
        industry: "Finance",
        companySize: "501-1000",
        description: "Premier financial services provider in the Kingdom",
        contactEmail: "recruitment@riyadhfinance.sa",
        contactPhone: "+966-11-345-6789",
        billingModel: "subscription",
        accountStatus: "active",
      },
    ]);
    console.log(`[Seed] Created ${testEmployers.length || 2} test employer profiles`);

    // 3. Create test candidates
    console.log("[Seed] Creating test candidates...");
    const testCandidates = await db.insert(candidates).values([
      {
        userId: 3,
        fullName: "Ahmed Al-Rashid",
        email: "ahmed.rashid@email.com",
        phone: "+966-50-123-4567",
        location: "Riyadh",
        headline: "Senior Software Engineer",
        yearsOfExperience: 5,
        technicalSkills: ["Python", "React", "AWS", "Machine Learning"],
        profileStatus: "active",
      },
      {
        userId: 3,
        fullName: "Fatima Al-Zahrani",
        email: "fatima.zahrani@email.com",
        phone: "+966-50-234-5678",
        location: "Jeddah",
        headline: "Data Scientist",
        yearsOfExperience: 8,
        technicalSkills: ["Python", "TensorFlow", "SQL", "Statistics"],
        profileStatus: "active",
      },
      {
        userId: 3,
        fullName: "Mohammed Al-Qahtani",
        email: "mohammed.qahtani@email.com",
        phone: "+966-50-345-6789",
        location: "Dammam",
        headline: "Frontend Developer",
        yearsOfExperience: 3,
        technicalSkills: ["React", "TypeScript", "CSS", "UI/UX"],
        profileStatus: "active",
      },
      {
        userId: 3,
        fullName: "Sara Al-Mutairi",
        email: "sara.mutairi@email.com",
        phone: "+966-50-456-7890",
        location: "Riyadh",
        headline: "Product Manager",
        yearsOfExperience: 6,
        technicalSkills: ["Product Strategy", "Agile", "Data Analysis", "Leadership"],
        profileStatus: "active",
      },
      {
        userId: 3,
        fullName: "Khalid Al-Dosari",
        email: "khalid.dosari@email.com",
        phone: "+966-50-567-8901",
        location: "Riyadh",
        headline: "DevOps Engineer",
        yearsOfExperience: 10,
        technicalSkills: ["Kubernetes", "Docker", "AWS", "CI/CD", "Terraform"],
        profileStatus: "active",
      },
    ]);
    console.log(`[Seed] Created ${testCandidates.length || 5} test candidates`);

    // 4. Create test jobs
    console.log("[Seed] Creating test jobs...");
    const testJobs = await db.insert(jobs).values([
      {
        employerId: 1,
        title: "Senior AI Engineer",
        location: "Riyadh",
        workSetting: "hybrid",
        employmentType: "full_time",
        originalDescription: "Join our AI team to build cutting-edge machine learning solutions. We need someone with 5+ years of ML experience, strong Python skills, experience with TensorFlow/PyTorch, and cloud platform experience (AWS/Azure).",
        enrichedDescription: "Join our AI team to build cutting-edge machine learning solutions",
        requiredSkills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "AWS"],
        salaryMin: 180000,
        salaryMax: 250000,
        status: "active",
      },
      {
        employerId: 1,
        title: "React Frontend Developer",
        location: "Riyadh",
        workSetting: "hybrid",
        employmentType: "full_time",
        originalDescription: "Build beautiful and responsive user interfaces for our products. 3+ years React experience, strong TypeScript skills, experience with modern CSS, and understanding of web performance required.",
        enrichedDescription: "Build beautiful and responsive user interfaces for our products",
        requiredSkills: ["React", "TypeScript", "CSS", "JavaScript"],
        salaryMin: 120000,
        salaryMax: 160000,
        status: "active",
      },
      {
        employerId: 2,
        title: "Financial Analyst",
        location: "Riyadh",
        workSetting: "onsite",
        employmentType: "full_time",
        originalDescription: "Analyze financial data and provide insights for strategic decisions. 4+ years financial analysis experience, strong Excel and SQL skills, CFA or equivalent preferred, experience in Saudi financial sector.",
        enrichedDescription: "Analyze financial data and provide insights for strategic decisions",
        requiredSkills: ["Financial Analysis", "Excel", "SQL", "Data Analysis"],
        salaryMin: 150000,
        salaryMax: 200000,
        status: "active",
      },
      {
        employerId: 1,
        title: "Product Manager",
        location: "Riyadh",
        workSetting: "hybrid",
        employmentType: "full_time",
        originalDescription: "Lead product strategy and execution for our core platform. 5+ years product management experience, technical background preferred, experience with agile methodologies, strong communication skills.",
        enrichedDescription: "Lead product strategy and execution for our core platform",
        requiredSkills: ["Product Management", "Agile", "Strategy", "Leadership"],
        salaryMin: 200000,
        salaryMax: 280000,
        status: "active",
      },
    ]);
    console.log(`[Seed] Created ${testJobs.length || 4} test jobs`);

    // 5. Create test applications
    console.log("[Seed] Creating test applications...");
    const testApplications = await db.insert(applications).values([
      {
        candidateId: 1,
        jobId: 1,
        status: "screening",
      },
      {
        candidateId: 2,
        jobId: 1,
        status: "interviewing",
      },
      {
        candidateId: 3,
        jobId: 2,
        status: "interviewing",
      },
      {
        candidateId: 4,
        jobId: 4,
        status: "screening",
      },
      {
        candidateId: 5,
        jobId: 1,
        status: "screening",
      },
      {
        candidateId: 1,
        jobId: 4,
        status: "submitted",
      },
    ]);
    console.log(`[Seed] Created ${testApplications.length || 6} test applications`);

    // 6. Create test video interviews
    console.log("[Seed] Creating test video interviews...");
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const testInterviews = await db.insert(videoInterviews).values([
      {
        applicationId: 2,
        candidateId: 2,
        jobId: 1,
        employerId: 1,
        scheduledTime: tomorrow,
        duration: 60,
        status: "scheduled",
        meetingUrl: "https://meet.example.com/interview-001",
      },
      {
        applicationId: 3,
        candidateId: 3,
        jobId: 2,
        employerId: 1,
        scheduledTime: nextWeek,
        duration: 45,
        status: "scheduled",
        meetingUrl: "https://meet.example.com/interview-002",
      },
      {
        applicationId: 2,
        candidateId: 2,
        jobId: 1,
        employerId: 1,
        scheduledTime: yesterday,
        duration: 60,
        status: "completed",
        meetingUrl: "https://meet.example.com/interview-003",
        notes: "Strong technical skills, good communication",
      },
    ]);
    console.log(`[Seed] Created ${testInterviews.length || 3} test video interviews`);

    console.log("\n[Seed] ✅ Test data seeding completed successfully!");
    console.log("\n[Seed] Summary:");
    console.log(`  - Users: 3`);
    console.log(`  - Employers: 2`);
    console.log(`  - Candidates: 5`);
    console.log(`  - Jobs: 4`);
    console.log(`  - Applications: 6`);
    console.log(`  - Interviews: 3`);
    console.log("\n[Seed] You can now run tests with: pnpm test");

  } catch (error: unknown) {
    console.error("[Seed] Error seeding test data:", error);
    if (error instanceof Error) {
      console.error("[Seed] Error details:", error.message);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeding function
seedTestData();
