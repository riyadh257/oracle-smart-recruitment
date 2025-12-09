# Oracle Smart Recruitment System - Technical Architecture Presentation
## Content Outline

### Slide 1: Title Slide
- Title: Oracle Smart Recruitment System - Technical Architecture
- Subtitle: Comprehensive System Design & Implementation Overview
- Version 1.0

### Slide 2: System Overview & Vision
- AI-powered applicant tracking system serving HR managers, recruiters, interviewers, and candidates
- End-to-end recruitment lifecycle management from sourcing to onboarding
- Modern architecture with type-safe contracts, real-time synchronization, and OAuth 2.0 security
- Key capabilities: intelligent matching, automated screening, predictive analytics, smart scheduling

### Slide 3: Technology Stack Foundation
- Frontend: React 19 + Tailwind CSS 4 + shadcn/ui + Wouter routing
- Backend: Express 4 + tRPC 11 (type-safe APIs) + Drizzle ORM + SuperJSON
- Database: MySQL/TiDB for reliability and cloud-native compatibility
- AI Services: Manus LLM API (NLP) + Whisper API (speech-to-text)
- Infrastructure: Node.js 22 + pnpm + Vite + Vitest

### Slide 4: Four-Layer Architecture Design
- Presentation Layer: React components with tRPC hooks for data operations
- Business Logic Layer: Server-side services and tRPC routers with validation
- Data Access Layer: Drizzle ORM with query helpers and transaction support
- Integration Layer: External services (calendars, email, job boards, AI) with retry logic

### Slide 5: Database Schema Overview
- 157 tables organized into functional modules
- Core modules: Users, Candidates, Companies, Jobs, Applications
- Supporting modules: Communication, Analytics, Security, Integration
- Design principles: Normalization, strategic denormalization, soft deletes, audit timestamps

### Slide 6: Core Database Tables
- users: Authentication profiles with role-based access (admin, HR, recruiter, interviewer, candidate)
- candidates: Comprehensive profiles with skills, experience, education (JSON fields)
- companies: Hiring organizations with admin relationships
- jobs: Postings with requirements, screening questions, and pipeline tracking
- applications: Pipeline tracking through 9 status stages with scoring

### Slide 7: Recruitment Pipeline Tables
- interviews: Scheduling with interviewer IDs, meeting links, feedback, ratings
- jobAlerts: Candidate subscription system for matching opportunities
- Indexes: Optimized for filtering (status, email), chronological sorting (appliedAt), and joins (foreign keys)
- Composite indexes for complex queries (jobId + status)

### Slide 8: Authentication & Authorization Architecture
- Manus OAuth 2.0 with session-based authorization and JWT tokens (1-hour expiration)
- HTTP-only, secure cookies with SameSite=None for cross-origin requests
- Role-based access control (RBAC) at procedure level with fine-grained permissions
- Account lockout after 5 failed login attempts

### Slide 9: Security Architecture Layers
- Data Security: S3 encryption at rest, TLS for database connections, HTTPS in production
- Application Security: CSRF protection, XSS prevention, parameterized queries for SQL injection prevention
- Audit Logging: Security events logged to security_alerts table with timestamps, user IDs, IP addresses
- Automated threat detection analyzing logs for suspicious patterns

### Slide 10: Core Components - Candidate & Job Management
- Candidate Management: Profile tracking, bulk CSV/Excel imports, LinkedIn enrichment, AI skill extraction
- Job Management: AI-powered job description generator, customizable screening, automated job board syndication
- Application Tracking: Configurable pipeline with 9 stages, recruiter notes, automated workflows
- Status transitions: submitted → screening → interview → offer → hired/rejected

### Slide 11: Core Components - Interview & Assessment
- Smart Scheduling: AI suggests optimal times based on availability and historical patterns
- Calendar Integration: Google Calendar + Outlook with automatic blocking and meeting links
- Assessment Module: Structured evaluation forms, scoring rubrics, question banks
- AI Analysis: Role-specific question generation, video transcript sentiment analysis

### Slide 12: Communication Hub & Analytics
- Unified Communication: Email, SMS, WhatsApp in single interface with engagement tracking
- Multi-language email templates with read receipts and automated campaigns
- Real-time Analytics: Time-to-hire, cost-per-hire, source effectiveness, diversity statistics
- Predictive Analytics: Hiring needs forecasting and candidate success probability

### Slide 13: Data Flow - Application Submission
1. Frontend submits via applications.create tRPC procedure
2. Server validates inputs and creates database records
3. Job application count incremented automatically
4. Automated workflows triggered: confirmation emails, screening assessments
5. Application enters pipeline at "submitted" stage

