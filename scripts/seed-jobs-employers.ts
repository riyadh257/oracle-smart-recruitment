import { drizzle } from "drizzle-orm/mysql2";
import { employers, jobs, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const sampleEmployers = [
  {
    companyName: "Saudi Aramco Digital",
    industry: "Energy & Technology",
    companySize: "1000+" as const,
    description: "Leading the digital transformation of the energy sector with cutting-edge technology solutions",
    contactEmail: "careers@aramco.com",
    contactPhone: "+966-13-876-0000",
  },
  {
    companyName: "NEOM Tech & Digital",
    industry: "Smart Cities & Technology",
    companySize: "501-1000" as const,
    description: "Building the future of sustainable living through innovative technology and smart city solutions",
    contactEmail: "talent@neom.com",
    contactPhone: "+966-12-345-6789",
  },
  {
    companyName: "STC - Saudi Telecom Company",
    industry: "Telecommunications",
    companySize: "1000+" as const,
    description: "Leading digital enabler providing innovative ICT solutions and services across the region",
    contactEmail: "hr@stc.com.sa",
    contactPhone: "+966-11-455-0000",
  },
  {
    companyName: "Careem (Uber)",
    industry: "Technology & Transportation",
    companySize: "501-1000" as const,
    description: "Super app platform revolutionizing mobility, delivery, and digital payments in the Middle East",
    contactEmail: "jobs@careem.com",
    contactPhone: "+966-11-234-5678",
  },
  {
    companyName: "Noon.com",
    industry: "E-commerce",
    companySize: "501-1000" as const,
    description: "Leading e-commerce platform delivering exceptional online shopping experiences",
    contactEmail: "careers@noon.com",
    contactPhone: "+966-11-876-5432",
  },
  {
    companyName: "Elm Company",
    industry: "Digital Solutions",
    companySize: "201-500" as const,
    description: "Government digital services provider enabling digital transformation across public sectors",
    contactEmail: "recruitment@elm.sa",
    contactPhone: "+966-11-234-0000",
  },
  {
    companyName: "Lean Technologies",
    industry: "FinTech",
    companySize: "51-200" as const,
    description: "Open banking platform enabling seamless financial data connectivity and payments",
    contactEmail: "careers@leantech.me",
    contactPhone: "+966-11-567-8901",
  },
  {
    companyName: "Jahez",
    industry: "Food Delivery",
    companySize: "201-500" as const,
    description: "Leading food delivery platform connecting customers with restaurants across Saudi Arabia",
    contactEmail: "jobs@jahez.com",
    contactPhone: "+966-13-345-6789",
  },
  {
    companyName: "Mrsool",
    industry: "On-Demand Delivery",
    companySize: "201-500" as const,
    description: "On-demand delivery platform for anything, anywhere, anytime",
    contactEmail: "careers@mrsool.co",
    contactPhone: "+966-11-456-7890",
  },
  {
    companyName: "Tamara",
    industry: "FinTech",
    companySize: "51-200" as const,
    description: "Buy now, pay later platform transforming e-commerce payments in the region",
    contactEmail: "talent@tamara.co",
    contactPhone: "+966-11-678-9012",
  },
];

const sampleJobs = [
  // Software Engineering
  {
    employerIndex: 3, // Careem
    title: "Senior Full Stack Engineer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 25000,
    salaryMax: 35000,
    originalDescription: `Join our engineering team to build scalable microservices and modern web applications that serve millions of users across the Middle East.

Responsibilities:
- Design and develop full-stack features
- Mentor junior engineers
- Participate in architecture decisions
- Ensure code quality and best practices
- Collaborate with product and design teams

Requirements:
- 5+ years of full-stack development experience
- Strong proficiency in React and Node.js
- Experience with microservices architecture
- Knowledge of AWS or similar cloud platforms
- Excellent problem-solving skills

Benefits:
- Health insurance
- Annual bonus
- Stock options
- Flexible working hours
- Professional development budget
- Gym membership`,
    requiredSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "Kubernetes", "REST APIs", "GraphQL", "Git"],
    status: "active" as const,
  },
  {
    employerIndex: 4, // Noon
    title: "Frontend Developer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 18000,
    salaryMax: 25000,
    originalDescription: `Build beautiful, responsive, and performant user interfaces for our e-commerce platform serving millions of customers.

Responsibilities:
- Develop new user-facing features
- Build reusable components and libraries
- Optimize applications for maximum speed
- Collaborate with designers and backend engineers
- Write clean, maintainable code

Requirements:
- 3+ years of frontend development experience
- Expert knowledge of React and modern JavaScript
- Experience with state management (Redux/MobX)
- Strong CSS and responsive design skills
- Understanding of web performance optimization`,
    requiredSkills: ["React", "JavaScript", "TypeScript", "CSS", "HTML", "Redux", "Webpack", "Jest", "Responsive Design"],
    status: "active" as const,
  },
  {
    employerIndex: 6, // Lean Technologies
    title: "Backend Engineer - Python",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 20000,
    salaryMax: 28000,
    originalDescription: `Build robust and scalable backend systems for our open banking platform, handling financial data with security and reliability.

Responsibilities:
- Design and implement RESTful APIs
- Optimize database queries and performance
- Implement security best practices
- Write comprehensive tests
- Collaborate with frontend and DevOps teams

Requirements:
- 3+ years of Python development experience
- Strong knowledge of Django or FastAPI
- Experience with PostgreSQL and Redis
- Understanding of API security and authentication
- Familiarity with microservices architecture`,
    requiredSkills: ["Python", "Django", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST APIs", "OAuth", "Unit Testing", "Git"],
    status: "active" as const,
  },
  {
    employerIndex: 7, // Jahez
    title: "Mobile App Developer - React Native",
    location: "Khobar, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 16000,
    salaryMax: 23000,
    originalDescription: `Develop and maintain our mobile applications that connect thousands of restaurants with hungry customers.

Responsibilities:
- Build cross-platform mobile features
- Optimize app performance
- Integrate with backend APIs
- Implement push notifications
- Ensure smooth user experience across devices

Requirements:
- 2+ years of React Native development
- Strong JavaScript/TypeScript skills
- Experience with mobile app deployment
- Knowledge of native iOS/Android development
- Understanding of mobile UI/UX patterns`,
    requiredSkills: ["React Native", "JavaScript", "TypeScript", "iOS", "Android", "Firebase", "API Integration", "Mobile UI/UX", "Git"],
    status: "active" as const,
  },

  // Data & AI
  {
    employerIndex: 0, // Aramco
    title: "Data Scientist",
    location: "Dhahran, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 28000,
    salaryMax: 40000,
    originalDescription: `Apply advanced analytics and machine learning to solve complex problems in the energy sector and drive data-driven decision making.

Responsibilities:
- Develop predictive models and algorithms
- Analyze large datasets to extract insights
- Build machine learning pipelines
- Communicate findings to stakeholders
- Collaborate with engineering teams

Requirements:
- 5+ years of data science experience
- Strong Python and ML libraries knowledge
- Experience with big data technologies
- PhD or Master's in related field preferred
- Excellent analytical and communication skills`,
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "Scikit-learn", "SQL", "Big Data", "Statistics", "Data Visualization", "Jupyter", "Git"],
    status: "active" as const,
  },
  {
    employerIndex: 1, // NEOM
    title: "Machine Learning Engineer",
    location: "NEOM, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 30000,
    salaryMax: 42000,
    originalDescription: `Build and deploy AI systems that power smart city infrastructure and enhance quality of life for NEOM residents.

Responsibilities:
- Design ML systems and algorithms
- Deploy models to production
- Optimize model performance
- Collaborate with data engineers
- Stay current with AI research

Requirements:
- 4+ years of ML engineering experience
- Strong Python and deep learning frameworks
- Experience with MLOps and model deployment
- Knowledge of computer vision or NLP
- Cloud platform experience (AWS/Azure/GCP)`,
    requiredSkills: ["Python", "TensorFlow", "PyTorch", "MLOps", "Docker", "Kubernetes", "AWS", "Computer Vision", "NLP", "Git"],
    status: "active" as const,
  },

  // Cloud & DevOps
  {
    employerIndex: 2, // STC
    title: "DevOps Engineer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 22000,
    salaryMax: 30000,
    originalDescription: `Build and maintain CI/CD pipelines and cloud infrastructure to support our digital transformation initiatives.

Responsibilities:
- Manage cloud infrastructure
- Build CI/CD pipelines
- Automate deployment processes
- Monitor system performance
- Ensure security and compliance

Requirements:
- 3+ years of DevOps experience
- Strong AWS or Azure knowledge
- Experience with Kubernetes and Docker
- Proficiency in scripting (Python/Bash)
- Understanding of security best practices`,
    requiredSkills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Jenkins", "Python", "Bash", "Monitoring", "Git"],
    status: "active" as const,
  },
  {
    employerIndex: 5, // Elm
    title: "Cloud Solutions Architect",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 32000,
    salaryMax: 45000,
    originalDescription: `Design and implement cloud solutions for government digital services, ensuring scalability, security, and compliance.

Responsibilities:
- Design cloud architectures
- Lead cloud migrations
- Ensure security and compliance
- Provide technical leadership
- Collaborate with stakeholders

Requirements:
- 6+ years of cloud architecture experience
- AWS/Azure certifications
- Experience with government projects
- Strong security knowledge
- Excellent communication skills`,
    requiredSkills: ["AWS", "Azure", "Cloud Architecture", "Security", "Compliance", "Terraform", "Kubernetes", "Networking", "DevOps", "Leadership"],
    status: "active" as const,
  },

  // Cybersecurity
  {
    employerIndex: 0, // Aramco
    title: "Cybersecurity Engineer",
    location: "Dhahran, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 24000,
    salaryMax: 32000,
    originalDescription: `Protect critical infrastructure and sensitive data from cyber threats through proactive security measures and incident response.

Responsibilities:
- Monitor security systems
- Conduct vulnerability assessments
- Respond to security incidents
- Implement security controls
- Provide security training

Requirements:
- 3+ years of cybersecurity experience
- Knowledge of security frameworks (NIST, ISO 27001)
- Experience with SIEM tools
- Understanding of network security
- Relevant certifications (CISSP, CEH) preferred`,
    requiredSkills: ["Network Security", "Penetration Testing", "SIEM", "Incident Response", "Cryptography", "Security Auditing", "Firewalls", "IDS/IPS"],
    status: "active" as const,
  },

  // Product & Design
  {
    employerIndex: 9, // Tamara
    title: "Product Manager",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 28000,
    salaryMax: 38000,
    originalDescription: `Drive product strategy and execution for our buy-now-pay-later platform, shaping the future of e-commerce payments.

Responsibilities:
- Define product roadmap
- Gather and prioritize requirements
- Work with engineering and design
- Analyze product metrics
- Communicate with stakeholders

Requirements:
- 5+ years of product management experience
- FinTech or payments experience preferred
- Strong analytical and communication skills
- Experience with agile methodologies
- Data-driven decision making`,
    requiredSkills: ["Product Management", "Agile", "User Research", "Data Analysis", "Stakeholder Management", "Roadmapping", "A/B Testing", "SQL"],
    status: "active" as const,
  },
  {
    employerIndex: 4, // Noon
    title: "UI/UX Designer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 18000,
    salaryMax: 26000,
    originalDescription: `Create delightful user experiences for millions of shoppers through thoughtful design and user research.

Responsibilities:
- Design user interfaces and experiences
- Conduct user research
- Create prototypes and wireframes
- Collaborate with product and engineering
- Maintain design systems

Requirements:
- 3+ years of UI/UX design experience
- Strong portfolio demonstrating design process
- Proficiency in Figma and design tools
- Understanding of user research methods
- E-commerce experience preferred`,
    requiredSkills: ["UI Design", "UX Research", "Figma", "Prototyping", "User Testing", "Design Systems", "Wireframing", "Adobe XD", "Sketch"],
    status: "active" as const,
  },

  // Marketing & Growth
  {
    employerIndex: 8, // Mrsool
    title: "Digital Marketing Manager",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 22000,
    salaryMax: 32000,
    originalDescription: `Lead digital marketing strategies to drive user acquisition and engagement for our on-demand delivery platform.

Responsibilities:
- Develop marketing strategies
- Manage digital campaigns
- Analyze marketing performance
- Lead marketing team
- Optimize conversion funnels

Requirements:
- 5+ years of digital marketing experience
- Strong knowledge of SEO, SEM, and social media
- Experience with marketing analytics tools
- Proven track record of user growth
- Arabic and English fluency`,
    requiredSkills: ["Digital Marketing", "SEO", "Google Ads", "Social Media Marketing", "Analytics", "Content Marketing", "Email Marketing", "A/B Testing"],
    status: "active" as const,
  },

  // Business & Operations
  {
    employerIndex: 5, // Elm
    title: "Business Analyst",
    location: "Riyadh, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 16000,
    salaryMax: 23000,
    originalDescription: `Analyze business processes and data to drive operational efficiency and inform strategic decisions.

Responsibilities:
- Gather business requirements
- Analyze data and metrics
- Create reports and dashboards
- Identify process improvements
- Collaborate with stakeholders

Requirements:
- 3+ years of business analysis experience
- Strong Excel and SQL skills
- Experience with BI tools (Power BI/Tableau)
- Excellent analytical and communication skills
- Government sector experience preferred`,
    requiredSkills: ["Business Analysis", "SQL", "Excel", "Power BI", "Data Analysis", "Requirements Gathering", "Process Improvement", "Stakeholder Management"],
    status: "active" as const,
  },
  {
    employerIndex: 7, // Jahez
    title: "Operations Manager",
    location: "Khobar, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 24000,
    salaryMax: 34000,
    originalDescription: `Oversee daily operations and logistics to ensure seamless food delivery experiences for customers and restaurants.

Responsibilities:
- Manage operations team
- Optimize delivery logistics
- Monitor KPIs and performance
- Resolve operational issues
- Implement process improvements

Requirements:
- 5+ years of operations management experience
- Logistics or delivery experience preferred
- Strong leadership and problem-solving skills
- Data-driven approach
- Excellent communication in Arabic and English`,
    requiredSkills: ["Operations Management", "Logistics", "Team Leadership", "KPI Tracking", "Process Optimization", "Problem Solving", "Data Analysis"],
    status: "active" as const,
  },

  // Junior Positions
  {
    employerIndex: 3, // Careem
    title: "Junior Software Engineer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 12000,
    salaryMax: 16000,
    originalDescription: `Start your software engineering career with a leading tech company. Learn from experienced engineers and work on impactful projects.

Responsibilities:
- Write clean, maintainable code
- Participate in code reviews
- Learn best practices
- Collaborate with team members
- Contribute to feature development

Requirements:
- Bachelor's degree in Computer Science or related field
- Strong programming fundamentals
- Knowledge of JavaScript or Python
- Passion for learning
- Good communication skills`,
    requiredSkills: ["JavaScript", "Python", "Git", "Problem Solving", "Teamwork", "Learning Agility"],
    status: "active" as const,
  },
  {
    employerIndex: 2, // STC
    title: "Junior Data Analyst",
    location: "Riyadh, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 10000,
    salaryMax: 14000,
    originalDescription: `Join our data team to analyze telecom data and generate insights that drive business decisions.

Responsibilities:
- Analyze data and create reports
- Build dashboards
- Support senior analysts
- Learn data tools and techniques
- Present findings to stakeholders

Requirements:
- Bachelor's degree in Statistics, Mathematics, or related field
- Basic SQL and Excel skills
- Analytical mindset
- Attention to detail
- Eagerness to learn`,
    requiredSkills: ["SQL", "Excel", "Data Analysis", "Power BI", "Statistics", "Reporting", "Communication"],
    status: "active" as const,
  },

  // Specialized Roles
  {
    employerIndex: 1, // NEOM
    title: "Scrum Master",
    location: "NEOM, Saudi Arabia",
    workSetting: "onsite" as const,
    employmentType: "full_time" as const,
    salaryMin: 20000,
    salaryMax: 28000,
    originalDescription: `Facilitate agile processes and empower teams to deliver innovative solutions for the world's most ambitious smart city project.

Responsibilities:
- Facilitate Scrum ceremonies
- Remove team impediments
- Coach teams on agile practices
- Track team metrics
- Foster continuous improvement

Requirements:
- 3+ years as Scrum Master
- CSM or PSM certification
- Experience with agile tools (Jira)
- Strong facilitation and coaching skills
- Large-scale project experience preferred`,
    requiredSkills: ["Scrum", "Agile Methodologies", "Jira", "Team Facilitation", "Coaching", "Conflict Resolution", "Metrics Tracking"],
    status: "active" as const,
  },
  {
    employerIndex: 6, // Lean Technologies
    title: "QA Automation Engineer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 18000,
    salaryMax: 25000,
    originalDescription: `Build automated testing frameworks to ensure the quality and reliability of our financial technology platform.

Responsibilities:
- Develop automated test scripts
- Maintain test frameworks
- Execute test plans
- Report and track bugs
- Collaborate with development teams

Requirements:
- 3+ years of QA automation experience
- Strong knowledge of testing frameworks (Selenium, Cypress)
- Programming skills (JavaScript/Python)
- API testing experience
- Understanding of CI/CD`,
    requiredSkills: ["Test Automation", "Selenium", "Cypress", "JavaScript", "Python", "API Testing", "CI/CD", "Jest", "Git"],
    status: "active" as const,
  },
  {
    employerIndex: 5, // Elm
    title: "Technical Writer",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 15000,
    salaryMax: 21000,
    originalDescription: `Create clear, comprehensive technical documentation for our digital government services and APIs.

Responsibilities:
- Write technical documentation
- Create API documentation
- Develop user guides
- Maintain documentation portal
- Collaborate with engineers and product teams

Requirements:
- 3+ years of technical writing experience
- Strong writing skills in English and Arabic
- Experience with documentation tools
- Understanding of software development
- API documentation experience`,
    requiredSkills: ["Technical Writing", "API Documentation", "Markdown", "Documentation Tools", "English", "Arabic", "Communication"],
    status: "active" as const,
  },

  // Leadership Roles
  {
    employerIndex: 9, // Tamara
    title: "Engineering Manager",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 35000,
    salaryMax: 50000,
    originalDescription: `Lead and grow our engineering team while driving technical excellence and innovation in FinTech.

Responsibilities:
- Lead engineering team
- Drive technical strategy
- Manage hiring and development
- Ensure delivery excellence
- Collaborate with product and business

Requirements:
- 7+ years of software engineering experience
- 3+ years in leadership roles
- Strong technical background
- Experience scaling teams
- FinTech experience preferred`,
    requiredSkills: ["Engineering Leadership", "Technical Strategy", "Team Building", "Agile", "Architecture", "Mentoring", "Stakeholder Management", "FinTech"],
    status: "active" as const,
  },
  {
    employerIndex: 8, // Mrsool
    title: "Head of Product",
    location: "Riyadh, Saudi Arabia",
    workSetting: "hybrid" as const,
    employmentType: "full_time" as const,
    salaryMin: 38000,
    salaryMax: 55000,
    originalDescription: `Shape the product vision and strategy for Saudi Arabia's leading on-demand delivery platform.

Responsibilities:
- Define product vision and strategy
- Lead product team
- Drive product roadmap
- Analyze market and competition
- Collaborate with executive team

Requirements:
- 8+ years of product management experience
- 3+ years in leadership roles
- Proven track record of successful products
- Strong strategic thinking
- Marketplace or logistics experience preferred`,
    requiredSkills: ["Product Strategy", "Product Leadership", "Market Analysis", "Roadmapping", "Team Management", "Stakeholder Management", "Data-Driven Decision Making"],
    status: "active" as const,
  },

  // Remote Positions
  {
    employerIndex: 4, // Noon
    title: "Remote Full Stack Developer",
    location: "Remote (Saudi Arabia)",
    workSetting: "remote" as const,
    employmentType: "full_time" as const,
    salaryMin: 17000,
    salaryMax: 24000,
    originalDescription: `Work remotely while building features for one of the region's largest e-commerce platforms.

Responsibilities:
- Develop full-stack features
- Write clean code
- Participate in code reviews
- Collaborate with distributed team
- Deliver on sprint commitments

Requirements:
- 3+ years of full-stack development
- Strong React and Node.js skills
- Experience with remote work
- Self-motivated and organized
- Good communication skills`,
    requiredSkills: ["React", "Node.js", "TypeScript", "MongoDB", "REST APIs", "Git", "Remote Collaboration", "Time Management"],
    status: "active" as const,
  },

  // Contract/Freelance
  {
    employerIndex: 3, // Careem
    title: "Freelance Video Editor",
    location: "Remote",
    workSetting: "remote" as const,
    employmentType: "contract" as const,
    salaryMin: 8000,
    salaryMax: 15000,
    originalDescription: `Create engaging video content for marketing campaigns on a project basis.

Responsibilities:
- Edit marketing videos
- Add motion graphics
- Color grade footage
- Deliver final assets
- Meet project deadlines

Requirements:
- 2+ years of video editing experience
- Proficiency in Adobe Premiere and After Effects
- Portfolio of previous work
- Ability to work independently
- Arabic language skills preferred`,
    requiredSkills: ["Video Editing", "Adobe Premiere Pro", "After Effects", "Color Grading", "Motion Graphics", "Storytelling"],
    status: "active" as const,
  },
];

