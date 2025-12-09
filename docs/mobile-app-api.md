# Oracle Smart Recruitment - Mobile API Documentation

**Version:** 1.0  
**Author:** Manus AI  
**Date:** December 3, 2025  
**Status:** Planning & Design Phase

---

## Executive Summary

This document provides complete API documentation for the Oracle Smart Recruitment mobile application. The API follows a type-safe tRPC architecture, ensuring end-to-end type safety between the mobile client and backend server. All endpoints are designed with mobile constraints in mind, optimizing payload sizes, supporting offline synchronization, and providing efficient data fetching strategies.

The API architecture emphasizes security through JWT-based authentication, rate limiting, and input validation. Response formats are optimized for mobile consumption with pagination, filtering, and field selection capabilities to minimize bandwidth usage and improve application performance.

---

## API Architecture

### Protocol & Transport

The Oracle Smart Recruitment API uses **tRPC** (TypeScript Remote Procedure Call) over HTTP/HTTPS, providing type-safe communication between the React Native mobile client and the Express backend server. tRPC eliminates the need for manual API contract maintenance by automatically generating TypeScript types from server procedure definitions.

**Key architectural characteristics:**

The API operates over standard HTTPS connections using JSON as the primary data format. However, tRPC enhances this foundation with **SuperJSON** serialization, enabling automatic handling of complex JavaScript types such as Date objects, undefined values, and BigInt numbers. This eliminates common serialization bugs that plague traditional REST APIs.

Request batching is automatically handled by the tRPC client, combining multiple procedure calls into a single HTTP request when possible. This significantly reduces network overhead for mobile clients, which often need to fetch multiple related resources simultaneously. For example, loading a job details screen might require fetching the job, related applications, and user bookmarks in a single batched request.

Real-time updates are delivered through a separate WebSocket connection using Socket.IO, providing bidirectional communication for features like live interview notifications and application status changes. The WebSocket connection automatically reconnects when network connectivity is restored, ensuring reliable real-time functionality even on unstable mobile networks.

### Base URL

**Production:** `https://api.oracle-recruitment.com`  
**Staging:** `https://staging-api.oracle-recruitment.com`  
**Development:** `http://localhost:3000`

All tRPC procedures are accessed through the `/api/trpc` endpoint. The tRPC client automatically handles URL construction and request formatting.

### Authentication

Authentication uses **JWT (JSON Web Tokens)** issued by the Manus OAuth 2.0 server. The mobile app obtains tokens through the OAuth authorization code flow with PKCE (Proof Key for Code Exchange) for enhanced security on mobile devices.

**Token Types:**

The authentication system uses two token types: access tokens and refresh tokens. Access tokens are short-lived (1 hour expiration) and included in the Authorization header of every API request. Refresh tokens are long-lived (30 days expiration) and stored securely in platform-specific secure storage (iOS Keychain, Android Keystore). When an access token expires, the mobile app automatically requests a new access token using the refresh token without requiring user re-authentication.

**Token Storage:**

Access tokens are stored in memory during app runtime and discarded when the app closes. Refresh tokens are persisted in secure storage and survive app restarts. This approach balances security (short-lived access tokens) with user experience (long-lived refresh tokens prevent frequent re-authentication).

**Authorization Header Format:**

```
Authorization: Bearer <access_token>
```

**Token Refresh Flow:**

When the mobile app receives a 401 Unauthorized response, it automatically attempts token refresh by calling the `auth.refreshToken` procedure with the stored refresh token. If refresh succeeds, the original request is retried with the new access token. If refresh fails (expired or invalid refresh token), the user is redirected to the login screen.

### Rate Limiting

To prevent abuse and ensure fair resource allocation, the API implements rate limiting based on user identity and IP address. Rate limits are enforced per user per endpoint, with different limits for different endpoint categories.

**Rate Limit Tiers:**

| Endpoint Category | Requests per Minute | Requests per Hour |
|-------------------|---------------------|-------------------|
| Authentication | 10 | 100 |
| Job Browsing | 60 | 1000 |
| Application Submission | 5 | 20 |
| Profile Updates | 30 | 200 |
| File Uploads | 10 | 50 |
| Search | 30 | 500 |

**Rate Limit Headers:**

API responses include rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1701619200
```

When rate limits are exceeded, the API returns a 429 Too Many Requests response with a `Retry-After` header indicating when the client can retry.

### Error Handling

The API uses standardized error responses following tRPC error conventions. All errors include a machine-readable error code and human-readable error message.

**Error Response Format:**

```typescript
interface TRPCError {
  code: string;
  message: string;
  data?: {
    code: string;
    httpStatus: number;
    path: string;
    stack?: string;
  };
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `FORBIDDEN` | 403 | User lacks permission for requested resource |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `BAD_REQUEST` | 400 | Invalid input parameters |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate application) |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |

**Error Handling Best Practices:**

