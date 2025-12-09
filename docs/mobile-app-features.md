# Oracle Smart Recruitment - Mobile Application Feature Specifications

**Version:** 1.0  
**Author:** Manus AI  
**Date:** December 3, 2025  
**Status:** Planning & Design Phase

---

## Executive Summary

This document provides comprehensive specifications for all features in the Oracle Smart Recruitment mobile application. The mobile app is designed to serve two primary user groups: **candidates** seeking employment opportunities and **recruiters** managing the hiring process. Each feature is documented with detailed user flows, acceptance criteria, and technical requirements to guide development and ensure consistent implementation across iOS and Android platforms.

The feature set prioritizes mobile-first interactions, leveraging device capabilities such as camera access, push notifications, and biometric authentication to create a seamless recruitment experience. The specifications emphasize offline functionality, real-time updates, and intuitive navigation to maximize user engagement and application completion rates.

---

## User Personas

### Candidate Persona: Sarah Chen

**Demographics:**  
Sarah is a 28-year-old software engineer currently employed but actively seeking new opportunities. She commutes daily and prefers to browse jobs and manage applications during her commute using her smartphone.

**Goals:**  
- Quickly discover relevant job opportunities matching her skills
- Apply to positions with minimal friction, even while on the move
- Track application status and receive timely interview notifications
- Prepare for interviews using mobile-accessible resources
- Join video interviews directly from her phone when necessary

**Pain Points:**  
- Limited time to browse jobs on desktop during work hours
- Frustration with lengthy application forms on mobile devices
- Missing interview notifications due to email overload
- Difficulty rescheduling interviews through email chains
- Uncertainty about application status after submission

**Mobile Usage Patterns:**  
- Primarily uses mobile during commute (7-9 AM, 5-7 PM)
- Prefers push notifications over email for time-sensitive updates
- Expects instant feedback when performing actions
- Values offline access to previously viewed content
- Frequently switches between apps, requiring quick resume capability

### Recruiter Persona: Michael Rodriguez

**Demographics:**  
Michael is a 35-year-old senior recruiter managing multiple open positions across engineering and product teams. He travels frequently for conferences and on-site interviews, relying heavily on mobile devices to stay connected.

**Goals:**  
- Review candidate applications while traveling or between meetings
- Quickly respond to candidate inquiries and schedule interviews
- Monitor recruitment pipeline metrics on the go
- Receive immediate notifications for high-priority candidates
- Conduct preliminary phone screenings using mobile device

**Pain Points:**  
- Difficulty reviewing resumes on small screens
- Limited ability to collaborate with hiring managers while mobile
- Missing urgent candidate responses due to delayed email checks
- Inability to access full recruitment dashboard features on mobile
- Cumbersome process for scheduling interviews across time zones

**Mobile Usage Patterns:**  
- Uses mobile throughout the day for quick checks and responses
- Requires desktop for detailed candidate evaluations
- Expects real-time notifications for candidate actions
- Values quick access to candidate contact information
- Frequently needs to reschedule interviews on short notice

---

## Core Features

### 1. Authentication & Onboarding

#### Feature Overview

The authentication system provides secure, frictionless access to the mobile application using Manus OAuth 2.0 integration. The onboarding flow guides new users through profile setup and permission configuration, ensuring they can immediately begin using the app after initial login.

#### User Flow: First-Time Login

**Step 1: Welcome Screen**  
Upon first launch, users see a welcome screen highlighting key app benefits with prominent "Sign In" and "Create Account" buttons. The welcome screen includes a carousel of three slides showcasing job discovery, application tracking, and interview management capabilities.

**Step 2: Authentication**  
Tapping "Sign In" redirects to the Manus OAuth login page within an in-app browser. Users enter their credentials or use social login options (Google, LinkedIn, Microsoft). Upon successful authentication, the OAuth server returns a JWT token to the mobile app.

**Step 3: Permission Requests**  
The app sequentially requests necessary permissions with clear explanations:
- **Notifications:** "Receive instant updates about your applications and interviews"
- **Camera:** "Upload your resume and documents by taking photos"
- **Biometric:** "Use Face ID / fingerprint for quick, secure access"

**Step 4: Profile Setup**  
New candidates complete a brief profile setup:
- Upload profile photo (optional)
- Enter current job title and location
- Select job categories of interest (multi-select)
- Set notification preferences (email, push, SMS)

**Step 5: Tutorial**  
An optional interactive tutorial highlights key features:
- Swipe through job listings
- Tap to view job details
- Apply with one tap using saved profile
- Track applications in the Applications tab

#### User Flow: Returning User Login

**Biometric Authentication:**  
Returning users with biometric authentication enabled see a prompt: "Use Face ID to sign in" or "Use fingerprint to sign in." Successful biometric verification immediately grants access without requiring password entry.

**Manual Login:**  
Users without biometric authentication enter their email and password. The app remembers the email address for faster subsequent logins. A "Forgot Password?" link initiates the password reset flow.

**Session Persistence:**  
The app maintains user sessions for 30 days by default, requiring re-authentication only after session expiration or explicit logout. Background token refresh occurs automatically to prevent session interruption.

#### Acceptance Criteria

