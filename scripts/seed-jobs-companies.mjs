import { drizzle } from "drizzle-orm/mysql2";
import { companies, jobPostings } from "../drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const sampleCompanies = [
  {
    name: "Saudi Aramco Digital",
    industry: "Energy & Technology",
    size: "10000+",
    location: "Dhahran, Saudi Arabia",
    description: "Leading the digital transformation of the energy sector with cutting-edge technology solutions",
    website: "https://aramco.com",
    logo: null,
  },
  {
    name: "NEOM Tech & Digital",
    industry: "Smart Cities & Technology",
    size: "1000-5000",
    location: "NEOM, Saudi Arabia",
    description: "Building the future of sustainable living through innovative technology and smart city solutions",
    website: "https://neom.com",
    logo: null,
  },
  {
    name: "STC - Saudi Telecom Company",
    industry: "Telecommunications",
    size: "5000-10000",
    location: "Riyadh, Saudi Arabia",
    description: "Leading digital enabler providing innovative ICT solutions and services across the region",
    website: "https://stc.com.sa",
    logo: null,
  },
  {
    name: "Careem (Uber)",
    industry: "Technology & Transportation",
    size: "1000-5000",
    location: "Riyadh, Saudi Arabia",
    description: "Super app platform revolutionizing mobility, delivery, and digital payments in the Middle East",
    website: "https://careem.com",
    logo: null,
  },
  {
    name: "Noon.com",
    industry: "E-commerce",
    size: "1000-5000",
    location: "Riyadh, Saudi Arabia",
    description: "Leading e-commerce platform delivering exceptional online shopping experiences",
    website: "https://noon.com",
    logo: null,
  },
  {
    name: "Elm Company",
    industry: "Digital Solutions",
    size: "500-1000",
    location: "Riyadh, Saudi Arabia",
    description: "Government digital services provider enabling digital transformation across public sectors",
    website: "https://elm.sa",
    logo: null,
  },
  {
    name: "Lean Technologies",
    industry: "FinTech",
    size: "100-500",
    location: "Riyadh, Saudi Arabia",
    description: "Open banking platform enabling seamless financial data connectivity and payments",
    website: "https://leantech.me",
    logo: null,
  },
  {
    name: "Jahez",
    industry: "Food Delivery",
    size: "500-1000",
    location: "Khobar, Saudi Arabia",
    description: "Leading food delivery platform connecting customers with restaurants across Saudi Arabia",
    website: "https://jahez.com",
    logo: null,
  },
  {
    name: "Mrsool",
    industry: "On-Demand Delivery",
    size: "500-1000",
    location: "Riyadh, Saudi Arabia",
    description: "On-demand delivery platform for anything, anywhere, anytime",
    website: "https://mrsool.co",
    logo: null,
  },
  {
    name: "Tamara",
    industry: "FinTech",
    size: "100-500",
    location: "Riyadh, Saudi Arabia",
    description: "Buy now, pay later platform transforming e-commerce payments in the region",
    website: "https://tamara.co",
    logo: null,
  },
];