Mobile clients should implement exponential backoff for retrying failed requests, starting with a 1-second delay and doubling on each retry up to a maximum of 32 seconds. Network errors (timeouts, connection failures) should be retried automatically, while client errors (400-499) should be presented to the user without automatic retry.

---

## Authentication Endpoints

### auth.login

Authenticates a user and returns JWT tokens.

**Procedure Type:** Mutation  
**Authentication Required:** No

**Input:**

```typescript
interface LoginInput {
  code: string;          // OAuth authorization code
  codeVerifier: string;  // PKCE code verifier
  redirectUri: string;   // OAuth redirect URI
}
```

**Output:**

```typescript
interface LoginOutput {
  accessToken: string;   // JWT access token (1 hour expiration)
  refreshToken: string;  // JWT refresh token (30 days expiration)
  expiresIn: number;     // Access token expiration in seconds
  user: {
    id: number;
    openId: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}
```

**Example Usage:**

```typescript
const result = await trpc.auth.login.mutate({
  code: 'oauth_authorization_code',
  codeVerifier: 'pkce_code_verifier',
  redirectUri: 'com.oracle.recruitment://oauth/callback'
});

// Store tokens securely
await SecureStore.setItemAsync('access_token', result.accessToken);
await SecureStore.setItemAsync('refresh_token', result.refreshToken);
```

**Error Cases:**

- `BAD_REQUEST`: Invalid authorization code or code verifier
- `UNAUTHORIZED`: OAuth authentication failed
- `INTERNAL_SERVER_ERROR`: Token generation failed

---

### auth.refreshToken

Refreshes an expired access token using a valid refresh token.

**Procedure Type:** Mutation  
**Authentication Required:** No (uses refresh token)

**Input:**

```typescript
interface RefreshTokenInput {
  refreshToken: string;  // Valid refresh token
}
```

**Output:**

```typescript
interface RefreshTokenOutput {
  accessToken: string;   // New JWT access token
  expiresIn: number;     // Access token expiration in seconds
}
```

**Example Usage:**

```typescript
const refreshToken = await SecureStore.getItemAsync('refresh_token');
const result = await trpc.auth.refreshToken.mutate({ refreshToken });

// Update stored access token
await SecureStore.setItemAsync('access_token', result.accessToken);
```

**Error Cases:**

- `UNAUTHORIZED`: Invalid or expired refresh token
- `INTERNAL_SERVER_ERROR`: Token generation failed

---

### auth.logout

Invalidates the current user session and revokes tokens.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:** None

**Output:**

```typescript
interface LogoutOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.auth.logout.mutate();

// Clear stored tokens
await SecureStore.deleteItemAsync('access_token');
await SecureStore.deleteItemAsync('refresh_token');
```

**Error Cases:**

- `UNAUTHORIZED`: No valid session to logout

---

### auth.me

Returns the currently authenticated user's information.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:** None

**Output:**

```typescript
interface MeOutput {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currentOrganizationId?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example Usage:**

```typescript
const user = await trpc.auth.me.useQuery();