- [ ] Users can sign in using Manus OAuth credentials
- [ ] Social login options (Google, LinkedIn, Microsoft) function correctly
- [ ] Biometric authentication works on supported devices (iOS Face ID/Touch ID, Android fingerprint/face unlock)
- [ ] Permission requests include clear explanations for each permission
- [ ] Profile setup can be completed in under 2 minutes
- [ ] Tutorial can be skipped and accessed later from settings
- [ ] Session persists for 30 days without requiring re-login
- [ ] Automatic token refresh occurs before expiration
- [ ] Users can log out and clear all local data

#### Technical Requirements

- OAuth 2.0 implementation with PKCE flow for enhanced security
- Secure token storage using iOS Keychain and Android Keystore
- Biometric authentication using LocalAuthentication (iOS) and BiometricPrompt (Android)
- Automatic token refresh 5 minutes before expiration
- Session timeout after 30 days of inactivity
- Logout functionality clears all cached data and tokens

---

### 2. Job Discovery & Search

#### Feature Overview

The job discovery feature enables candidates to browse, search, and filter job opportunities tailored to their skills and preferences. The interface prioritizes mobile-optimized layouts with card-based designs and gesture-based interactions for efficient browsing.

#### User Flow: Browse Jobs

**Home Screen:**  
The Jobs tab displays a vertically scrolling feed of job cards. Each card shows:
- Job title (bold, 18pt font)
- Company name and logo
- Location (with distance if location services enabled)
- Employment type badge (Full-time, Part-time, Contract, Internship)
- Salary range (if provided)
- Posted date (e.g., "2 days ago")
- Quick action buttons: Bookmark, Share, Apply

**Infinite Scroll:**  
As users scroll, additional jobs load automatically. A loading indicator appears at the bottom while fetching new results. The app caches the first 100 jobs for offline browsing.

**Pull to Refresh:**  
Users can pull down from the top of the job list to refresh and fetch the latest postings. A refresh animation provides visual feedback during the update process.

**Job Card Interactions:**  
- **Tap:** Opens full job details screen
- **Swipe Right:** Bookmarks the job for later review
- **Swipe Left:** Dismisses the job from the feed
- **Long Press:** Opens context menu with Share, Report, and Hide options

#### User Flow: Search Jobs

**Search Bar:**  
Tapping the search icon in the header reveals a search bar with placeholder text: "Search by title, company, or keyword." The keyboard appears automatically with search-optimized layout.

**Search Suggestions:**  
As users type, the app displays search suggestions based on:
- Popular job titles
- Previously searched terms
- Trending keywords
- Company names

**Search Results:**  
Pressing "Search" displays results in the same card-based layout as the browse view. A header shows the search query and result count: "42 jobs found for 'software engineer'."

**Search Filters:**  
Tapping the filter icon opens a bottom sheet with filter options:
- **Location:** City, state, or remote
- **Employment Type:** Full-time, Part-time, Contract, Internship (multi-select)
- **Experience Level:** Entry, Mid, Senior, Executive
- **Salary Range:** Slider with min/max values
- **Posted Date:** Last 24 hours, Last week, Last month, Any time
- **Company Size:** 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+

**Active Filters:**  
Applied filters appear as chips below the search bar. Tapping a chip removes that filter. A "Clear All" button removes all active filters.

#### User Flow: Job Details

**Job Details Screen:**  
Tapping a job card opens a full-screen details view with:
- **Header Section:** Job title, company name, location, salary range
- **Quick Actions Bar:** Apply, Bookmark, Share buttons
- **Job Description:** Full job description with formatted text
- **Requirements:** Bulleted list of required skills and qualifications
- **Responsibilities:** Key responsibilities and duties
- **Benefits:** Company benefits and perks
- **About Company:** Company description and culture information
- **Similar Jobs:** Horizontal scrolling list of related positions

**Apply Button:**  
The "Apply" button remains fixed at the bottom of the screen, always visible regardless of scroll position. Tapping "Apply" initiates the application flow (see Application Management section).

**Bookmark Functionality:**  
Bookmarked jobs are saved to the "Saved Jobs" section accessible from the Jobs tab. The bookmark icon fills when active and outlines when inactive.

**Share Functionality:**  
The share button opens the native share sheet, allowing users to share the job via messaging apps, email, or social media. The shared content includes job title, company name, and a deep link to the job in the app.

#### Acceptance Criteria

- [ ] Job feed loads within 2 seconds on 4G connection
- [ ] Infinite scroll loads 20 jobs at a time
- [ ] Pull-to-refresh updates feed with latest jobs
- [ ] Search returns relevant results within 1 second
- [ ] Filters can be combined and applied simultaneously
- [ ] Active filters persist when navigating away and returning
- [ ] Bookmarked jobs sync across devices
- [ ] Job details screen displays all required information
- [ ] Apply button remains fixed at bottom of screen
- [ ] Share functionality works with all major messaging apps
- [ ] Offline mode displays previously viewed jobs

#### Technical Requirements

- Pagination with 20 jobs per page
- Search debouncing with 300ms delay
- Filter state managed in Redux with persistence
- Bookmark sync via tRPC API
- Deep linking support for shared jobs
- Offline caching of last 100 viewed jobs
- Image lazy loading for company logos
- Optimistic UI updates for bookmark actions

---

### 3. Application Management

#### Feature Overview

The application management system streamlines the job application process, enabling candidates to apply with minimal friction using pre-filled profile information. The feature tracks application status, provides real-time updates, and allows document uploads directly from the mobile device.