const sampleJobs = [
  // Software Engineering
  {
    title: "Senior Full Stack Engineer",
    companyIndex: 3, // Careem
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Join our engineering team to build scalable microservices and modern web applications that serve millions of users across the Middle East.",
    responsibilities: "Design and develop full-stack features, mentor junior engineers, participate in architecture decisions, ensure code quality and best practices, collaborate with product and design teams",
    requirements: "5+ years of full-stack development experience, Strong proficiency in React and Node.js, Experience with microservices architecture, Knowledge of AWS or similar cloud platforms, Excellent problem-solving skills",
    skillsRequired: "React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Kubernetes, REST APIs, GraphQL, Git",
    salaryMin: 25000,
    salaryMax: 35000,
    currency: "SAR",
    benefits: "Health insurance, Annual bonus, Stock options, Flexible working hours, Professional development budget, Gym membership",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Frontend Developer",
    companyIndex: 4, // Noon
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Build beautiful, responsive, and performant user interfaces for our e-commerce platform serving millions of customers.",
    responsibilities: "Develop new user-facing features, Build reusable components and libraries, Optimize applications for maximum speed, Collaborate with designers and backend engineers, Write clean, maintainable code",
    requirements: "3+ years of frontend development experience, Expert knowledge of React and modern JavaScript, Experience with state management (Redux/MobX), Strong CSS and responsive design skills, Understanding of web performance optimization",
    skillsRequired: "React, JavaScript, TypeScript, CSS, HTML, Redux, Webpack, Jest, Responsive Design, UI/UX",
    salaryMin: 18000,
    salaryMax: 25000,
    currency: "SAR",
    benefits: "Health insurance, Annual bonus, Remote work options, Learning and development budget, Employee discounts",
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Backend Engineer - Python",
    companyIndex: 6, // Lean Technologies
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Build robust and scalable backend systems for our open banking platform, handling financial data with security and reliability.",
    responsibilities: "Design and implement RESTful APIs, Optimize database queries and performance, Implement security best practices, Write comprehensive tests, Collaborate with frontend and DevOps teams",
    requirements: "3+ years of Python development experience, Strong knowledge of Django or FastAPI, Experience with PostgreSQL and Redis, Understanding of API security and authentication, Familiarity with microservices architecture",
    skillsRequired: "Python, Django, FastAPI, PostgreSQL, Redis, Docker, REST APIs, OAuth, Unit Testing, Git",
    salaryMin: 20000,
    salaryMax: 28000,
    currency: "SAR",
    benefits: "Health insurance, Stock options, Flexible hours, Professional development, Modern office",
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Mobile App Developer - React Native",
    companyIndex: 7, // Jahez
    department: "Engineering",
    location: "Khobar, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Develop and maintain our mobile applications that connect thousands of restaurants with hungry customers.",
    responsibilities: "Build cross-platform mobile features, Optimize app performance, Integrate with backend APIs, Implement push notifications, Ensure smooth user experience across devices",
    requirements: "2+ years of React Native development, Strong JavaScript/TypeScript skills, Experience with mobile app deployment, Knowledge of native iOS/Android development, Understanding of mobile UI/UX patterns",
    skillsRequired: "React Native, JavaScript, TypeScript, iOS, Android, Firebase, API Integration, Mobile UI/UX, Git",
    salaryMin: 16000,
    salaryMax: 23000,
    currency: "SAR",
    benefits: "Health insurance, Meal allowance, Annual bonus, Flexible hours, Career growth opportunities",
    applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Data & AI
  {
    title: "Data Scientist",
    companyIndex: 0, // Aramco
    department: "Data & Analytics",
    location: "Dhahran, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Apply advanced analytics and machine learning to solve complex problems in the energy sector and drive data-driven decision making.",
    responsibilities: "Develop predictive models and algorithms, Analyze large datasets to extract insights, Build machine learning pipelines, Communicate findings to stakeholders, Collaborate with engineering teams",
    requirements: "5+ years of data science experience, Strong Python and ML libraries knowledge, Experience with big data technologies, PhD or Master's in related field preferred, Excellent analytical and communication skills",
    skillsRequired: "Python, Machine Learning, TensorFlow, Scikit-learn, SQL, Big Data, Statistics, Data Visualization, Jupyter, Git",
    salaryMin: 28000,
    salaryMax: 40000,
    currency: "SAR",
    benefits: "Competitive salary, Housing allowance, Health insurance, Annual bonus, Relocation assistance, Professional development",
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Machine Learning Engineer",
    companyIndex: 1, // NEOM
    department: "AI & Innovation",
    location: "NEOM, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Build and deploy AI systems that power smart city infrastructure and enhance quality of life for NEOM residents.",
    responsibilities: "Design ML systems and algorithms, Deploy models to production, Optimize model performance, Collaborate with data engineers, Stay current with AI research",
    requirements: "4+ years of ML engineering experience, Strong Python and deep learning frameworks, Experience with MLOps and model deployment, Knowledge of computer vision or NLP, Cloud platform experience (AWS/Azure/GCP)",
    skillsRequired: "Python, TensorFlow, PyTorch, MLOps, Docker, Kubernetes, AWS, Computer Vision, NLP, Git",
    salaryMin: 30000,
    salaryMax: 42000,
    currency: "SAR",
    benefits: "Relocation package, Housing, Health insurance, Stock options, Cutting-edge projects, International team",
    applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Cloud & DevOps
  {
    title: "DevOps Engineer",
    companyIndex: 2, // STC
    department: "Infrastructure",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Build and maintain CI/CD pipelines and cloud infrastructure to support our digital transformation initiatives.",
    responsibilities: "Manage cloud infrastructure, Build CI/CD pipelines, Automate deployment processes, Monitor system performance, Ensure security and compliance",
    requirements: "3+ years of DevOps experience, Strong AWS or Azure knowledge, Experience with Kubernetes and Docker, Proficiency in scripting (Python/Bash), Understanding of security best practices",
    skillsRequired: "AWS, Kubernetes, Docker, Terraform, CI/CD, Jenkins, Python, Bash, Monitoring, Git",
    salaryMin: 22000,
    salaryMax: 30000,
    currency: "SAR",
    benefits: "Health insurance, Annual bonus, Training budget, Flexible hours, Modern tools and infrastructure",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Cloud Solutions Architect",
    companyIndex: 5, // Elm
    department: "Cloud Services",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Design and implement cloud solutions for government digital services, ensuring scalability, security, and compliance.",
    responsibilities: "Design cloud architectures, Lead cloud migrations, Ensure security and compliance, Provide technical leadership, Collaborate with stakeholders",
    requirements: "6+ years of cloud architecture experience, AWS/Azure certifications, Experience with government projects, Strong security knowledge, Excellent communication skills",
    skillsRequired: "AWS, Azure, Cloud Architecture, Security, Compliance, Terraform, Kubernetes, Networking, DevOps, Leadership",
    salaryMin: 32000,
    salaryMax: 45000,
    currency: "SAR",
    benefits: "Competitive salary, Health insurance, Annual bonus, Professional certifications, Impactful projects",
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Cybersecurity
  {
    title: "Cybersecurity Engineer",
    companyIndex: 0, // Aramco
    department: "Security",
    location: "Dhahran, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Protect critical infrastructure and sensitive data from cyber threats through proactive security measures and incident response.",
    responsibilities: "Monitor security systems, Conduct vulnerability assessments, Respond to security incidents, Implement security controls, Provide security training",
    requirements: "3+ years of cybersecurity experience, Knowledge of security frameworks (NIST, ISO 27001), Experience with SIEM tools, Understanding of network security, Relevant certifications (CISSP, CEH) preferred",
    skillsRequired: "Network Security, Penetration Testing, SIEM, Incident Response, Cryptography, Security Auditing, Firewalls, IDS/IPS",
    salaryMin: 24000,
    salaryMax: 32000,
    currency: "SAR",
    benefits: "Competitive salary, Health insurance, Security certifications, Annual bonus, Career development",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Product & Design
  {
    title: "Product Manager",
    companyIndex: 9, // Tamara
    department: "Product",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Drive product strategy and execution for our buy-now-pay-later platform, shaping the future of e-commerce payments.",
    responsibilities: "Define product roadmap, Gather and prioritize requirements, Work with engineering and design, Analyze product metrics, Communicate with stakeholders",
    requirements: "5+ years of product management experience, FinTech or payments experience preferred, Strong analytical and communication skills, Experience with agile methodologies, Data-driven decision making",
    skillsRequired: "Product Management, Agile, User Research, Data Analysis, Stakeholder Management, Roadmapping, A/B Testing, SQL",
    salaryMin: 28000,
    salaryMax: 38000,
    currency: "SAR",
    benefits: "Stock options, Health insurance, Flexible hours, Learning budget, Fast-growing startup environment",
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "UI/UX Designer",
    companyIndex: 4, // Noon
    department: "Design",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Create delightful user experiences for millions of shoppers through thoughtful design and user research.",
    responsibilities: "Design user interfaces and experiences, Conduct user research, Create prototypes and wireframes, Collaborate with product and engineering, Maintain design systems",
    requirements: "3+ years of UI/UX design experience, Strong portfolio demonstrating design process, Proficiency in Figma and design tools, Understanding of user research methods, E-commerce experience preferred",
    skillsRequired: "UI Design, UX Research, Figma, Prototyping, User Testing, Design Systems, Wireframing, Adobe XD, Sketch",
    salaryMin: 18000,
    salaryMax: 26000,
    currency: "SAR",
    benefits: "Health insurance, Creative environment, Learning budget, Employee discounts, Modern design tools",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Marketing & Growth
  {
    title: "Digital Marketing Manager",
    companyIndex: 8, // Mrsool
    department: "Marketing",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Lead digital marketing strategies to drive user acquisition and engagement for our on-demand delivery platform.",
    responsibilities: "Develop marketing strategies, Manage digital campaigns, Analyze marketing performance, Lead marketing team, Optimize conversion funnels",
    requirements: "5+ years of digital marketing experience, Strong knowledge of SEO, SEM, and social media, Experience with marketing analytics tools, Proven track record of user growth, Arabic and English fluency",
    skillsRequired: "Digital Marketing, SEO, Google Ads, Social Media Marketing, Analytics, Content Marketing, Email Marketing, A/B Testing",
    salaryMin: 22000,
    salaryMax: 32000,
    currency: "SAR",
    benefits: "Health insurance, Performance bonus, Flexible hours, Creative freedom, Fast-paced environment",
    applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Business & Operations
  {
    title: "Business Analyst",
    companyIndex: 5, // Elm
    department: "Business Operations",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Analyze business processes and data to drive operational efficiency and inform strategic decisions.",
    responsibilities: "Gather business requirements, Analyze data and metrics, Create reports and dashboards, Identify process improvements, Collaborate with stakeholders",
    requirements: "3+ years of business analysis experience, Strong Excel and SQL skills, Experience with BI tools (Power BI/Tableau), Excellent analytical and communication skills, Government sector experience preferred",
    skillsRequired: "Business Analysis, SQL, Excel, Power BI, Data Analysis, Requirements Gathering, Process Improvement, Stakeholder Management",
    salaryMin: 16000,
    salaryMax: 23000,
    currency: "SAR",
    benefits: "Health insurance, Annual bonus, Professional development, Stable environment, Impactful work",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Operations Manager",
    companyIndex: 7, // Jahez
    department: "Operations",
    location: "Khobar, Saudi Arabia",
    type: "Full-time",
    level: "Senior",
    description: "Oversee daily operations and logistics to ensure seamless food delivery experiences for customers and restaurants.",
    responsibilities: "Manage operations team, Optimize delivery logistics, Monitor KPIs and performance, Resolve operational issues, Implement process improvements",
    requirements: "5+ years of operations management experience, Logistics or delivery experience preferred, Strong leadership and problem-solving skills, Data-driven approach, Excellent communication in Arabic and English",
    skillsRequired: "Operations Management, Logistics, Team Leadership, KPI Tracking, Process Optimization, Problem Solving, Data Analysis",
    salaryMin: 24000,
    salaryMax: 34000,
    currency: "SAR",
    benefits: "Health insurance, Performance bonus, Meal allowance, Leadership opportunities, Dynamic environment",
    applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Junior Positions
  {
    title: "Junior Software Engineer",
    companyIndex: 3, // Careem
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Entry-level",
    description: "Start your software engineering career with a leading tech company. Learn from experienced engineers and work on impactful projects.",
    responsibilities: "Write clean, maintainable code, Participate in code reviews, Learn best practices, Collaborate with team members, Contribute to feature development",
    requirements: "Bachelor's degree in Computer Science or related field, Strong programming fundamentals, Knowledge of JavaScript or Python, Passion for learning, Good communication skills",
    skillsRequired: "JavaScript, Python, Git, Problem Solving, Teamwork, Learning Agility",
    salaryMin: 12000,
    salaryMax: 16000,
    currency: "SAR",
    benefits: "Health insurance, Mentorship program, Learning budget, Career growth, Modern tech stack",
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Junior Data Analyst",
    companyIndex: 2, // STC
    department: "Data & Analytics",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Entry-level",
    description: "Join our data team to analyze telecom data and generate insights that drive business decisions.",
    responsibilities: "Analyze data and create reports, Build dashboards, Support senior analysts, Learn data tools and techniques, Present findings to stakeholders",
    requirements: "Bachelor's degree in Statistics, Mathematics, or related field, Basic SQL and Excel skills, Analytical mindset, Attention to detail, Eagerness to learn",
    skillsRequired: "SQL, Excel, Data Analysis, Power BI, Statistics, Reporting, Communication",
    salaryMin: 10000,
    salaryMax: 14000,
    currency: "SAR",
    benefits: "Health insurance, Training programs, Career progression, Stable company, Telecom benefits",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Specialized Roles
  {
    title: "Scrum Master",
    companyIndex: 1, // NEOM
    department: "Agile Delivery",
    location: "NEOM, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Facilitate agile processes and empower teams to deliver innovative solutions for the world's most ambitious smart city project.",
    responsibilities: "Facilitate Scrum ceremonies, Remove team impediments, Coach teams on agile practices, Track team metrics, Foster continuous improvement",
    requirements: "3+ years as Scrum Master, CSM or PSM certification, Experience with agile tools (Jira), Strong facilitation and coaching skills, Large-scale project experience preferred",
    skillsRequired: "Scrum, Agile Methodologies, Jira, Team Facilitation, Coaching, Conflict Resolution, Metrics Tracking",
    salaryMin: 20000,
    salaryMax: 28000,
    currency: "SAR",
    benefits: "Relocation package, Housing, Health insurance, Visionary projects, International exposure",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "QA Automation Engineer",
    companyIndex: 6, // Lean Technologies
    department: "Quality Assurance",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Build automated testing frameworks to ensure the quality and reliability of our financial technology platform.",
    responsibilities: "Develop automated test scripts, Maintain test frameworks, Execute test plans, Report and track bugs, Collaborate with development teams",
    requirements: "3+ years of QA automation experience, Strong knowledge of testing frameworks (Selenium, Cypress), Programming skills (JavaScript/Python), API testing experience, Understanding of CI/CD",
    skillsRequired: "Test Automation, Selenium, Cypress, JavaScript, Python, API Testing, CI/CD, Jest, Git",
    salaryMin: 18000,
    salaryMax: 25000,
    currency: "SAR",
    benefits: "Health insurance, Flexible hours, Learning budget, Modern testing tools, FinTech experience",
    applicationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Technical Writer",
    companyIndex: 5, // Elm
    department: "Documentation",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Mid-level",
    description: "Create clear, comprehensive technical documentation for our digital government services and APIs.",
    responsibilities: "Write technical documentation, Create API documentation, Develop user guides, Maintain documentation portal, Collaborate with engineers and product teams",
    requirements: "3+ years of technical writing experience, Strong writing skills in English and Arabic, Experience with documentation tools, Understanding of software development, API documentation experience",
    skillsRequired: "Technical Writing, API Documentation, Markdown, Documentation Tools, English, Arabic, Communication",
    salaryMin: 15000,
    salaryMax: 21000,
    currency: "SAR",
    benefits: "Health insurance, Flexible hours, Professional development, Stable environment, Bilingual work",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Leadership Roles
  {
    title: "Engineering Manager",
    companyIndex: 9, // Tamara
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Leadership",
    description: "Lead and grow our engineering team while driving technical excellence and innovation in FinTech.",
    responsibilities: "Lead engineering team, Drive technical strategy, Manage hiring and development, Ensure delivery excellence, Collaborate with product and business",
    requirements: "7+ years of software engineering experience, 3+ years in leadership roles, Strong technical background, Experience scaling teams, FinTech experience preferred",
    skillsRequired: "Engineering Leadership, Technical Strategy, Team Building, Agile, Architecture, Mentoring, Stakeholder Management, FinTech",
    salaryMin: 35000,
    salaryMax: 50000,
    currency: "SAR",
    benefits: "Stock options, Health insurance, Leadership development, Competitive salary, High-growth startup",
    applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
  {
    title: "Head of Product",
    companyIndex: 8, // Mrsool
    department: "Product",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    level: "Leadership",
    description: "Shape the product vision and strategy for Saudi Arabia's leading on-demand delivery platform.",
    responsibilities: "Define product vision and strategy, Lead product team, Drive product roadmap, Analyze market and competition, Collaborate with executive team",
    requirements: "8+ years of product management experience, 3+ years in leadership roles, Proven track record of successful products, Strong strategic thinking, Marketplace or logistics experience preferred",
    skillsRequired: "Product Strategy, Product Leadership, Market Analysis, Roadmapping, Team Management, Stakeholder Management, Data-Driven Decision Making",
    salaryMin: 38000,
    salaryMax: 55000,
    currency: "SAR",
    benefits: "Stock options, Health insurance, Executive compensation, Strategic impact, Fast-growing company",
    applicationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Remote Positions
  {
    title: "Remote Full Stack Developer",
    companyIndex: 4, // Noon
    department: "Engineering",
    location: "Remote (Saudi Arabia)",
    type: "Full-time",
    level: "Mid-level",
    description: "Work remotely while building features for one of the region's largest e-commerce platforms.",
    responsibilities: "Develop full-stack features, Write clean code, Participate in code reviews, Collaborate with distributed team, Deliver on sprint commitments",
    requirements: "3+ years of full-stack development, Strong React and Node.js skills, Experience with remote work, Self-motivated and organized, Good communication skills",
    skillsRequired: "React, Node.js, TypeScript, MongoDB, REST APIs, Git, Remote Collaboration, Time Management",
    salaryMin: 17000,
    salaryMax: 24000,
    currency: "SAR",
    benefits: "Remote work, Health insurance, Flexible hours, Home office setup, Learning budget",
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },

  // Contract/Freelance
  {
    title: "Freelance Video Editor",
    companyIndex: 3, // Careem
    department: "Marketing",
    location: "Remote",
    type: "Contract",
    level: "Mid-level",
    description: "Create engaging video content for marketing campaigns on a project basis.",
    responsibilities: "Edit marketing videos, Add motion graphics, Color grade footage, Deliver final assets, Meet project deadlines",
    requirements: "2+ years of video editing experience, Proficiency in Adobe Premiere and After Effects, Portfolio of previous work, Ability to work independently, Arabic language skills preferred",
    skillsRequired: "Video Editing, Adobe Premiere Pro, After Effects, Color Grading, Motion Graphics, Storytelling",
    salaryMin: 8000,
    salaryMax: 15000,
    currency: "SAR",
    benefits: "Flexible schedule, Project-based work, Creative freedom, Portfolio building",
    applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  },
];

async function seedJobsAndCompanies() {
  console.log("🌱 Seeding companies...");
  
  const insertedCompanies = [];
  for (const company of sampleCompanies) {
    const [inserted] = await db.insert(companies).values(company);
    insertedCompanies.push(inserted.insertId);
    console.log(`✅ Created company: ${company.name}`);
  }

  console.log("\n🌱 Seeding job postings...");
  
  for (const job of sampleJobs) {
    const { companyIndex, ...jobData } = job;
    const companyId = insertedCompanies[companyIndex];
    
    await db.insert(jobPostings).values({
      ...jobData,
      companyId,
      postedDate: new Date().toISOString(),
    });
    
    console.log(`✅ Created job: ${job.title} at ${sampleCompanies[companyIndex].name}`);
  }

  console.log("\n✨ Jobs and companies seeding completed!");
  console.log(`📊 Created ${sampleCompanies.length} companies and ${sampleJobs.length} job postings`);
}

seedJobsAndCompanies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