### Slide 14: Data Flow - Interview Scheduling
1. Recruiter initiates via interviews.schedule procedure
2. Smart scheduling queries calendar integrations for availability
3. AI generates time slot suggestions with confidence scores
4. Upon confirmation: calendar events created, invitations sent
5. Automated reminders scheduled to reduce no-shows

### Slide 15: Data Flow - AI Analysis
1. Frontend uploads files to S3 storage
2. Backend service downloads file and calls AI API (LLM/Whisper)
3. Response processed and structured results stored in database
4. Insights returned to frontend with caching to avoid redundant calls
5. Results feed into candidate ranking and evaluation algorithms

### Slide 16: Scalability & Performance Optimization
- Frontend: Code splitting, lazy loading, WebP images, service worker caching
- Backend: Connection pooling, Redis caching, query optimization with indexes, rate limiting
- Database: Indexes on foreign keys and frequently queried columns, read replicas for read-heavy workloads
- Horizontal Scaling: Stateless design enables load balancing, shared Redis for sessions, S3 for file storage

### Slide 17: Integration Points
- Calendar: Google Calendar + Outlook via OAuth 2.0, 15-minute availability sync, webhook notifications
- Email: Manus built-in service with SMTP fallback, tracking pixels for opens/clicks/bounces
- Job Boards: LinkedIn, Indeed API integration with application sync and source tracking
- AI Services: Manus LLM API + Whisper API with retry logic, exponential backoff, manual fallback

### Slide 18: Deployment Architecture
- Development: Local stack with pnpm dev hot-reloading, local/cloud database
- Staging: Production mirror with separate credentials, automated deployments from develop branch
- Production: Cloud infrastructure with auto-scaling, load balancing, multi-region deployment
- CI/CD: GitHub Actions pipeline (lint → type check → test → build → deploy)

### Slide 19: Mobile Application Architecture
- Cross-platform: React Native 0.73+ for iOS and Android with single codebase
- Backend Integration: tRPC client connecting to existing backend with OAuth 2.0
- Push Notifications: Firebase Cloud Messaging (FCM) for status updates and interview reminders
- Video Conferencing: Deep links to native apps (Zoom, Teams, Meet) with WebView fallback

### Slide 20: Mobile App Core Features
- Authentication: OAuth login with biometric support (Face ID/Touch ID)
- Application Tracking: Real-time status updates with timeline visualization
- Interview Management: Countdown timers, one-tap join, calendar integration, rescheduling
- Document Management: Upload additional documents, offline viewing capability
- Push Notifications: Configurable preferences with 24h, 1h, 15min reminders

### Slide 21: Mobile App Technical Structure
- Navigation: React Navigation 6.x with Auth and App navigators
- State Management: React Query (TanStack Query) for server state synchronization
- UI Components: React Native Paper or NativeBase for consistent design
- Services: tRPC API client, FCM notifications, secure local storage
- Screens: Applications, Interviews, Documents, Settings with dedicated components

### Slide 22: Mobile Backend Extensions
- Device Registration: Store FCM tokens for push notifications (iOS/Android)
- Notification History: Query past notifications with pagination
- Real-time Updates: WebSocket connection for live application status changes
- Mobile-optimized APIs: Reduced payload sizes, efficient data synchronization

### Slide 23: System Benefits & Advantages
- Type Safety: tRPC eliminates API contract mismatches with end-to-end TypeScript
- Developer Productivity: Component-based frontend enables rapid feature development
- Operational Reliability: Modular service layer supports independent testing and deployment
- Scalability: Architecture handles thousands of concurrent users and millions of candidate records
- Security: Multi-layer security with OAuth 2.0, encryption, audit logging, threat detection

### Slide 24: Future Roadmap & Extensibility
- Enhanced AI: Advanced candidate matching algorithms, interview question generation improvements
- Integration Expansion: Additional job boards, ATS integrations, HRIS systems
- Analytics Evolution: Machine learning for hiring predictions, advanced reporting dashboards
- Mobile Features: Video interview recording, offline mode, advanced notifications
- Global Expansion: Multi-language support, regional compliance, localized workflows

### Slide 25: Conclusion & Contact
- Comprehensive architecture balancing productivity, performance, and reliability
- Modern technology stack with proven frameworks and best practices
- Scalable design ready for enterprise deployment
- Secure, compliant, and audit-ready from day one
- Contact information for technical inquiries and implementation support