#### User Flow: Quick Apply

**Pre-Application Check:**  
When a candidate taps "Apply" on a job, the app first checks if they have a complete profile. If the profile is incomplete, a prompt appears: "Complete your profile to apply faster" with a "Complete Profile" button.

**Application Form:**  
For candidates with complete profiles, the application form appears with pre-filled information:
- Full name (from profile)
- Email address (from profile)
- Phone number (from profile)
- Current resume (from profile, with option to upload new)
- Cover letter (optional, with AI-generated template option)
- LinkedIn profile URL (from profile)
- Portfolio URL (from profile)

**Resume Upload:**  
Tapping the resume section opens a bottom sheet with options:
- **Use Saved Resume:** Select from previously uploaded resumes
- **Upload from Device:** Choose file from device storage
- **Take Photo:** Capture resume using camera
- **Scan Document:** Use document scanner for multi-page resumes

**Cover Letter:**  
The cover letter field includes an "AI Generate" button. Tapping this button uses the LLM integration to generate a customized cover letter based on the job description and candidate's profile. Candidates can edit the generated text before submission.

**Additional Questions:**  
Some jobs include custom screening questions. These appear below the standard fields with appropriate input types:
- Text input for short answers
- Text area for long answers
- Radio buttons for single-choice questions
- Checkboxes for multiple-choice questions
- Dropdowns for selection from predefined options

**Review & Submit:**  
Before submission, candidates review a summary of their application:
- Job title and company
- Resume file name and upload date
- Cover letter preview (first 100 characters)
- Answers to custom questions

**Submission Confirmation:**  
Upon successful submission, a confirmation screen appears with:
- Success animation (checkmark with celebration confetti)
- Confirmation message: "Application submitted successfully!"
- Application reference number
- Expected response time (e.g., "You'll hear back within 5 business days")
- "View Application" button to see application details
- "Apply to Similar Jobs" button to continue applying

#### User Flow: Track Applications

**Applications Tab:**  
The Applications tab displays all submitted applications in a list view. Each application card shows:
- Job title and company name
- Application status badge (New, Screening, Interview, Offer, Hired, Rejected)
- Submission date
- Last updated timestamp
- Next action (if applicable, e.g., "Interview scheduled for Dec 5")

**Status Filtering:**  
A segmented control at the top allows filtering by status:
- All (default)
- Active (New, Screening, Interview)
- Offers
- Archived (Hired, Rejected)

**Application Details:**  
Tapping an application card opens the full application details screen:
- **Status Timeline:** Visual timeline showing application progress through stages
- **Application Summary:** Submitted information (resume, cover letter, answers)
- **Activity Log:** Chronological log of all status changes and actions
- **Interviewer Notes:** Feedback from interviewers (if shared)
- **Documents:** All uploaded documents with download links
- **Actions:** Context-specific actions (e.g., "Schedule Interview," "Accept Offer," "Withdraw Application")

**Status Notifications:**  
When application status changes, candidates receive:
- Push notification with status update
- In-app notification badge on Applications tab
- Email notification (if enabled in preferences)
- SMS notification (if enabled and phone number verified)

#### User Flow: Withdraw Application

**Withdrawal Initiation:**  
From the application details screen, candidates can tap "Withdraw Application" in the actions menu. A confirmation dialog appears: "Are you sure you want to withdraw your application? This action cannot be undone."

**Withdrawal Reason:**  
After confirming, candidates select a withdrawal reason:
- Accepted another offer
- No longer interested in the position
- Salary doesn't meet expectations
- Location is not suitable
- Other (with text input for details)

**Withdrawal Confirmation:**  
The application status updates to "Withdrawn" and the recruiter receives a notification. The application remains visible in the candidate's history but is marked as withdrawn.

#### Acceptance Criteria

- [ ] Quick apply completes in under 60 seconds for users with complete profiles
- [ ] Resume upload supports PDF, DOC, DOCX formats up to 10MB
- [ ] AI-generated cover letters are relevant and personalized
- [ ] Application submission works offline with sync when online
- [ ] Status updates appear within 5 seconds of server change
- [ ] Application timeline accurately reflects all status changes
- [ ] Withdrawal process completes successfully and notifies recruiter
- [ ] Documents can be downloaded and viewed offline
- [ ] Application history persists across device changes
- [ ] Push notifications deliver reliably for status changes

#### Technical Requirements

- Form validation with real-time error feedback
- File upload with progress indicator and pause/resume capability
- LLM integration for cover letter generation
- Optimistic UI updates for application submission
- WebSocket connection for real-time status updates
- Offline queue for applications submitted without connectivity
- Document caching for offline viewing
- Push notification handling with deep linking to specific applications

---

### 4. Interview Management

#### Feature Overview

The interview management system centralizes all interview-related activities, including scheduling, rescheduling, preparation, and video interview participation. The feature integrates with device calendars and supports multiple video conferencing platforms for seamless interview experiences.

#### User Flow: View Scheduled Interviews

**Interviews Tab:**  
The Interviews tab displays upcoming and past interviews in a calendar view with two layout options:
- **List View:** Chronological list of interviews with date headers
- **Calendar View:** Monthly calendar with interview indicators on scheduled dates

**Interview Card:**  
Each interview card in list view shows:
- Interview date and time with timezone
- Job title and company name
- Interview type badge (Phone, Video, Onsite, Technical)
- Interviewer name and title
- Duration (e.g., "45 minutes")
- Location or video meeting link
- Countdown timer for upcoming interviews (e.g., "Starts in 2 hours")

