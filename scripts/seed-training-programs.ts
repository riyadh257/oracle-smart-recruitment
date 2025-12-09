import { drizzle } from "drizzle-orm/mysql2";
import { trainingPrograms } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const samplePrograms = [
  // Technical Skills
  {
    title: "Full Stack Web Development Bootcamp",
    slug: "full-stack-web-development-bootcamp",
    description: "Comprehensive 12-week program covering React, Node.js, databases, and deployment. Build 5 real-world projects and get job-ready skills.",
    category: "technical" as const,
    level: "intermediate" as const,
    duration: 480, // 12 weeks * 40 hours/week
    format: "instructor_led" as const,
    price: 1500000, // 15000 SAR in cents
    isFree: 0,
    skillsGained: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Git", "REST APIs", "Authentication"],
    learningOutcomes: [
      "Build full-stack web applications from scratch",
      "Deploy applications to cloud platforms",
      "Implement authentication and authorization",
      "Work with databases and ORMs",
      "Follow industry best practices"
    ],
    instructorName: "Dr. Ahmed Al-Rashid",
    instructorBio: "Senior Software Engineer with 10+ years of experience at leading tech companies. Passionate about teaching modern web development.",
    enrollmentCount: 18,
    averageRating: 480, // 4.8 * 100
    reviewCount: 12,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Python for Data Science & Machine Learning",
    slug: "python-data-science-machine-learning",
    description: "Master data analysis, visualization, and machine learning using Python. Includes hands-on projects with real datasets.",
    category: "technical" as const,
    level: "intermediate" as const,
    duration: 400, // 10 weeks
    format: "hybrid" as const,
    price: 1200000, // 12000 SAR
    isFree: 0,
    skillsGained: ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "Data Visualization", "Statistical Analysis"],
    learningOutcomes: [
      "Perform data analysis with Pandas and NumPy",
      "Create data visualizations",
      "Build machine learning models",
      "Apply statistical analysis techniques",
      "Work with real-world datasets"
    ],
    instructorName: "Dr. Sarah Johnson",
    instructorBio: "Data Scientist with PhD in Machine Learning. Former researcher at MIT, now teaching data science full-time.",
    enrollmentCount: 22,
    averageRating: 490, // 4.9
    reviewCount: 18,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Cloud Computing with AWS",
    slug: "cloud-computing-aws",
    description: "Learn to design, deploy, and manage scalable cloud infrastructure on Amazon Web Services. Prepare for AWS certification.",
    category: "technical" as const,
    level: "advanced" as const,
    duration: 320, // 8 weeks
    format: "self_paced" as const,
    price: 1000000, // 10000 SAR
    isFree: 0,
    skillsGained: ["AWS EC2", "S3", "Lambda", "RDS", "CloudFormation", "DevOps", "CI/CD", "Docker", "Kubernetes"],
    learningOutcomes: [
      "Design scalable cloud architectures",
      "Deploy applications on AWS",
      "Implement CI/CD pipelines",
      "Manage cloud security and compliance",
      "Prepare for AWS certification exams"
    ],
    instructorName: "Mohammed Al-Zahrani",
    instructorBio: "AWS Solutions Architect with 8 years of cloud infrastructure experience. Holds multiple AWS certifications.",
    enrollmentCount: 15,
    averageRating: 470, // 4.7
    reviewCount: 10,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 1,
  },
  {
    title: "Cybersecurity Fundamentals",
    slug: "cybersecurity-fundamentals",
    description: "Essential cybersecurity concepts, threat detection, and defense strategies. Hands-on labs with real security tools.",
    category: "technical" as const,
    level: "beginner" as const,
    duration: 240, // 6 weeks
    format: "instructor_led" as const,
    price: 800000, // 8000 SAR
    isFree: 0,
    skillsGained: ["Network Security", "Ethical Hacking", "Penetration Testing", "Cryptography", "Security Auditing", "Incident Response"],
    learningOutcomes: [
      "Understand common security threats",
      "Perform vulnerability assessments",
      "Implement security controls",
      "Respond to security incidents",
      "Follow security best practices"
    ],
    instructorName: "Khalid Al-Mutairi",
    instructorBio: "Certified Ethical Hacker (CEH) and security consultant with experience in government and enterprise security.",
    enrollmentCount: 25,
    averageRating: 460, // 4.6
    reviewCount: 15,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 1,
  },
  {
    title: "Mobile App Development with React Native",
    slug: "mobile-app-development-react-native",
    description: "Build cross-platform mobile apps for iOS and Android using React Native. Deploy to app stores.",
    category: "technical" as const,
    level: "intermediate" as const,
    duration: 320, // 8 weeks
    format: "instructor_led" as const,
    price: 1100000, // 11000 SAR
    isFree: 0,
    skillsGained: ["React Native", "JavaScript", "Mobile UI/UX", "API Integration", "App Store Deployment", "Firebase"],
    learningOutcomes: [
      "Build cross-platform mobile applications",
      "Implement mobile UI/UX patterns",
      "Integrate with backend APIs",
      "Deploy apps to iOS and Android stores",
      "Handle mobile-specific challenges"
    ],
    instructorName: "Fatima Al-Qahtani",
    instructorBio: "Mobile developer with 6 years of experience building apps for startups and enterprises. React Native specialist.",
    enrollmentCount: 12,
    averageRating: 480, // 4.8
    reviewCount: 8,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 1,
  },

  // Soft Skills
  {
    title: "Leadership & Team Management",
    slug: "leadership-team-management",
    description: "Develop essential leadership skills, team building strategies, and conflict resolution techniques for managers.",
    category: "soft_skills" as const,
    level: "intermediate" as const,
    duration: 160, // 4 weeks
    format: "workshop" as const,
    price: 600000, // 6000 SAR
    isFree: 0,
    skillsGained: ["Leadership", "Team Building", "Conflict Resolution", "Delegation", "Performance Management", "Motivation"],
    learningOutcomes: [
      "Lead teams effectively",
      "Build high-performing teams",
      "Resolve conflicts constructively",
      "Delegate tasks appropriately",
      "Motivate team members"
    ],
    instructorName: "Dr. Nora Al-Harbi",
    instructorBio: "Executive coach and leadership consultant with 15 years of experience developing leaders across industries.",
    enrollmentCount: 18,
    averageRating: 490, // 4.9
    reviewCount: 14,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Effective Communication & Presentation Skills",
    slug: "effective-communication-presentation-skills",
    description: "Master professional communication, public speaking, and persuasive presentation techniques.",
    category: "soft_skills" as const,
    level: "beginner" as const,
    duration: 120, // 3 weeks
    format: "hybrid" as const,
    price: 450000, // 4500 SAR
    isFree: 0,
    skillsGained: ["Public Speaking", "Presentation Skills", "Business Writing", "Active Listening", "Negotiation", "Storytelling"],
    learningOutcomes: [
      "Deliver confident presentations",
      "Write clear business communications",
      "Listen actively and empathetically",
      "Negotiate effectively",
      "Tell compelling stories"
    ],
    instructorName: "Omar Al-Sayed",
    instructorBio: "Professional speaker and communication trainer. Former TV presenter with expertise in public speaking.",
    enrollmentCount: 20,
    averageRating: 470, // 4.7
    reviewCount: 16,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 0,
  },
  {
    title: "Emotional Intelligence for Professionals",
    slug: "emotional-intelligence-professionals",
    description: "Enhance self-awareness, empathy, and interpersonal skills to excel in workplace relationships.",
    category: "soft_skills" as const,
    level: "beginner" as const,
    duration: 80, // 2 weeks
    format: "self_paced" as const,
    price: 350000, // 3500 SAR
    isFree: 0,
    skillsGained: ["Emotional Intelligence", "Self-Awareness", "Empathy", "Stress Management", "Relationship Building"],
    learningOutcomes: [
      "Develop self-awareness",
      "Practice empathy",
      "Manage stress effectively",
      "Build strong relationships",
      "Navigate workplace emotions"
    ],
    instructorName: "Layla Al-Dosari",
    instructorBio: "Psychologist and EQ coach specializing in workplace emotional intelligence and wellbeing.",
    enrollmentCount: 28,
    averageRating: 480, // 4.8
    reviewCount: 20,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 0,
  },

  // Certifications
  {
    title: "Project Management Professional (PMP) Prep",
    slug: "pmp-certification-prep",
    description: "Comprehensive PMP exam preparation with practice tests, case studies, and expert guidance.",
    category: "certification" as const,
    level: "advanced" as const,
    duration: 240, // 6 weeks
    format: "instructor_led" as const,
    price: 900000, // 9000 SAR
    isFree: 0,
    skillsGained: ["Project Management", "PMBOK", "Agile", "Scrum", "Risk Management", "Stakeholder Management", "Budgeting"],
    learningOutcomes: [
      "Pass the PMP certification exam",
      "Apply PMBOK best practices",
      "Manage projects effectively",
      "Handle project risks",
      "Lead project teams"
    ],
    instructorName: "Abdullah Al-Mutawa",
    instructorBio: "PMP-certified project manager with 12 years of experience leading enterprise projects. PMI-authorized instructor.",
    enrollmentCount: 16,
    averageRating: 490, // 4.9
    reviewCount: 12,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Google Digital Marketing Certification",
    slug: "google-digital-marketing-certification",
    description: "Master digital marketing fundamentals, SEO, SEM, social media marketing, and analytics. Google-certified program.",
    category: "certification" as const,
    level: "beginner" as const,
    duration: 320, // 8 weeks
    format: "self_paced" as const,
    price: 750000, // 7500 SAR
    isFree: 0,
    skillsGained: ["Digital Marketing", "SEO", "Google Ads", "Social Media Marketing", "Analytics", "Content Marketing", "Email Marketing"],
    learningOutcomes: [
      "Earn Google Digital Marketing certification",
      "Optimize websites for search engines",
      "Run effective Google Ads campaigns",
      "Analyze marketing performance",
      "Develop digital marketing strategies"
    ],
    instructorName: "Reem Al-Shammari",
    instructorBio: "Google-certified digital marketing expert with experience growing online businesses and e-commerce brands.",
    enrollmentCount: 35,
    averageRating: 470, // 4.7
    reviewCount: 25,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Certified Scrum Master (CSM)",
    slug: "certified-scrum-master-csm",
    description: "Become a certified Scrum Master and lead agile teams effectively. Includes official Scrum Alliance certification.",
    category: "certification" as const,
    level: "intermediate" as const,
    duration: 80, // 2 weeks intensive
    format: "workshop" as const,
    price: 850000, // 8500 SAR
    isFree: 0,
    skillsGained: ["Scrum Framework", "Agile Methodologies", "Sprint Planning", "Daily Standups", "Retrospectives", "Team Facilitation"],
    learningOutcomes: [
      "Earn Scrum Alliance CSM certification",
      "Facilitate Scrum ceremonies",
      "Coach agile teams",
      "Remove team impediments",
      "Drive continuous improvement"
    ],
    instructorName: "Yasser Al-Ghamdi",
    instructorBio: "Certified Scrum Trainer (CST) and agile coach. Has trained over 500 Scrum Masters across the Middle East.",
    enrollmentCount: 14,
    averageRating: 500, // 5.0
    reviewCount: 10,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },

  // Industry-Specific
  {
    title: "Financial Analysis & Business Intelligence",
    slug: "financial-analysis-business-intelligence",
    description: "Learn financial modeling, data analysis, and business intelligence tools for strategic decision-making.",
    category: "industry_specific" as const,
    level: "intermediate" as const,
    duration: 240, // 6 weeks
    format: "instructor_led" as const,
    price: 800000, // 8000 SAR
    isFree: 0,
    skillsGained: ["Financial Modeling", "Excel", "Power BI", "Business Intelligence", "Data Analysis", "Forecasting", "KPI Tracking"],
    learningOutcomes: [
      "Build financial models",
      "Create BI dashboards",
      "Analyze business data",
      "Forecast financial performance",
      "Track and report KPIs"
    ],
    instructorName: "Dr. Hassan Al-Otaibi",
    instructorBio: "Finance professor and consultant with CFA charter. Former investment banker with expertise in financial analysis.",
    enrollmentCount: 19,
    averageRating: 480, // 4.8
    reviewCount: 14,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 1,
  },
  {
    title: "Entrepreneurship & Startup Fundamentals",
    slug: "entrepreneurship-startup-fundamentals",
    description: "From idea to launch: business planning, funding, marketing, and scaling strategies for entrepreneurs.",
    category: "industry_specific" as const,
    level: "beginner" as const,
    duration: 200, // 5 weeks
    format: "hybrid" as const,
    price: 650000, // 6500 SAR
    isFree: 0,
    skillsGained: ["Business Planning", "Market Research", "Pitch Deck", "Fundraising", "MVP Development", "Growth Hacking", "Lean Startup"],
    learningOutcomes: [
      "Validate business ideas",
      "Create business plans",
      "Build MVPs",
      "Pitch to investors",
      "Scale startups"
    ],
    instructorName: "Nouf Al-Rasheed",
    instructorBio: "Serial entrepreneur and startup mentor. Founded 3 successful companies and now helps others launch their ventures.",
    enrollmentCount: 22,
    averageRating: 490, // 4.9
    reviewCount: 16,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 0,
  },

  // Design
  {
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design-masterclass",
    description: "Master user interface and user experience design principles, prototyping tools, and design thinking methodologies.",
    category: "technical" as const,
    level: "intermediate" as const,
    duration: 400, // 10 weeks
    format: "instructor_led" as const,
    price: 1000000, // 10000 SAR
    isFree: 0,
    skillsGained: ["UI Design", "UX Research", "Figma", "Adobe XD", "Prototyping", "User Testing", "Design Systems", "Wireframing"],
    learningOutcomes: [
      "Design user-centered interfaces",
      "Conduct UX research",
      "Create interactive prototypes",
      "Test designs with users",
      "Build design systems"
    ],
    instructorName: "Maha Al-Jaber",
    instructorBio: "Lead UX designer with 8 years of experience at top tech companies. Passionate about creating delightful user experiences.",
    enrollmentCount: 17,
    averageRating: 490, // 4.9
    reviewCount: 13,
    isPublished: 1,
    isFeatured: 1,
    certificateAwarded: 1,
  },
  {
    title: "Video Production & Editing",
    slug: "video-production-editing",
    description: "Professional video production, editing, and post-production techniques using industry-standard tools.",
    category: "technical" as const,
    level: "beginner" as const,
    duration: 240, // 6 weeks
    format: "hybrid" as const,
    price: 700000, // 7000 SAR
    isFree: 0,
    skillsGained: ["Video Editing", "Adobe Premiere Pro", "After Effects", "Cinematography", "Color Grading", "Sound Design", "Storytelling"],
    learningOutcomes: [
      "Shoot professional videos",
      "Edit videos effectively",
      "Add motion graphics",
      "Color grade footage",
      "Design sound for video"
    ],
    instructorName: "Tariq Al-Mansour",
    instructorBio: "Award-winning videographer and editor. Has produced content for major brands and media outlets.",
    enrollmentCount: 12,
    averageRating: 470, // 4.7
    reviewCount: 9,
    isPublished: 1,
    isFeatured: 0,
    certificateAwarded: 0,
  },
];

async function seedTrainingPrograms() {
  console.log("🌱 Seeding training programs...");
  
  for (const program of samplePrograms) {
    await db.insert(trainingPrograms).values(program);
    console.log(`✅ Created program: ${program.title}`);
  }

  console.log("\n✨ Training programs seeding completed!");
  console.log(`📊 Created ${samplePrograms.length} training programs`);
}

seedTrainingPrograms()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
