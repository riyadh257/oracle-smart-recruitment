# Oracle Smart Recruitment System - Architecture Documentation

**Version:** 1.0  
**Last Updated:** November 26, 2025  
**Author:** Manus AI

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability & Performance](#scalability--performance)
8. [Integration Points](#integration-points)
9. [Deployment Architecture](#deployment-architecture)

---

## System Overview

The **Oracle Smart Recruitment System** is a comprehensive, AI-powered applicant tracking system (ATS) designed to streamline and optimize the entire recruitment lifecycle. The system serves multiple stakeholders including HR managers, recruiters, interviewers, candidates, and company administrators.

### Key Capabilities

The system provides end-to-end recruitment management capabilities spanning candidate sourcing, application tracking, interview scheduling, assessment management, offer negotiation, and onboarding. It leverages artificial intelligence for intelligent candidate matching, automated screening, predictive analytics, and smart scheduling.

### Design Principles

The architecture follows modern web application best practices with a clear separation of concerns between frontend presentation, backend business logic, and data persistence layers. The system emphasizes type safety through TypeScript, real-time data synchronization via tRPC, and secure authentication through OAuth 2.0.

---

## Technology Stack

### Frontend

The client application is built with **React 19** using functional components and hooks for state management. **Tailwind CSS 4** provides utility-first styling with a custom design system, while **shadcn/ui** components ensure consistent, accessible UI patterns. **Wouter** handles client-side routing with minimal overhead.

### Backend

The server runs on **Express 4** with **tRPC 11** providing type-safe API contracts between client and server. **Drizzle ORM** manages database interactions with full TypeScript support. **SuperJSON** enables seamless serialization of complex data types including Dates and custom objects.

### Database

**MySQL/TiDB** serves as the primary relational database, chosen for its reliability, performance, and compatibility with cloud-native deployments. The schema supports complex relationships between candidates, jobs, applications, interviews, and analytics data.

### AI & ML Services

The system integrates with **Manus LLM API** for natural language processing tasks including resume parsing, question generation, and sentiment analysis. **Whisper API** provides speech-to-text transcription for video interview analysis.

### Infrastructure

**Node.js 22** provides the runtime environment with **pnpm** for efficient package management. **Vite** handles frontend build optimization with code splitting and lazy loading. **Vitest** powers the testing infrastructure for both unit and integration tests.

---

## Architecture Layers

### Presentation Layer

The presentation layer consists of React components organized into pages, layouts, and reusable UI components. Each page component connects to backend services through tRPC hooks (`useQuery`, `useMutation`) for data fetching and mutations. The layer implements responsive design patterns to support desktop, tablet, and mobile viewports.

### Business Logic Layer

The business logic layer resides in server-side services and tRPC routers. Services encapsulate domain logic for recruitment workflows, candidate evaluation, interview scheduling, and analytics generation. Routers expose type-safe procedures that validate inputs, enforce authorization, and orchestrate service calls.

### Data Access Layer

The data access layer uses Drizzle ORM to abstract database operations. Query helpers in `server/db.ts` provide reusable data access patterns for common operations. The layer supports transactions, complex joins, and optimized queries with proper indexing.

### Integration Layer

The integration layer manages connections to external services including calendar providers (Google Calendar, Outlook), communication channels (Email, SMS, WhatsApp), job boards (LinkedIn, Indeed), and AI services. Each integration implements retry logic, error handling, and rate limiting.

---

## Core Components

### Authentication & Authorization

The system uses **Manus OAuth** for user authentication with session-based authorization. JWT tokens secure API requests with automatic refresh. Role-based access control (RBAC) distinguishes between admin, HR manager, recruiter, interviewer, and candidate roles with fine-grained permissions.

### Candidate Management

The candidate management module tracks candidate profiles, resumes, applications, and engagement history. It supports bulk imports from CSV/Excel, automated profile enrichment from LinkedIn, and AI-powered skill extraction from resumes. Candidates can self-register or be added by recruiters.

### Job Management

The job management module enables companies to post jobs, manage job descriptions, and track application pipelines. It includes an AI-powered job description generator, customizable screening questions, and automated job board syndication. Jobs support multiple status states (draft, active, closed, archived).

### Application Tracking

The application tracking system (ATS) manages the complete application lifecycle from submission through offer acceptance. It implements a configurable pipeline with stages (submitted, screening, interview, offer, hired, rejected). Recruiters can move candidates between stages, add notes, and trigger automated workflows.

### Interview Scheduling

The smart scheduling module uses AI to suggest optimal interview times based on interviewer availability, candidate preferences, and historical patterns. It integrates with Google Calendar and Outlook for automatic calendar blocking and meeting link generation. Automated reminders reduce no-shows.

### Assessment & Evaluation

The assessment module provides structured evaluation forms, scoring rubrics, and interview question banks. AI generates role-specific interview questions and analyzes video interview transcripts for sentiment and key topics. Evaluations feed into candidate ranking algorithms.

### Communication Hub

The unified communication hub consolidates email, SMS, and WhatsApp messaging into a single interface. It tracks all candidate interactions, supports automated campaigns, and provides read receipts and engagement analytics. Email templates support multi-language translation.

### Analytics & Reporting

The analytics engine generates real-time dashboards for recruitment metrics including time-to-hire, cost-per-hire, source effectiveness, and diversity statistics. Predictive analytics forecast hiring needs and candidate success probability. Custom report builder supports ad-hoc analysis.

---

## Data Flow

### Candidate Application Flow

When a candidate applies for a job, the frontend submits application data through the `applications.create` tRPC procedure. The server validates inputs, creates database records for the application and candidate (if new), increments the job's application count, and triggers automated workflows such as confirmation emails and screening assessments. The application enters the pipeline at the "submitted" stage.

### Interview Scheduling Flow

Recruiters initiate interview scheduling through the `interviews.schedule` procedure, providing candidate ID, job ID, and interviewer IDs. The smart scheduling service queries interviewer availability from calendar integrations, generates time slot suggestions ranked by confidence score, and presents options to the recruiter. Upon confirmation, the system creates calendar events, sends invitations to all participants, and schedules automated reminders.

### AI Analysis Flow

For AI-powered features like resume parsing or video analysis, the frontend uploads files to S3 storage and passes the URL to backend services. The service downloads the file, calls the appropriate AI API (LLM for text, Whisper for audio), processes the response, stores structured results in the database, and returns insights to the frontend. Results are cached to avoid redundant API calls.

---

## Security Architecture

### Authentication Security

The system implements OAuth 2.0 authentication with Manus as the identity provider. Session cookies are HTTP-only, secure, and use SameSite=None for cross-origin requests. JWT tokens have short expiration times (1 hour) with automatic refresh. Failed login attempts trigger account lockout after 5 attempts.

### Authorization Security

Role-based access control enforces permissions at the procedure level. Protected procedures verify user roles before executing business logic. Admin-only operations check for the admin role explicitly. Database queries filter results based on user permissions to prevent unauthorized data access.

### Data Security

Sensitive data including resumes, personal information, and assessment results are encrypted at rest in S3 storage. Database connections use TLS encryption. API requests require HTTPS in production. The system implements CSRF protection, XSS prevention, and SQL injection safeguards through parameterized queries.

### Audit Logging

All security-relevant events including logins, permission changes, data exports, and admin actions are logged to the `security_alerts` table. Logs include timestamps, user IDs, IP addresses, and action details. Automated threat detection analyzes logs for suspicious patterns.

---

## Scalability & Performance

### Frontend Optimization

The frontend implements code splitting at the route level, lazy loading for heavy components, and image optimization with WebP format. Service workers cache static assets and API responses. Bundle size is minimized through tree shaking and dependency analysis.

### Backend Optimization

The backend uses connection pooling for database access, Redis caching for frequently accessed data, and query optimization with proper indexes. Rate limiting prevents API abuse. Long-running operations use background jobs with queue management.

### Database Optimization

The database schema includes indexes on foreign keys, frequently queried columns (email, status), and composite indexes for complex queries. Slow query logs identify optimization opportunities. Read replicas can be added for read-heavy workloads.

### Horizontal Scaling

The stateless backend design enables horizontal scaling behind a load balancer. Session data is stored in a shared Redis instance. File uploads go directly to S3 to avoid server storage. Database connection pooling adapts to instance count.

---

## Integration Points

### Calendar Integration

The system integrates with Google Calendar and Outlook via OAuth 2.0. It creates calendar events for interviews, updates events when rescheduled, and syncs interviewer availability every 15 minutes. Webhooks notify the system of external calendar changes.

### Email Integration

Email delivery uses the Manus built-in email service with SMTP fallback. The system tracks email opens via tracking pixels, link clicks, and bounces. Templates support HTML formatting, attachments, and multi-language content.

### Job Board Integration

The system can post jobs to LinkedIn, Indeed, and other job boards via their APIs. It syncs application data back to the ATS, tracks source effectiveness, and manages job board credentials securely.

### AI Service Integration

AI services are accessed through the Manus LLM API for text processing and Whisper API for audio transcription. The system implements retry logic with exponential backoff, timeout handling, and fallback to manual processing on failure.

---

## Deployment Architecture

### Development Environment

Developers run the full stack locally with `pnpm dev` for hot-reloading. A local MySQL instance or cloud database connection provides data persistence. Environment variables configure API keys and service endpoints.

### Staging Environment

The staging environment mirrors production configuration with separate database and API credentials. Automated deployments from the `develop` branch enable continuous integration testing. Staging data is anonymized production data.

### Production Environment

Production runs on cloud infrastructure with auto-scaling, load balancing, and multi-region deployment for high availability. Database backups run daily with point-in-time recovery. Monitoring alerts on error rates, response times, and resource utilization.

### CI/CD Pipeline

The CI/CD pipeline runs on GitHub Actions with stages for linting, type checking, unit tests, integration tests, and build verification. Successful builds on the `main` branch trigger automated deployment to staging, followed by manual promotion to production after smoke tests.

---

## Conclusion

The Oracle Smart Recruitment System architecture balances developer productivity, system performance, and operational reliability. The type-safe tRPC layer eliminates API contract mismatches, while the component-based frontend enables rapid feature development. The modular service layer supports independent testing and deployment of business logic. This architecture provides a solid foundation for scaling the system to handle thousands of concurrent users and millions of candidate records.

---

## References

- [React Documentation](https://react.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Manus Platform Documentation](https://docs.manus.im/)