**Calendar View:**  
In calendar view, dates with scheduled interviews display a colored dot. Tapping a date shows all interviews scheduled for that day in a bottom sheet.

**Today's Interviews:**  
A "Today" section at the top of the list view highlights interviews scheduled for the current day with prominent styling and countdown timers.

#### User Flow: Interview Details

**Interview Details Screen:**  
Tapping an interview card opens the full details screen:
- **Header:** Interview date, time, and countdown timer
- **Job Information:** Job title, company, and job description link
- **Interviewer Information:** Name, title, photo, and LinkedIn profile link
- **Interview Type:** Phone, Video, Onsite, or Technical with specific instructions
- **Location/Link:** Physical address with map for onsite, or "Join Video Interview" button for video
- **Preparation Materials:** Links to job description, company research, and common interview questions
- **Notes:** Text area for candidate to add personal notes and preparation points
- **Actions:** Reschedule, Add to Calendar, Share, Cancel

**Add to Calendar:**  
Tapping "Add to Calendar" opens the device's native calendar app with a pre-filled event:
- Event title: "Interview: [Job Title] at [Company]"
- Date and time from interview schedule
- Location or video link in event description
- 15-minute reminder before interview
- Notes section with interviewer information

**Join Video Interview:**  
For video interviews, a "Join Video Interview" button appears 15 minutes before the scheduled time. Tapping the button:
- Checks camera and microphone permissions
- Opens a pre-interview check screen to test audio/video
- Provides a "Join Now" button to enter the video room
- Displays waiting room if joining before interviewer

#### User Flow: Reschedule Interview

**Reschedule Initiation:**  
From the interview details screen, candidates tap "Reschedule Interview." A dialog explains the rescheduling policy: "You can reschedule up to 24 hours before the interview. Please select a new time from the available slots."

**Available Time Slots:**  
The app displays available time slots in a calendar picker:
- Current week and next two weeks visible
- Available slots highlighted in green
- Unavailable slots grayed out
- Selected slot highlighted in blue
- Timezone clearly indicated

**Reschedule Reason:**  
After selecting a new time, candidates provide a brief reason:
- Scheduling conflict
- Personal emergency
- Travel delay
- Other (with text input)

**Reschedule Confirmation:**  
Upon confirmation, the system:
- Updates the interview schedule
- Sends notification to recruiter and interviewer
- Sends updated calendar invitation to candidate
- Updates the interview card with new date/time
- Logs the reschedule in the activity history

**Reschedule Limits:**  
Candidates can reschedule each interview up to 2 times. After 2 reschedules, they must contact the recruiter directly. The app displays remaining reschedule attempts.

#### User Flow: Video Interview

**Pre-Interview Check:**  
15 minutes before the interview, a push notification prompts: "Your interview starts in 15 minutes. Test your camera and microphone." Tapping the notification opens the pre-interview check screen.

**Camera & Microphone Test:**  
The pre-interview check screen displays:
- Live camera preview showing candidate's video feed
- Audio level indicator showing microphone input
- "Switch Camera" button (front/back)
- "Test Speakers" button to play a test sound
- Network speed indicator (Good, Fair, Poor)
- "Continue" button to proceed to waiting room

**Waiting Room:**  
After passing the pre-interview check, candidates enter a waiting room:
- Message: "Waiting for [Interviewer Name] to start the interview"
- Countdown timer showing time until scheduled start
- Camera preview (can be toggled off)
- "Leave Waiting Room" button to exit

**Video Interview Room:**  
When the interviewer joins, the video interview begins:
- Full-screen video of interviewer
- Small picture-in-picture of candidate's video (draggable)
- Control bar at bottom: Mute, Video On/Off, Switch Camera, End Call
- Screen sharing button (for technical interviews)
- Chat button for text communication
- Recording indicator (if interview is being recorded)

**Post-Interview:**  
After the interview ends, candidates see a thank-you screen:
- "Thank you for interviewing with [Company]!"
- Prompt to provide feedback: "How was your interview experience?"
- 5-star rating for interview experience
- Optional text feedback
- "Return to Interviews" button

#### Acceptance Criteria

- [ ] Interview calendar syncs with device calendar
- [ ] Countdown timers update in real-time
- [ ] Video interview join button appears 15 minutes before scheduled time
- [ ] Pre-interview check successfully tests camera, microphone, and network
- [ ] Video quality adapts to network conditions
- [ ] Rescheduling works up to 24 hours before interview
- [ ] Rescheduled interviews send notifications to all participants
- [ ] Interview recordings are accessible after completion
- [ ] Post-interview feedback is submitted successfully
- [ ] Past interviews remain accessible in interview history

#### Technical Requirements

- Calendar integration using device calendar APIs
- Real-time countdown timers with minute precision
- Video conferencing SDK integration (Zoom, Teams, Google Meet)
- WebRTC for peer-to-peer video communication
- Network quality monitoring with adaptive bitrate
- Push notifications 24 hours, 1 hour, and 15 minutes before interviews
- Recording storage and playback via S3
- Feedback submission via tRPC API
- Interview history with pagination

---

### 5. Profile Management

#### Feature Overview