if (user) {
  console.log(`Logged in as ${user.name}`);
}
```

**Error Cases:**

- `UNAUTHORIZED`: No valid authentication token

---

## Job Endpoints

### jobs.list

Returns a paginated list of job postings with optional filtering.

**Procedure Type:** Query  
**Authentication Required:** No (public endpoint)

**Input:**

```typescript
interface JobsListInput {
  page?: number;              // Page number (default: 1)
  limit?: number;             // Results per page (default: 20, max: 100)
  status?: 'open' | 'closed' | 'draft';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  location?: string;          // Filter by location
  department?: string;        // Filter by department
  sortBy?: 'createdAt' | 'title' | 'location';
  sortOrder?: 'asc' | 'desc';
}
```

**Output:**

```typescript
interface JobsListOutput {
  jobs: Array<{
    id: number;
    title: string;
    department?: string;
    location?: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    description: string;
    requirements: string;
    status: 'open' | 'closed' | 'draft';
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Usage:**

```typescript
const { data } = trpc.jobs.list.useQuery({
  page: 1,
  limit: 20,
  status: 'open',
  employmentType: 'full-time',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

console.log(`Found ${data.pagination.total} jobs`);
```

**Error Cases:**

- `BAD_REQUEST`: Invalid pagination parameters
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### jobs.search

Searches jobs by keyword with advanced filtering.

**Procedure Type:** Query  
**Authentication Required:** No (public endpoint)

**Input:**

```typescript
interface JobsSearchInput {
  query: string;              // Search query
  page?: number;
  limit?: number;
  filters?: {
    location?: string;
    employmentType?: Array<'full-time' | 'part-time' | 'contract' | 'internship'>;
    experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
    salaryMin?: number;
    salaryMax?: number;
    postedWithin?: 'day' | 'week' | 'month' | 'any';
    companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  };
}
```

**Output:**

```typescript
interface JobsSearchOutput {
  jobs: Array<{
    id: number;
    title: string;
    department?: string;
    location?: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
    description: string;
    requirements: string;
    status: 'open' | 'closed' | 'draft';
    relevanceScore: number;    // Search relevance score (0-1)
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Usage:**

```typescript
const { data } = trpc.jobs.search.useQuery({
  query: 'software engineer',
  page: 1,
  limit: 20,
  filters: {
    location: 'San Francisco',
    employmentType: ['full-time'],
    experienceLevel: 'mid',
    postedWithin: 'week'
  }
});
```

**Error Cases:**

- `BAD_REQUEST`: Empty search query or invalid filters
- `INTERNAL_SERVER_ERROR`: Search engine failure

---

### jobs.getById

Returns detailed information for a specific job.

**Procedure Type:** Query  
**Authentication Required:** No (public endpoint)

**Input:**

```typescript
interface JobGetByIdInput {
  id: number;  // Job ID
}
```

**Output:**

```typescript
interface JobGetByIdOutput {
  id: number;
  organizationId: number;
  title: string;
  department?: string;
  location?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string;
  status: 'open' | 'closed' | 'draft';
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  organization: {
    id: number;
    name: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
  };
  similarJobs: Array<{
    id: number;
    title: string;
    location?: string;
    employmentType: string;
  }>;
}
```

**Example Usage:**

```typescript
const { data } = trpc.jobs.getById.useQuery({ id: 123 });

if (data) {
  console.log(`Job: ${data.title} at ${data.organization.name}`);
}
```

**Error Cases:**

- `NOT_FOUND`: Job does not exist or is not accessible
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### jobs.bookmark

Bookmarks or unbookmarks a job for the authenticated user.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface JobBookmarkInput {
  jobId: number;
  bookmarked: boolean;  // true to bookmark, false to unbookmark
}
```

**Output:**

```typescript
interface JobBookmarkOutput {
  success: boolean;
  bookmarked: boolean;
}
```

**Example Usage:**

```typescript
// Bookmark a job
await trpc.jobs.bookmark.mutate({
  jobId: 123,
  bookmarked: true
});

// Unbookmark a job
await trpc.jobs.bookmark.mutate({
  jobId: 123,
  bookmarked: false
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `NOT_FOUND`: Job does not exist
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### jobs.getBookmarked

Returns all jobs bookmarked by the authenticated user.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface JobsGetBookmarkedInput {
  page?: number;
  limit?: number;
}
```

**Output:**

```typescript
interface JobsGetBookmarkedOutput {
  jobs: Array<{
    id: number;
    title: string;
    department?: string;
    location?: string;
    employmentType: string;
    description: string;
    bookmarkedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Usage:**

```typescript
const { data } = trpc.jobs.getBookmarked.useQuery({
  page: 1,
  limit: 20
});

console.log(`You have ${data.pagination.total} bookmarked jobs`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `INTERNAL_SERVER_ERROR`: Database query failed

---

## Application Endpoints

### applications.create

Submits a new job application.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ApplicationCreateInput {
  jobId: number;
  resumeUrl: string;         // S3 URL of uploaded resume
  resumeKey: string;         // S3 key for resume file
  coverLetter?: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  source?: string;           // Application source (e.g., 'mobile_app', 'referral')
  customAnswers?: Array<{    // Answers to custom screening questions
    questionId: number;
    answer: string;
  }>;
}
```

**Output:**

```typescript
interface ApplicationCreateOutput {
  id: number;
  jobId: number;
  status: 'new';
  referenceNumber: string;   // Unique application reference
  createdAt: Date;
}
```

**Example Usage:**

```typescript
// First, upload resume to S3
const resumeFile = await DocumentPicker.getDocumentAsync({
  type: 'application/pdf'
});

const formData = new FormData();
formData.append('file', resumeFile);

const uploadResult = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { url, key } = await uploadResult.json();

// Then submit application
const application = await trpc.applications.create.mutate({
  jobId: 123,
  resumeUrl: url,
  resumeKey: key,
  coverLetter: 'I am excited to apply...',
  phone: '+1234567890',
  source: 'mobile_app'
});

console.log(`Application submitted: ${application.referenceNumber}`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `NOT_FOUND`: Job does not exist or is closed
- `CONFLICT`: User has already applied to this job
- `BAD_REQUEST`: Invalid resume URL or missing required fields
- `INTERNAL_SERVER_ERROR`: Database insert failed

---

### applications.list

Returns all applications for the authenticated user.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface ApplicationsListInput {
  status?: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Output:**

```typescript
interface ApplicationsListOutput {
  applications: Array<{
    id: number;
    jobId: number;
    job: {
      id: number;
      title: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
    status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
    referenceNumber: string;
    createdAt: Date;
    updatedAt: Date;
    nextAction?: string;       // Suggested next action (e.g., "Interview scheduled for Dec 5")
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Usage:**

```typescript
const { data } = trpc.applications.list.useQuery({
  status: 'interview',
  page: 1,
  limit: 20,
  sortBy: 'updatedAt',
  sortOrder: 'desc'
});

console.log(`You have ${data.pagination.total} applications in interview stage`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid pagination or filter parameters
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### applications.getById

Returns detailed information for a specific application.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface ApplicationGetByIdInput {
  id: number;  // Application ID
}
```

**Output:**

```typescript
interface ApplicationGetByIdOutput {
  id: number;
  jobId: number;
  job: {
    id: number;
    title: string;
    description: string;
    organization: {
      name: string;
      logo?: string;
    };
  };
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  referenceNumber: string;
  resumeUrl: string;
  coverLetter?: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: Array<{
    status: string;
    timestamp: Date;
    note?: string;
  }>;
  interviews: Array<{
    id: number;
    scheduledAt: Date;
    type: string;
    status: string;
  }>;
  documents: Array<{
    id: number;
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
}
```

**Example Usage:**

```typescript
const { data } = trpc.applications.getById.useQuery({ id: 456 });

if (data) {
  console.log(`Application status: ${data.status}`);
  console.log(`Timeline: ${data.timeline.length} events`);
}
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Application belongs to different user
- `NOT_FOUND`: Application does not exist
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### applications.withdraw

Withdraws an active application.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ApplicationWithdrawInput {
  id: number;               // Application ID
  reason: 'accepted_other' | 'not_interested' | 'salary' | 'location' | 'other';
  details?: string;         // Additional details for 'other' reason
}
```

**Output:**

```typescript
interface ApplicationWithdrawOutput {
  success: boolean;
  status: 'withdrawn';
}
```

**Example Usage:**

```typescript
await trpc.applications.withdraw.mutate({
  id: 456,
  reason: 'accepted_other',
  details: 'Accepted offer from another company'
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Application belongs to different user
- `NOT_FOUND`: Application does not exist
- `CONFLICT`: Application already withdrawn or in final status
- `INTERNAL_SERVER_ERROR`: Database update failed

---

## Interview Endpoints

### interviews.list

Returns all interviews for the authenticated user.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface InterviewsListInput {
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  upcoming?: boolean;        // Filter for upcoming interviews only
  page?: number;
  limit?: number;
}
```

**Output:**

```typescript
interface InterviewsListOutput {
  interviews: Array<{
    id: number;
    jobId: number;
    job: {
      title: string;
      organization: {
        name: string;
        logo?: string;
      };
    };
    scheduledAt: Date;
    duration: number;
    type: 'phone' | 'video' | 'onsite' | 'technical';
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    meetingLink?: string;
    location?: string;
    interviewer: {
      name: string;
      title?: string;
      photo?: string;
    };
    countdownMinutes?: number;  // Minutes until interview (for upcoming interviews)
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example Usage:**

```typescript
const { data } = trpc.interviews.list.useQuery({
  upcoming: true,
  status: 'scheduled',
  page: 1,
  limit: 10
});

console.log(`You have ${data.pagination.total} upcoming interviews`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid filter parameters
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### interviews.getById

Returns detailed information for a specific interview.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface InterviewGetByIdInput {
  id: number;  // Interview ID
}
```

**Output:**

```typescript
interface InterviewGetByIdOutput {
  id: number;
  jobId: number;
  job: {
    id: number;
    title: string;
    description: string;
    organization: {
      name: string;
      logo?: string;
      website?: string;
    };
  };
  scheduledAt: Date;
  duration: number;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  meetingLink?: string;
  location?: string;
  interviewer: {
    name: string;
    title?: string;
    photo?: string;
    linkedinUrl?: string;
  };
  notes?: string;
  preparationMaterials: Array<{
    title: string;
    url: string;
    type: 'document' | 'video' | 'link';
  }>;
  rescheduleCount: number;
  canReschedule: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Example Usage:**

```typescript
const { data } = trpc.interviews.getById.useQuery({ id: 789 });

if (data) {
  console.log(`Interview with ${data.interviewer.name} at ${data.scheduledAt}`);
  console.log(`Can reschedule: ${data.canReschedule}`);
}
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Interview belongs to different user
- `NOT_FOUND`: Interview does not exist
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### interviews.reschedule

Reschedules an existing interview.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface InterviewRescheduleInput {
  id: number;               // Interview ID
  newScheduledAt: Date;     // New interview date/time
  reason: 'conflict' | 'emergency' | 'travel' | 'other';
  details?: string;
}
```

**Output:**

```typescript
interface InterviewRescheduleOutput {
  success: boolean;
  interview: {
    id: number;
    scheduledAt: Date;
    status: 'rescheduled';
  };
}
```

**Example Usage:**

```typescript
const newDate = new Date('2025-12-10T14:00:00Z');

await trpc.interviews.reschedule.mutate({
  id: 789,
  newScheduledAt: newDate,
  reason: 'conflict',
  details: 'Have a conflicting meeting'
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Interview belongs to different user or reschedule limit exceeded
- `NOT_FOUND`: Interview does not exist
- `BAD_REQUEST`: New date is in the past or within 24 hours
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### interviews.cancel

Cancels an interview.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface InterviewCancelInput {
  id: number;               // Interview ID
  reason: 'withdrew_application' | 'accepted_other' | 'not_available' | 'other';
  details?: string;
}
```

**Output:**

```typescript
interface InterviewCancelOutput {
  success: boolean;
  status: 'cancelled';
}
```

**Example Usage:**

```typescript
await trpc.interviews.cancel.mutate({
  id: 789,
  reason: 'accepted_other',
  details: 'Accepted another offer'
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Interview belongs to different user
- `NOT_FOUND`: Interview does not exist
- `CONFLICT`: Interview already completed or cancelled
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### interviews.submitFeedback

Submits post-interview feedback.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface InterviewSubmitFeedbackInput {
  id: number;               // Interview ID
  rating: number;           // 1-5 star rating
  feedback?: string;        // Optional text feedback
  wouldRecommend: boolean;  // Would recommend company to others
}
```

**Output:**

```typescript
interface InterviewSubmitFeedbackOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.interviews.submitFeedback.mutate({
  id: 789,
  rating: 5,
  feedback: 'Great interview experience, very professional',
  wouldRecommend: true
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Interview belongs to different user
- `NOT_FOUND`: Interview does not exist
- `BAD_REQUEST`: Invalid rating value
- `INTERNAL_SERVER_ERROR`: Database insert failed

---

## Profile Endpoints

### profile.get

Returns the authenticated user's complete profile.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:** None

**Output:**

```typescript
interface ProfileGetOutput {
  id: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  profilePhoto?: string;
  workExperience: Array<{
    id: number;
    company: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field: string;
    graduationDate: Date;
    gpa?: number;
  }>;
  skills: Array<{
    id: number;
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience?: number;
  }>;
  certifications: Array<{
    id: number;
    name: string;
    organization: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  languages: Array<{
    id: number;
    name: string;
    proficiency: 'native' | 'fluent' | 'conversational' | 'basic';
  }>;
  completeness: number;      // Profile completion percentage (0-100)
}
```

**Example Usage:**

```typescript
const { data: profile } = trpc.profile.get.useQuery();

if (profile) {
  console.log(`Profile ${profile.completeness}% complete`);
  console.log(`${profile.skills.length} skills listed`);
}
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### profile.update

Updates the authenticated user's profile information.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ProfileUpdateInput {
  name?: string;
  phone?: string;
  location?: string;
  currentTitle?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  profilePhoto?: string;     // S3 URL of uploaded photo
}
```

**Output:**

```typescript
interface ProfileUpdateOutput {
  success: boolean;
  completeness: number;
}
```

**Example Usage:**

```typescript
await trpc.profile.update.mutate({
  name: 'John Doe',
  currentTitle: 'Senior Software Engineer',
  location: 'San Francisco, CA',
  bio: 'Passionate about building scalable systems'
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid input format (e.g., invalid URL)
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### profile.uploadDocument

Uploads a document (resume, certificate, etc.) to the user's profile.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ProfileUploadDocumentInput {
  type: 'resume' | 'cover_letter' | 'certificate' | 'portfolio' | 'other';
  name: string;
  url: string;               // S3 URL of uploaded file
  key: string;               // S3 key for file
  mimeType: string;
  size: number;              // File size in bytes
  isPrimary?: boolean;       // Set as primary resume (for type='resume' only)
}
```

**Output:**

```typescript
interface ProfileUploadDocumentOutput {
  id: number;
  type: string;
  name: string;
  url: string;
  uploadedAt: Date;
}
```

**Example Usage:**

```typescript
// First upload file to S3
const file = await DocumentPicker.getDocumentAsync();
const formData = new FormData();
formData.append('file', file);

const uploadResult = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { url, key } = await uploadResult.json();

// Then save document reference
const document = await trpc.profile.uploadDocument.mutate({
  type: 'resume',
  name: 'My_Resume_2025.pdf',
  url: url,
  key: key,
  mimeType: 'application/pdf',
  size: file.size,
  isPrimary: true
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid document type or missing required fields
- `INTERNAL_SERVER_ERROR`: Database insert failed

---

### profile.deleteDocument

Deletes a document from the user's profile.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ProfileDeleteDocumentInput {
  id: number;  // Document ID
}
```

**Output:**

```typescript
interface ProfileDeleteDocumentOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.profile.deleteDocument.mutate({ id: 123 });
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Document belongs to different user
- `NOT_FOUND`: Document does not exist
- `INTERNAL_SERVER_ERROR`: Database delete failed

---

### profile.setPreferences

Updates the user's notification preferences.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface ProfileSetPreferencesInput {
  notifications: {
    push: {
      enabled: boolean;
      applicationUpdates: boolean;
      interviewScheduled: boolean;
      interviewReminders: boolean;
      jobMatches: boolean;
      recruiterMessages: boolean;
      documentRequests: boolean;
      offers: boolean;
    };
    email: {
      enabled: boolean;
      frequency: 'instant' | 'daily' | 'weekly';
      applicationUpdates: boolean;
      interviewScheduled: boolean;
      interviewReminders: boolean;
      jobMatches: boolean;
      recruiterMessages: boolean;
      documentRequests: boolean;
      offers: boolean;
    };
    sms: {
      enabled: boolean;
      interviewScheduled: boolean;
      interviewReminders: boolean;
      offers: boolean;
    };
  };
  quietHours?: {
    enabled: boolean;
    startTime: string;       // HH:MM format
    endTime: string;         // HH:MM format
    daysOfWeek: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>;  // 0=Sunday, 6=Saturday
    allowEmergency: boolean;
  };
}
```

**Output:**

```typescript
interface ProfileSetPreferencesOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.profile.setPreferences.mutate({
  notifications: {
    push: {
      enabled: true,
      applicationUpdates: true,
      interviewScheduled: true,
      interviewReminders: true,
      jobMatches: false,
      recruiterMessages: true,
      documentRequests: true,
      offers: true
    },
    email: {
      enabled: true,
      frequency: 'daily',
      applicationUpdates: true,
      interviewScheduled: true,
      interviewReminders: false,
      jobMatches: true,
      recruiterMessages: true,
      documentRequests: true,
      offers: true
    },
    sms: {
      enabled: true,
      interviewScheduled: true,
      interviewReminders: true,
      offers: true
    }
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    allowEmergency: true
  }
});
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid time format or days of week
- `INTERNAL_SERVER_ERROR`: Database update failed

---

## Notification Endpoints

### notifications.list

Returns notification history for the authenticated user.

**Procedure Type:** Query  
**Authentication Required:** Yes

**Input:**

```typescript
interface NotificationsListInput {
  category?: 'all' | 'applications' | 'interviews' | 'messages' | 'offers';
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}
```

**Output:**

```typescript
interface NotificationsListOutput {
  notifications: Array<{
    id: number;
    type: 'application_status' | 'interview_scheduled' | 'interview_reminder' | 'recruiter_message' | 'offer' | 'document_request';
    title: string;
    message: string;
    read: boolean;
    data?: Record<string, any>;  // Additional data for deep linking
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}
```

**Example Usage:**

```typescript
const { data } = trpc.notifications.list.useQuery({
  category: 'all',
  unreadOnly: false,
  page: 1,
  limit: 20
});

console.log(`You have ${data.unreadCount} unread notifications`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `BAD_REQUEST`: Invalid pagination parameters
- `INTERNAL_SERVER_ERROR`: Database query failed

---

### notifications.markRead

Marks a notification as read.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface NotificationMarkReadInput {
  id: number;  // Notification ID
}
```

**Output:**

```typescript
interface NotificationMarkReadOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.notifications.markRead.mutate({ id: 456 });
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Notification belongs to different user
- `NOT_FOUND`: Notification does not exist
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### notifications.markAllRead

Marks all notifications as read for the authenticated user.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:** None

**Output:**

```typescript
interface NotificationMarkAllReadOutput {
  success: boolean;
  count: number;  // Number of notifications marked as read
}
```

**Example Usage:**

```typescript
const result = await trpc.notifications.markAllRead.mutate();
console.log(`Marked ${result.count} notifications as read`);
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `INTERNAL_SERVER_ERROR`: Database update failed

---

### notifications.delete

Deletes a notification from the user's history.

**Procedure Type:** Mutation  
**Authentication Required:** Yes

**Input:**

```typescript
interface NotificationDeleteInput {
  id: number;  // Notification ID
}
```

**Output:**

```typescript
interface NotificationDeleteOutput {
  success: boolean;
}
```

**Example Usage:**

```typescript
await trpc.notifications.delete.mutate({ id: 456 });
```

**Error Cases:**

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: Notification belongs to different user
- `NOT_FOUND`: Notification does not exist
- `INTERNAL_SERVER_ERROR`: Database delete failed

---

## Real-Time Events (WebSocket)

### Connection

**Endpoint:** `wss://api.oracle-recruitment.com/socket.io`

**Authentication:**  
WebSocket connections are authenticated using the JWT access token passed as a query parameter:

```
wss://api.oracle-recruitment.com/socket.io?token=<access_token>
```

**Connection Example:**

```typescript
import io from 'socket.io-client';

const socket = io('wss://api.oracle-recruitment.com', {
  query: { token: accessToken },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity
});

socket.on('connect', () => {
  console.log('WebSocket connected');
});

socket.on('disconnect', () => {
  console.log('WebSocket disconnected');
});
```

---

### Events

#### application:statusChanged

Emitted when an application's status changes.

**Payload:**

```typescript
interface ApplicationStatusChangedEvent {
  applicationId: number;
  jobId: number;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
  message?: string;
}
```

**Example:**

```typescript
socket.on('application:statusChanged', (data) => {
  console.log(`Application ${data.applicationId} status changed to ${data.newStatus}`);
  // Update Redux state
  dispatch(updateApplicationStatus(data));
});
```

---

#### interview:scheduled

Emitted when a new interview is scheduled.

**Payload:**

```typescript
interface InterviewScheduledEvent {
  interviewId: number;
  applicationId: number;
  jobId: number;
  scheduledAt: Date;
  type: string;
  interviewer: {
    name: string;
    title?: string;
  };
  meetingLink?: string;
  timestamp: Date;
}
```

**Example:**

```typescript
socket.on('interview:scheduled', (data) => {
  console.log(`Interview scheduled for ${data.scheduledAt}`);
  // Update Redux state and show notification
  dispatch(addInterview(data));
  showNotification('Interview Scheduled', `Interview with ${data.interviewer.name}`);
});
```

---

#### interview:rescheduled

Emitted when an interview is rescheduled.

**Payload:**

```typescript
interface InterviewRescheduledEvent {
  interviewId: number;
  oldScheduledAt: Date;
  newScheduledAt: Date;
  reason?: string;
  timestamp: Date;
}
```

**Example:**

```typescript
socket.on('interview:rescheduled', (data) => {
  console.log(`Interview ${data.interviewId} rescheduled to ${data.newScheduledAt}`);
  dispatch(updateInterview(data));
});
```

---

#### interview:cancelled

Emitted when an interview is cancelled.

**Payload:**

```typescript
interface InterviewCancelledEvent {
  interviewId: number;
  reason?: string;
  timestamp: Date;
}
```

**Example:**

```typescript
socket.on('interview:cancelled', (data) => {
  console.log(`Interview ${data.interviewId} cancelled`);
  dispatch(cancelInterview(data));
});
```

---

#### recruiter:message

Emitted when a recruiter sends a message to the candidate.

**Payload:**

```typescript
interface RecruiterMessageEvent {
  messageId: number;
  applicationId: number;
  recruiter: {
    name: string;
    photo?: string;
  };
  message: string;
  timestamp: Date;
}
```

**Example:**

```typescript
socket.on('recruiter:message', (data) => {
  console.log(`New message from ${data.recruiter.name}`);
  dispatch(addMessage(data));
  showNotification('New Message', data.message);
});
```

---

#### offer:extended

Emitted when a job offer is extended to the candidate.

**Payload:**

```typescript
interface OfferExtendedEvent {
  offerId: number;
  applicationId: number;
  jobId: number;
  salary?: number;
  startDate?: Date;
  expiresAt: Date;
  timestamp: Date;
}
```

**Example:**

```typescript
socket.on('offer:extended', (data) => {
  console.log(`Offer extended for application ${data.applicationId}`);
  dispatch(addOffer(data));
  showNotification('Job Offer!', 'You have received a job offer');
});
```

---

## File Upload

### Upload Endpoint

**URL:** `POST /api/upload`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `multipart/form-data`

**Request:**

```typescript
const formData = new FormData();
formData.append('file', {
  uri: fileUri,
  type: mimeType,
  name: fileName
});

const response = await fetch('https://api.oracle-recruitment.com/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
```

**Response:**

```typescript
interface UploadResponse {
  url: string;       // Public S3 URL
  key: string;       // S3 object key
  size: number;      // File size in bytes
  mimeType: string;
}
```

**File Constraints:**

| File Type | Max Size | Allowed Extensions |
|-----------|----------|-------------------|
| Resume | 10 MB | .pdf, .doc, .docx |
| Profile Photo | 5 MB | .jpg, .jpeg, .png |
| Certificate | 10 MB | .pdf, .jpg, .jpeg, .png |
| Cover Letter | 5 MB | .pdf, .doc, .docx, .txt |
| Portfolio | 20 MB | .pdf, .zip |

**Error Responses:**

- `400 Bad Request`: File too large or invalid file type
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Upload failed

---

## Pagination

All list endpoints support cursor-based pagination for efficient data fetching.

**Pagination Parameters:**

```typescript
interface PaginationParams {
  page?: number;      // Page number (1-indexed)
  limit?: number;     // Results per page (default: 20, max: 100)
}
```

**Pagination Response:**

```typescript
interface PaginationInfo {
  page: number;       // Current page
  limit: number;      // Results per page
  total: number;      // Total number of results
  totalPages: number; // Total number of pages
  hasNext: boolean;   // Whether there are more pages
  hasPrev: boolean;   // Whether there are previous pages
}
```

**Example:**

```typescript
// Fetch first page
const page1 = await trpc.jobs.list.useQuery({ page: 1, limit: 20 });

// Fetch next page
if (page1.pagination.hasNext) {
  const page2 = await trpc.jobs.list.useQuery({ page: 2, limit: 20 });
}
```

---

## Offline Synchronization

The mobile app implements an offline-first architecture with automatic synchronization when connectivity is restored.

### Offline Queue

Actions performed offline are queued and synchronized when the app reconnects.

**Queued Action Structure:**

```typescript
interface QueuedAction {
  id: string;              // Unique action ID
  type: string;            // Action type (e.g., 'application.create')
  payload: any;            // Action payload
  timestamp: Date;         // When action was queued
  retryCount: number;      // Number of retry attempts
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}
```

**Synchronization Process:**

1. App detects network connectivity restored
2. Queued actions are processed in chronological order
3. Each action is sent to the API with optimistic locking
4. Successful actions are removed from the queue
5. Failed actions are retried with exponential backoff
6. User is notified of sync completion or failures

**Conflict Resolution:**

When offline changes conflict with server state, the app uses a "last write wins" strategy with user notification. For critical operations (e.g., application submission), the app prompts the user to resolve conflicts manually.

---

## Performance Optimization

### Response Caching

The mobile app caches API responses to reduce network requests and improve perceived performance.

**Cache Strategy:**

| Endpoint Category | Cache Duration | Invalidation Strategy |
|-------------------|----------------|----------------------|
| Job Listings | 5 minutes | Time-based + manual refresh |
| Job Details | 15 minutes | Time-based + status change |
| Applications | 1 minute | Real-time updates via WebSocket |
| Interviews | 1 minute | Real-time updates via WebSocket |
| Profile | 30 minutes | Immediate on update |
| Notifications | No cache | Real-time updates via WebSocket |

**Cache Implementation:**

```typescript
const { data, isLoading } = trpc.jobs.list.useQuery(
  { page: 1, limit: 20 },
  {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 30 * 60 * 1000,  // 30 minutes
  }
);
```

### Request Batching

The tRPC client automatically batches multiple requests into a single HTTP request when possible, reducing network overhead.

**Batching Example:**

```typescript
// These three queries are batched into a single HTTP request
const jobs = trpc.jobs.list.useQuery({ page: 1 });
const bookmarked = trpc.jobs.getBookmarked.useQuery();
const applications = trpc.applications.list.useQuery();
```

### Image Optimization

Images are automatically optimized for mobile devices:

- Profile photos resized to 200x200px
- Company logos resized to 100x100px
- Thumbnail generation for documents
- WebP format for supported devices
- Lazy loading for off-screen images

---

## Security Best Practices

### Token Security

**Access Token Storage:**  
Access tokens are stored in memory only and never persisted to disk. This prevents token theft if the device is compromised.

**Refresh Token Storage:**  
Refresh tokens are stored in platform-specific secure storage:
- **iOS:** Keychain Services with `kSecAttrAccessibleAfterFirstUnlock`
- **Android:** Android Keystore with hardware-backed encryption

**Token Rotation:**  
Refresh tokens are rotated on each use, invalidating the old token and issuing a new one. This limits the window of opportunity for token theft.

### API Security

**Certificate Pinning:**  
The mobile app implements SSL certificate pinning to prevent man-in-the-middle attacks. The app only trusts connections with the expected certificate.

**Request Signing:**  
Critical operations (e.g., application submission, offer acceptance) include a request signature to prevent tampering.

**Input Validation:**  
All user inputs are validated on both client and server to prevent injection attacks and malformed data.

### Data Protection

**Encryption at Rest:**  
Sensitive data cached locally is encrypted using platform encryption APIs before storage.

**Secure Communication:**  
All API communication uses TLS 1.3 with strong cipher suites. Older TLS versions are rejected.

**Data Minimization:**  
Only necessary data is cached locally. Sensitive information (e.g., salary data) is never persisted on the device.

---

## Conclusion

This API documentation provides comprehensive guidance for integrating the Oracle Smart Recruitment mobile application with the backend server. The tRPC-based architecture ensures type safety and reduces integration errors, while the offline-first design guarantees functionality even in low-connectivity environments.

Developers should refer to this document as the authoritative source for API contracts, authentication flows, and data models. For any clarifications or modifications, consult with the backend team to ensure consistency across all client applications.

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 3, 2025 | Manus AI | Initial API documentation |

**Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Backend Lead | _______________ | _______________ | _______________ |
| Mobile Lead | _______________ | _______________ | _______________ |
| Security Lead | _______________ | _______________ | _______________ |