async function seedJobsAndEmployers() {
  console.log("🔍 Finding or creating system user for employers...");
  
  // Get the first admin user or create a system user
  let systemUser = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  let systemUserId: number;
  
  if (systemUser.length === 0) {
    console.log("⚠️  No admin user found. Creating system user for demo employers...");
    const [inserted] = await db.insert(users).values({
      openId: "system-demo-employer",
      name: "Demo Employer System",
      email: "demo-employers@oracle-recruitment.com",
      role: "admin",
    });
    systemUserId = inserted.insertId;
  } else {
    systemUserId = systemUser[0]!.id;
  }

  console.log(`✅ Using user ID ${systemUserId} for employers\n`);

  console.log("🌱 Seeding employers...");
  
  const insertedEmployers: number[] = [];
  for (const employer of sampleEmployers) {
    const [inserted] = await db.insert(employers).values({
      ...employer,
      userId: systemUserId,
    });
    insertedEmployers.push(inserted.insertId);
    console.log(`✅ Created employer: ${employer.companyName}`);
  }

  console.log("\n🌱 Seeding job postings...");
  
  for (const job of sampleJobs) {
    const { employerIndex, ...jobData } = job;
    const employerId = insertedEmployers[employerIndex];
    
    await db.insert(jobs).values({
      ...jobData,
      employerId,
    });
    
    console.log(`✅ Created job: ${job.title} at ${sampleEmployers[employerIndex]!.companyName}`);
  }

  console.log("\n✨ Jobs and employers seeding completed!");
  console.log(`📊 Created ${sampleEmployers.length} employers and ${sampleJobs.length} job postings`);
}

seedJobsAndEmployers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