The profile management system allows candidates to maintain their professional information, upload documents, configure notification preferences, and manage account settings. A complete profile enables quick applications and improves visibility to recruiters.

#### User Flow: View Profile

**Profile Tab:**  
The Profile tab displays the candidate's profile in a scrollable view:
- **Header Section:** Profile photo, name, current job title, location
- **Profile Completion:** Progress bar showing profile completeness (e.g., "80% complete")
- **Quick Actions:** Edit Profile, View Resume, Settings
- **Profile Sections:**
  - Contact Information
  - Work Experience
  - Education
  - Skills
  - Certifications
  - Languages
  - Documents

**Profile Completeness:**  
The profile completion indicator encourages candidates to complete their profile:
- Green progress bar fills as sections are completed
- "Complete Profile" button links to incomplete sections
- Tooltip explains benefits: "Complete profiles get 3x more interview requests"

#### User Flow: Edit Profile

**Edit Profile Screen:**  
Tapping "Edit Profile" opens an editable form with all profile sections. Changes are saved automatically as users type (with debouncing to prevent excessive API calls).

**Profile Photo:**  
Tapping the profile photo opens options:
- Take Photo: Opens camera to capture new photo
- Choose from Library: Opens photo picker
- Remove Photo: Deletes current photo and reverts to initials avatar

**Contact Information:**  
- Full Name (required)
- Email (required, verified)
- Phone Number (optional, with verification)
- Location (city and state/country)
- LinkedIn URL (optional, validated format)
- Portfolio URL (optional, validated format)

**Work Experience:**  
Candidates can add multiple work experiences:
- Company Name (required)
- Job Title (required)
- Start Date (month/year picker)
- End Date (month/year picker, or "Present" checkbox)
- Description (rich text editor with formatting)
- "Add Experience" button to add more entries
- Drag handles to reorder experiences

**Education:**  
Candidates can add multiple education entries:
- Institution Name (required)
- Degree (dropdown: Bachelor's, Master's, PhD, etc.)
- Field of Study (required)
- Graduation Date (month/year picker)
- GPA (optional)
- "Add Education" button to add more entries

**Skills:**  
- Skill tags with autocomplete suggestions
- Proficiency level (Beginner, Intermediate, Advanced, Expert)
- Years of experience with each skill
- "Add Skill" button to add more skills
- Remove skill by tapping X on skill tag

**Certifications:**  
- Certification Name (required)
- Issuing Organization (required)
- Issue Date (month/year picker)
- Expiration Date (optional, month/year picker)
- Credential ID (optional)
- Credential URL (optional)
- "Add Certification" button

**Languages:**  
- Language name (autocomplete from common languages)
- Proficiency level (Native, Fluent, Conversational, Basic)
- "Add Language" button

#### User Flow: Document Management

**Documents Section:**  
The Documents section displays all uploaded documents:
- Resume (primary resume highlighted)
- Cover Letters (multiple versions)
- Certifications
- Portfolio Samples
- Other Documents

**Upload Document:**  
Tapping "Upload Document" opens options:
- Choose from Device: Opens file picker
- Take Photo: Opens camera for document scanning
- Scan Document: Opens document scanner for multi-page PDFs

**Document Details:**  
Each document shows:
- File name
- File type icon (PDF, DOC, DOCX)
- File size
- Upload date
- Actions: View, Download, Set as Primary (for resumes), Delete

**Set Primary Resume:**  
Candidates can have multiple resumes but must designate one as primary. The primary resume is used for quick applications. Tapping "Set as Primary" on a resume makes it the default.

#### User Flow: Notification Preferences

**Notification Settings:**  
The Settings screen includes a Notification Preferences section:
- **Push Notifications:** Master toggle for all push notifications
- **Email Notifications:** Master toggle for all email notifications
- **SMS Notifications:** Master toggle for all SMS notifications (requires verified phone)

**Notification Types:**  
Granular controls for specific notification types:
- Application Status Updates (push, email, SMS)
- Interview Scheduled (push, email, SMS)
- Interview Reminders (push, email, SMS)
- New Job Matches (push, email)
- Recruiter Messages (push, email, SMS)
- Document Requests (push, email)
- Offer Notifications (push, email, SMS)

**Notification Frequency:**  
- Instant: Receive notifications immediately
- Daily Digest: Receive one summary email per day
- Weekly Digest: Receive one summary email per week
- Off: No notifications for this type

**Quiet Hours:**  
Candidates can set quiet hours to prevent notifications during specific times:
- Start Time (time picker)
- End Time (time picker)
- Days of Week (multi-select: Mon-Sun)
- Emergency Override: Allow high-priority notifications during quiet hours

#### Acceptance Criteria

- [ ] Profile changes save automatically within 2 seconds
- [ ] Profile completion percentage updates in real-time
- [ ] Profile photo upload supports JPEG and PNG up to 5MB
- [ ] Work experience and education entries can be reordered by dragging
- [ ] Skills autocomplete suggests relevant skills based on input
- [ ] Document upload supports PDF, DOC, DOCX up to 10MB
- [ ] Primary resume designation works correctly
- [ ] Notification preferences apply immediately
- [ ] Quiet hours prevent notifications during specified times
- [ ] Profile data syncs across devices

#### Technical Requirements

