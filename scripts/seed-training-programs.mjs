import { drizzle } from "drizzle-orm/mysql2";
import { trainingPrograms, trainers } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const sampleTrainers = [
  {
    name: "TechSkills Academy",
    bio: "Leading provider of technical training programs with industry-certified instructors",
    expertise: "Software Development, Cloud Computing, Data Science",
    rating: 4.8,
    totalStudents: 15000,
  },
  {
    name: "Professional Development Institute",
    bio: "Specialized in soft skills and leadership training for career advancement",
    expertise: "Leadership, Communication, Project Management",
    rating: 4.6,
    totalStudents: 8500,
  },
  {
    name: "Saudi Digital Academy",
    bio: "Government-backed digital skills training aligned with Vision 2030",
    expertise: "Digital Marketing, E-commerce, Cybersecurity",
    rating: 4.9,
    totalStudents: 12000,
  },
];

const samplePrograms = [
  // Technical Skills
  {
    title: "Full Stack Web Development Bootcamp",
    description: "Comprehensive 12-week program covering React, Node.js, databases, and deployment. Build 5 real-world projects and get job-ready skills.",
    category: "Technical Skills",
    skillsTaught: "React, Node.js, TypeScript, PostgreSQL, AWS, Git, REST APIs, Authentication",
    duration: 12,
    durationUnit: "weeks",
    format: "Online",
    level: "Intermediate",
    price: 15000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 30,
    enrolledStudents: 18,
    trainerIndex: 0,
  },
  {
    title: "Python for Data Science & Machine Learning",
    description: "Master data analysis, visualization, and machine learning using Python. Includes hands-on projects with real datasets.",
    category: "Technical Skills",
    skillsTaught: "Python, Pandas, NumPy, Scikit-learn, TensorFlow, Data Visualization, Statistical Analysis",
    duration: 10,
    durationUnit: "weeks",
    format: "Hybrid",
    level: "Intermediate",
    price: 12000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 25,
    enrolledStudents: 22,
    trainerIndex: 0,
  },
  {
    title: "Cloud Computing with AWS",
    description: "Learn to design, deploy, and manage scalable cloud infrastructure on Amazon Web Services. Prepare for AWS certification.",
    category: "Technical Skills",
    skillsTaught: "AWS EC2, S3, Lambda, RDS, CloudFormation, DevOps, CI/CD, Docker, Kubernetes",
    duration: 8,
    durationUnit: "weeks",
    format: "Online",
    level: "Advanced",
    price: 10000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 20,
    enrolledStudents: 15,
    trainerIndex: 0,
  },
  {
    title: "Cybersecurity Fundamentals",
    description: "Essential cybersecurity concepts, threat detection, and defense strategies. Hands-on labs with real security tools.",
    category: "Technical Skills",
    skillsTaught: "Network Security, Ethical Hacking, Penetration Testing, Cryptography, Security Auditing, Incident Response",
    duration: 6,
    durationUnit: "weeks",
    format: "Online",
    level: "Beginner",
    price: 8000,
    currency: "SAR",
    language: "Arabic",
    certificationOffered: true,
    maxStudents: 30,
    enrolledStudents: 25,
    trainerIndex: 2,
  },
  {
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile apps for iOS and Android using React Native. Deploy to app stores.",
    category: "Technical Skills",
    skillsTaught: "React Native, JavaScript, Mobile UI/UX, API Integration, App Store Deployment, Firebase",
    duration: 8,
    durationUnit: "weeks",
    format: "Online",
    level: "Intermediate",
    price: 11000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 25,
    enrolledStudents: 12,
    trainerIndex: 0,
  },

  // Soft Skills
  {
    title: "Leadership & Team Management",
    description: "Develop essential leadership skills, team building strategies, and conflict resolution techniques for managers.",
    category: "Soft Skills",
    skillsTaught: "Leadership, Team Building, Conflict Resolution, Delegation, Performance Management, Motivation",
    duration: 4,
    durationUnit: "weeks",
    format: "In-person",
    level: "Intermediate",
    price: 6000,
    currency: "SAR",
    language: "Arabic",
    certificationOffered: true,
    maxStudents: 20,
    enrolledStudents: 18,
    trainerIndex: 1,
  },
  {
    title: "Effective Communication & Presentation Skills",
    description: "Master professional communication, public speaking, and persuasive presentation techniques.",
    category: "Soft Skills",
    skillsTaught: "Public Speaking, Presentation Skills, Business Writing, Active Listening, Negotiation, Storytelling",
    duration: 3,
    durationUnit: "weeks",
    format: "Hybrid",
    level: "Beginner",
    price: 4500,
    currency: "SAR",
    language: "English",
    certificationOffered: false,
    maxStudents: 25,
    enrolledStudents: 20,
    trainerIndex: 1,
  },
  {
    title: "Emotional Intelligence for Professionals",
    description: "Enhance self-awareness, empathy, and interpersonal skills to excel in workplace relationships.",
    category: "Soft Skills",
    skillsTaught: "Emotional Intelligence, Self-Awareness, Empathy, Stress Management, Relationship Building",
    duration: 2,
    durationUnit: "weeks",
    format: "Online",
    level: "Beginner",
    price: 3500,
    currency: "SAR",
    language: "Arabic",
    certificationOffered: false,
    maxStudents: 30,
    enrolledStudents: 28,
    trainerIndex: 1,
  },

  // Certifications
  {
    title: "Project Management Professional (PMP) Prep",
    description: "Comprehensive PMP exam preparation with practice tests, case studies, and expert guidance.",
    category: "Certifications",
    skillsTaught: "Project Management, PMBOK, Agile, Scrum, Risk Management, Stakeholder Management, Budgeting",
    duration: 6,
    durationUnit: "weeks",
    format: "Online",
    level: "Advanced",
    price: 9000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 20,
    enrolledStudents: 16,
    trainerIndex: 1,
  },
  {
    title: "Google Digital Marketing Certification",
    description: "Master digital marketing fundamentals, SEO, SEM, social media marketing, and analytics. Google-certified program.",
    category: "Certifications",
    skillsTaught: "Digital Marketing, SEO, Google Ads, Social Media Marketing, Analytics, Content Marketing, Email Marketing",
    duration: 8,
    durationUnit: "weeks",
    format: "Online",
    level: "Beginner",
    price: 7500,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 40,
    enrolledStudents: 35,
    trainerIndex: 2,
  },
  {
    title: "Certified Scrum Master (CSM)",
    description: "Become a certified Scrum Master and lead agile teams effectively. Includes official Scrum Alliance certification.",
    category: "Certifications",
    skillsTaught: "Scrum Framework, Agile Methodologies, Sprint Planning, Daily Standups, Retrospectives, Team Facilitation",
    duration: 2,
    durationUnit: "weeks",
    format: "In-person",
    level: "Intermediate",
    price: 8500,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 15,
    enrolledStudents: 14,
    trainerIndex: 1,
  },

  // Business & Finance
  {
    title: "Financial Analysis & Business Intelligence",
    description: "Learn financial modeling, data analysis, and business intelligence tools for strategic decision-making.",
    category: "Business Skills",
    skillsTaught: "Financial Modeling, Excel, Power BI, Business Intelligence, Data Analysis, Forecasting, KPI Tracking",
    duration: 6,
    durationUnit: "weeks",
    format: "Online",
    level: "Intermediate",
    price: 8000,
    currency: "SAR",
    language: "Arabic",
    certificationOffered: true,
    maxStudents: 25,
    enrolledStudents: 19,
    trainerIndex: 1,
  },
  {
    title: "Entrepreneurship & Startup Fundamentals",
    description: "From idea to launch: business planning, funding, marketing, and scaling strategies for entrepreneurs.",
    category: "Business Skills",
    skillsTaught: "Business Planning, Market Research, Pitch Deck, Fundraising, MVP Development, Growth Hacking, Lean Startup",
    duration: 5,
    durationUnit: "weeks",
    format: "Hybrid",
    level: "Beginner",
    price: 6500,
    currency: "SAR",
    language: "English",
    certificationOffered: false,
    maxStudents: 30,
    enrolledStudents: 22,
    trainerIndex: 1,
  },

  // Design & Creative
  {
    title: "UI/UX Design Masterclass",
    description: "Master user interface and user experience design principles, prototyping tools, and design thinking methodologies.",
    category: "Design",
    skillsTaught: "UI Design, UX Research, Figma, Adobe XD, Prototyping, User Testing, Design Systems, Wireframing",
    duration: 10,
    durationUnit: "weeks",
    format: "Online",
    level: "Intermediate",
    price: 10000,
    currency: "SAR",
    language: "English",
    certificationOffered: true,
    maxStudents: 20,
    enrolledStudents: 17,
    trainerIndex: 0,
  },
  {
    title: "Video Production & Editing",
    description: "Professional video production, editing, and post-production techniques using industry-standard tools.",
    category: "Design",
    skillsTaught: "Video Editing, Adobe Premiere Pro, After Effects, Cinematography, Color Grading, Sound Design, Storytelling",
    duration: 6,
    durationUnit: "weeks",
    format: "Hybrid",
    level: "Beginner",
    price: 7000,
    currency: "SAR",
    language: "Arabic",
    certificationOffered: false,
    maxStudents: 15,
    enrolledStudents: 12,
    trainerIndex: 2,
  },
];

async function seedTrainingPrograms() {
  console.log("🌱 Seeding trainers...");
  
  const insertedTrainers = [];
  for (const trainer of sampleTrainers) {
    const [inserted] = await db.insert(trainers).values(trainer);
    insertedTrainers.push(inserted.insertId);
    console.log(`✅ Created trainer: ${trainer.name}`);
  }

  console.log("\n🌱 Seeding training programs...");
  
  for (const program of samplePrograms) {
    const { trainerIndex, ...programData } = program;
    const trainerId = insertedTrainers[trainerIndex];
    
    await db.insert(trainingPrograms).values({
      ...programData,
      trainerId,
      status: "active",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    });
    
    console.log(`✅ Created program: ${program.title}`);
  }

  console.log("\n✨ Training programs seeding completed!");
  console.log(`📊 Created ${sampleTrainers.length} trainers and ${samplePrograms.length} training programs`);
}

seedTrainingPrograms()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
