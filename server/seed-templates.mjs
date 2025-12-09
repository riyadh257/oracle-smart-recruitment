import { drizzle } from "drizzle-orm/mysql2";
import { presentationTemplates } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const defaultTemplates = [
  {
    name: "Executive Briefing",
    description: "Professional template for C-level presentations with focus on metrics and strategic insights",
    category: "executive-briefing",
    slideStructure: JSON.stringify([
      { type: "title", title: "Executive Summary" },
      { type: "overview", title: "Candidate Overview" },
      { type: "metrics", title: "Key Metrics" },
      { type: "highlights", title: "Key Highlights" },
      { type: "recommendation", title: "Recommendation" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#1e40af",
        secondary: "#3b82f6",
        accent: "#60a5fa",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif"
      },
      layout: "minimal"
    }),
    contentMapping: JSON.stringify({
      overview: ["name", "email", "phone", "experience"],
      metrics: ["screeningScore", "interviewRatings", "feedback"],
      highlights: ["strengths", "skills"],
      recommendation: ["overallAssessment", "nextSteps"]
    }),
    isDefault: true,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  },
  {
    name: "Team Review",
    description: "Collaborative template for team discussions with detailed feedback sections",
    category: "team-review",
    slideStructure: JSON.stringify([
      { type: "title", title: "Candidate Review" },
      { type: "profile", title: "Candidate Profile" },
      { type: "screening", title: "AI Screening Results" },
      { type: "interviews", title: "Interview Feedback" },
      { type: "team-consensus", title: "Team Consensus" },
      { type: "next-steps", title: "Next Steps" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#059669",
        secondary: "#10b981",
        accent: "#34d399",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Roboto, sans-serif",
        body: "Roboto, sans-serif"
      },
      layout: "balanced"
    }),
    contentMapping: JSON.stringify({
      profile: ["name", "contact", "resume", "linkedin"],
      screening: ["aiScore", "skillsMatch", "strengths", "weaknesses"],
      interviews: ["allFeedback", "ratings", "comments"],
      consensus: ["aggregateRating", "recommendations"]
    }),
    isDefault: false,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  },
  {
    name: "Client Presentation",
    description: "Polished template for presenting candidates to external clients",
    category: "client-presentation",
    slideStructure: JSON.stringify([
      { type: "title", title: "Candidate Presentation" },
      { type: "introduction", title: "Introduction" },
      { type: "background", title: "Professional Background" },
      { type: "qualifications", title: "Key Qualifications" },
      { type: "assessment", title: "Our Assessment" },
      { type: "fit", title: "Cultural Fit" },
      { type: "closing", title: "Summary" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#7c3aed",
        secondary: "#8b5cf6",
        accent: "#a78bfa",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Montserrat, sans-serif",
        body: "Open Sans, sans-serif"
      },
      layout: "elegant"
    }),
    contentMapping: JSON.stringify({
      introduction: ["name", "tagline"],
      background: ["experience", "education", "achievements"],
      qualifications: ["skills", "certifications", "expertise"],
      assessment: ["screeningSummary", "interviewHighlights"],
      fit: ["culturalAlignment", "teamFit"]
    }),
    isDefault: false,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  },
  {
    name: "Candidate Profile",
    description: "Comprehensive single-candidate profile with all details",
    category: "candidate-profile",
    slideStructure: JSON.stringify([
      { type: "title", title: "Candidate Profile" },
      { type: "snapshot", title: "Quick Snapshot" },
      { type: "experience", title: "Work Experience" },
      { type: "skills", title: "Skills & Expertise" },
      { type: "education", title: "Education" },
      { type: "screening", title: "Screening Results" },
      { type: "interviews", title: "Interview Performance" },
      { type: "summary", title: "Summary" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#dc2626",
        secondary: "#ef4444",
        accent: "#f87171",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Poppins, sans-serif",
        body: "Poppins, sans-serif"
      },
      layout: "detailed"
    }),
    contentMapping: JSON.stringify({
      snapshot: ["name", "contact", "currentRole", "yearsExperience"],
      experience: ["workHistory", "achievements"],
      skills: ["technicalSkills", "softSkills"],
      education: ["degrees", "certifications"],
      screening: ["aiAnalysis", "scores"],
      interviews: ["feedback", "ratings"]
    }),
    isDefault: false,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  },
  {
    name: "Interview Summary",
    description: "Focused template for post-interview debriefs",
    category: "interview-summary",
    slideStructure: JSON.stringify([
      { type: "title", title: "Interview Summary" },
      { type: "candidate-info", title: "Candidate Information" },
      { type: "interview-details", title: "Interview Details" },
      { type: "ratings", title: "Rating Breakdown" },
      { type: "feedback", title: "Interviewer Feedback" },
      { type: "decision", title: "Decision & Next Steps" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#0891b2",
        secondary: "#06b6d4",
        accent: "#22d3ee",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Lato, sans-serif",
        body: "Lato, sans-serif"
      },
      layout: "structured"
    }),
    contentMapping: JSON.stringify({
      candidateInfo: ["name", "position", "date"],
      interviewDetails: ["interviewers", "type", "duration"],
      ratings: ["technicalSkills", "communication", "problemSolving", "cultureFit"],
      feedback: ["strengths", "weaknesses", "comments"],
      decision: ["recommendation", "nextSteps"]
    }),
    isDefault: false,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  },
  {
    name: "Analytics Report",
    description: "Data-driven template for recruitment analytics and trends",
    category: "analytics-report",
    slideStructure: JSON.stringify([
      { type: "title", title: "Recruitment Analytics" },
      { type: "overview", title: "Overview" },
      { type: "pipeline", title: "Pipeline Metrics" },
      { type: "performance", title: "Performance Analysis" },
      { type: "trends", title: "Trends & Insights" },
      { type: "recommendations", title: "Recommendations" }
    ]),
    styleConfig: JSON.stringify({
      colors: {
        primary: "#ea580c",
        secondary: "#f97316",
        accent: "#fb923c",
        background: "#ffffff",
        text: "#1f2937"
      },
      fonts: {
        heading: "Work Sans, sans-serif",
        body: "Work Sans, sans-serif"
      },
      layout: "data-focused"
    }),
    contentMapping: JSON.stringify({
      overview: ["totalCandidates", "activePositions", "timeToHire"],
      pipeline: ["stageBreakdown", "conversionRates"],
      performance: ["sourceEffectiveness", "interviewerMetrics"],
      trends: ["hiringTrends", "predictions"]
    }),
    isDefault: false,
    isPublic: true,
    usageCount: 0,
    createdBy: 1
  }
];

async function seedTemplates() {
  try {
    console.log("Seeding presentation templates...");
    
    for (const template of defaultTemplates) {
      await db.insert(presentationTemplates).values(template);
      console.log(`✓ Created template: ${template.name}`);
    }
    
    console.log("\n✅ Successfully seeded all presentation templates!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedTemplates();