- Auto-save with debouncing (500ms delay)
- Image upload with automatic resizing and compression
- Rich text editor for work experience descriptions
- Drag-and-drop reordering with React Native Draggable
- Autocomplete using tRPC query with debouncing
- File upload with progress tracking
- Notification preferences stored in Redux and synced via API
- Quiet hours enforcement in push notification handler

---

### 6. Notifications & Alerts

#### Feature Overview

The notification system keeps candidates informed about application status changes, interview schedules, and recruiter messages through push notifications, in-app notifications, email, and SMS. The system prioritizes important notifications and respects user preferences to avoid notification fatigue.

#### User Flow: Receive Push Notification

**Notification Delivery:**  
When a notification event occurs (e.g., interview scheduled), the backend sends a push notification via Firebase Cloud Messaging. The notification appears differently based on app state:

**App in Foreground:**  
- In-app banner appears at top of screen for 5 seconds
- Banner shows notification icon, title, and message
- Tapping banner navigates to relevant screen
- Banner dismisses automatically or by swiping up

**App in Background:**  
- System notification appears in notification tray
- Notification shows app icon, title, message, and timestamp
- Tapping notification launches app and navigates to relevant screen
- Notification badge appears on app icon showing unread count

**App Closed:**  
- System notification appears in notification tray
- Tapping notification launches app and navigates to relevant screen
- Notification remains in tray until dismissed or tapped

**Notification Actions:**  
High-priority notifications include action buttons:
- Interview Reminder: "View Details," "Reschedule"
- Application Status: "View Application," "Withdraw"
- Recruiter Message: "Reply," "View Profile"
- Offer Notification: "View Offer," "Accept"

#### User Flow: Notification Center

**In-App Notifications:**  
Tapping the bell icon in the app header opens the Notification Center:
- List of all notifications sorted by date (newest first)
- Unread notifications highlighted with blue dot
- Notification categories: All, Applications, Interviews, Messages, Offers
- "Mark All as Read" button at top
- Pull-to-refresh to fetch latest notifications

**Notification Items:**  
Each notification shows:
- Icon representing notification type
- Notification title (bold)
- Notification message
- Timestamp (e.g., "2 hours ago")
- Read/unread indicator (blue dot for unread)

**Notification Actions:**  
Tapping a notification:
- Marks it as read
- Navigates to relevant screen (application details, interview details, etc.)
- Closes the Notification Center

**Swipe Actions:**  
Swiping left on a notification reveals actions:
- Mark as Read/Unread
- Delete
- Snooze (reappears in 1 hour, 3 hours, or tomorrow)

#### User Flow: Email Notifications

**Email Delivery:**  
Email notifications are sent to the candidate's registered email address. Email content includes:
- Personalized greeting with candidate's name
- Clear subject line indicating notification type
- Formatted email body with key information
- Call-to-action button linking to relevant screen in app
- Footer with unsubscribe link and notification preferences link

**Email Templates:**  
Different email templates for each notification type:
- Application Submitted: Confirmation with application reference number
- Application Status Changed: Status update with next steps
- Interview Scheduled: Interview details with calendar attachment
- Interview Reminder: Reminder with join link and preparation tips
- Recruiter Message: Message preview with reply link
- Offer Extended: Offer details with acceptance deadline

**Email Frequency:**  
Based on user preferences:
- Instant: Emails sent immediately when event occurs
- Daily Digest: Single email at 9 AM with all notifications from previous 24 hours
- Weekly Digest: Single email every Monday at 9 AM with all notifications from previous week

#### User Flow: SMS Notifications

**SMS Delivery:**  
SMS notifications are sent to verified phone numbers for high-priority events:
- Interview scheduled within 24 hours
- Interview reminder 1 hour before start
- Application status changed to Offer or Rejected
- Recruiter urgent message

**SMS Content:**  
SMS messages are concise due to character limits:
- "Interview scheduled for Dec 5 at 2 PM with TechCorp. View details: [link]"
- "Your application for Software Engineer at TechCorp has been updated to Interview stage. View: [link]"
- "Reminder: Your interview starts in 1 hour. Join now: [link]"

**SMS Opt-Out:**  
Each SMS includes opt-out instructions: "Reply STOP to unsubscribe." Candidates can also disable SMS notifications in app settings.

#### Acceptance Criteria

- [ ] Push notifications deliver within 5 seconds of event
- [ ] Notification actions navigate to correct screens
- [ ] Notification badge count updates accurately
- [ ] In-app notification center displays all notifications
- [ ] Swipe actions work correctly (mark read, delete, snooze)
- [ ] Email notifications respect frequency preferences
- [ ] Email templates render correctly across email clients
- [ ] SMS notifications deliver to verified phone numbers only
- [ ] Quiet hours prevent notifications during specified times
- [ ] Notification preferences sync across devices

#### Technical Requirements

- Firebase Cloud Messaging for push notification delivery
- Local notification scheduling for reminders
- Deep linking for notification tap navigation
- Notification badge management using native APIs
- Email delivery via SendGrid or AWS SES
- SMS delivery via Twilio
- Notification history stored in local database
- Notification preferences synced via tRPC API
- Quiet hours enforcement in notification handler

---

## Recruiter Features

### 7. Candidate Review (Recruiter)

#### Feature Overview

Recruiters can review candidate applications, view resumes, screen candidates, and move them through the recruitment pipeline directly from the mobile app. The feature prioritizes quick decision-making with streamlined interfaces optimized for mobile screens.

#### User Flow: Review Applications

**Applications Dashboard:**  
Recruiters see a dashboard with key metrics:
- Total applications this week
- Applications pending review
- Interviews scheduled this week
- Offers extended this month

**Application List:**  
Below the dashboard, a list of applications sorted by date:
- Candidate name and photo
- Job title applied for
- Application date
- Current status badge
- Quick actions: View, Screen, Schedule Interview, Reject

**Filter & Sort:**  
Recruiters can filter applications by:
- Job position
- Application status
- Date range
- Source (job board, referral, direct)

Sort options:
- Date (newest first, oldest first)
- Name (A-Z, Z-A)
- Status

#### User Flow: View Candidate Profile

**Candidate Profile Screen:**  
Tapping an application opens the candidate profile:
- **Header:** Photo, name, current title, location
- **Quick Actions:** Schedule Interview, Send Message, Reject, Move to Next Stage
- **Application Summary:** Applied position, date, source
- **Resume:** Embedded PDF viewer or "Download Resume" button
- **AI Screening Results:** Overall score, skills match, experience match, strengths, weaknesses
- **Work Experience:** Timeline of previous positions
- **Education:** Degrees and institutions
- **Skills:** Skill tags with proficiency levels
- **Application Answers:** Responses to custom screening questions
- **Activity Log:** All interactions and status changes

**Resume Viewer:**  
Embedded PDF viewer with:
- Zoom controls
- Page navigation for multi-page resumes
- Download button to save locally
- Share button to forward to hiring managers

**AI Screening Results:**  
AI-generated screening summary shows:
- Overall score (0-100)
- Skills match percentage with breakdown
- Experience match percentage with analysis
- Education match assessment
- Key strengths (bulleted list)
- Potential concerns (bulleted list)
- Recommendation (Strong Yes, Yes, Maybe, No, Strong No)

#### User Flow: Move Candidate Through Pipeline

**Status Change:**  
From the candidate profile, recruiters tap "Move to Next Stage" to advance the candidate:
- Current status displayed (e.g., "Screening")
- Next stage options: Interview, Offer, Hired
- Optional note field for internal comments
- "Confirm" button to apply change

**Status Change Confirmation:**  
After confirmation:
- Candidate status updates immediately
- Candidate receives notification of status change
- Activity log records the change with timestamp and recruiter name
- Analytics dashboard updates with new metrics

**Bulk Actions:**  
From the application list, recruiters can select multiple candidates:
- Checkboxes appear on each application card
- "Select All" option at top
- Bulk action bar appears at bottom: Move to Stage, Reject, Export

#### Acceptance Criteria

- [ ] Application dashboard loads within 2 seconds
- [ ] Metrics update in real-time as actions are performed
- [ ] Resume viewer displays PDFs correctly on all screen sizes
- [ ] AI screening results are accurate and helpful
- [ ] Status changes apply immediately with optimistic updates
- [ ] Candidates receive notifications within 5 seconds of status change
- [ ] Bulk actions work correctly for up to 50 selected candidates
- [ ] Activity log records all actions with correct timestamps
- [ ] Filters and sorting apply correctly to application list
- [ ] Offline mode allows viewing previously loaded candidates

#### Technical Requirements

- Dashboard metrics calculated via tRPC aggregation queries
- PDF rendering using react-native-pdf library
- AI screening results fetched from backend LLM integration
- Optimistic UI updates for status changes
- WebSocket connection for real-time metric updates
- Bulk action processing with progress indicator
- Activity log stored in database with full audit trail
- Offline caching of recently viewed candidates

---

### 8. Interview Scheduling (Recruiter)

#### Feature Overview

Recruiters can schedule, reschedule, and manage interviews directly from the mobile app. The feature integrates with calendar systems and automatically generates video meeting links when needed.

#### User Flow: Schedule Interview

**Schedule Interview Initiation:**  
From the candidate profile, recruiters tap "Schedule Interview." The scheduling form appears:
- **Candidate:** Pre-filled with candidate name
- **Job Position:** Pre-filled with applied position
- **Interview Type:** Dropdown (Phone, Video, Onsite, Technical)
- **Date & Time:** Date and time picker with timezone
- **Duration:** Dropdown (30, 45, 60, 90 minutes)
- **Interviewer:** Search field to select interviewer(s)
- **Location/Link:** Auto-filled based on interview type
- **Notes:** Optional notes for candidate and interviewer

**Interview Type Selection:**  
Based on selected interview type:
- **Phone:** Requires phone number input
- **Video:** Auto-generates meeting link (Zoom, Teams, or Google Meet based on company settings)
- **Onsite:** Requires office location selection from predefined list
- **Technical:** Auto-generates video link with screen sharing enabled

**Interviewer Selection:**  
Recruiters search for interviewers by name or email. The search returns:
- Interviewer name and photo
- Title and department
- Availability indicator (Available, Busy, Out of Office)
- Conflict warning if interviewer has overlapping meetings

**Availability Check:**  
The date/time picker shows interviewer availability:
- Green slots: All interviewers available
- Yellow slots: Some interviewers have conflicts
- Red slots: All interviewers busy
- Gray slots: Outside business hours

**Schedule Confirmation:**  
After filling all fields, recruiters tap "Schedule Interview." The system:
- Creates interview record in database
- Sends calendar invitation to candidate and interviewer(s)
- Generates video meeting link if applicable
- Sends notification to candidate
- Sends notification to interviewer(s)
- Updates candidate status to "Interview"

#### User Flow: Reschedule Interview

**Reschedule Initiation:**  
From the interview details screen, recruiters tap "Reschedule." The system checks:
- If interview is within 24 hours: Warning message appears
- If candidate has already rescheduled twice: Warning message appears

**Reschedule Form:**  
The reschedule form shows:
- Current interview date and time
- New date and time picker
- Reason for reschedule (dropdown)
- Optional message to candidate

**Reschedule Confirmation:**  
After confirmation:
- Interview record updated with new date/time
- Updated calendar invitation sent to all participants
- Notifications sent to candidate and interviewer(s)
- Activity log records the reschedule with reason

#### User Flow: Cancel Interview

**Cancel Initiation:**  
From the interview details screen, recruiters tap "Cancel Interview." A confirmation dialog appears: "Are you sure you want to cancel this interview?"

**Cancellation Reason:**  
Recruiters select a cancellation reason:
- Position filled
- Candidate withdrew
- Scheduling conflict
- Other (with text input)

**Cancellation Confirmation:**  
After confirmation:
- Interview status updated to "Cancelled"
- Calendar invitation cancelled for all participants
- Notifications sent to candidate and interviewer(s)
- Activity log records the cancellation with reason

#### Acceptance Criteria

- [ ] Interview scheduling completes in under 60 seconds
- [ ] Video meeting links generate automatically for video interviews
- [ ] Calendar invitations send successfully to all participants
- [ ] Availability check shows accurate interviewer availability
- [ ] Conflict warnings appear for overlapping meetings
- [ ] Rescheduling works correctly with updated notifications
- [ ] Cancellation removes interview from all calendars
- [ ] Interview history remains accessible after cancellation
- [ ] Offline mode queues scheduling actions for later sync
- [ ] Interview reminders send to all participants

#### Technical Requirements

- Calendar integration with Google Calendar, Outlook, and Apple Calendar
- Video meeting link generation via Zoom, Teams, and Google Meet APIs
- Availability checking via calendar API queries
- Conflict detection algorithm
- Calendar invitation generation with iCal format
- Notification delivery via push, email, and SMS
- Interview record storage in database
- Activity log with full audit trail
- Offline queue for scheduling actions

---

## Technical Implementation Summary

### API Endpoints Required

The mobile app requires the following tRPC procedures:

**Authentication:**
- `auth.login` - Authenticate user with OAuth
- `auth.logout` - End user session
- `auth.refreshToken` - Refresh JWT token
- `auth.me` - Get current user information

**Jobs:**
- `jobs.list` - Get paginated job listings
- `jobs.search` - Search jobs with filters
- `jobs.getById` - Get job details by ID
- `jobs.bookmark` - Bookmark/unbookmark job
- `jobs.getBookmarked` - Get user's bookmarked jobs

**Applications:**
- `applications.create` - Submit job application
- `applications.list` - Get user's applications
- `applications.getById` - Get application details
- `applications.withdraw` - Withdraw application
- `applications.updateStatus` - Update application status (recruiter)

**Interviews:**
- `interviews.list` - Get user's interviews
- `interviews.getById` - Get interview details
- `interviews.schedule` - Schedule new interview (recruiter)
- `interviews.reschedule` - Reschedule interview
- `interviews.cancel` - Cancel interview
- `interviews.submitFeedback` - Submit post-interview feedback

**Profile:**
- `profile.get` - Get user profile
- `profile.update` - Update profile information
- `profile.uploadDocument` - Upload document
- `profile.deleteDocument` - Delete document
- `profile.setPreferences` - Update notification preferences

**Notifications:**
- `notifications.list` - Get notification history
- `notifications.markRead` - Mark notification as read
- `notifications.markAllRead` - Mark all notifications as read
- `notifications.delete` - Delete notification

**Candidates (Recruiter):**
- `candidates.list` - Get candidate list with filters
- `candidates.getById` - Get candidate profile
- `candidates.screen` - Get AI screening results
- `candidates.updateStatus` - Update candidate status
- `candidates.addNote` - Add internal note

### Data Models

**User:**
```typescript
interface User {
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

**Job:**
```typescript
interface Job {
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
}
```

**Application:**
```typescript
interface Application {
  id: number;
  organizationId: number;
  candidateId: number;
  jobId: number;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  resumeUrl: string;
  coverLetter?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Interview:**
```typescript
interface Interview {
  id: number;
  candidateId: number;
  jobId: number;
  scheduledAt: Date;
  duration: number;
  type: 'phone' | 'video' | 'onsite' | 'technical';
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Conclusion

This feature specification document provides comprehensive guidance for implementing the Oracle Smart Recruitment mobile application. Each feature is designed with mobile-first principles, emphasizing quick interactions, offline functionality, and real-time updates to create a seamless recruitment experience for both candidates and recruiters.

The specifications prioritize user experience while maintaining technical feasibility, ensuring that the mobile app delivers value from day one while providing a foundation for future enhancements. Development teams should use this document as the authoritative reference for feature implementation, consulting with product management for any clarifications or modifications.

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 3, 2025 | Manus AI | Initial feature specifications |

**Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | _______________ | _______________ | _______________ |
| UX Lead | _______________ | _______________ | _______________ |
| Technical Lead | _______________ | _______________ | _______________ |
