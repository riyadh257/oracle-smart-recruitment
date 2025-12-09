# Notification Features Documentation

## Overview

This document describes the three new notification features implemented in the Oracle Smart Recruitment System:

1. **Email Notification Preferences** - Candidates can control job alert frequency
2. **Application Status Tracking Notifications** - Real-time status updates for candidates
3. **Recruiter Dashboard Quick Actions Widget** - At-a-glance metrics for recruiters

---

## 1. Email Notification Preferences

### Feature Description

Candidates can now customize their notification preferences directly from their profile settings. This feature allows candidates to control:

- **Job Alert Frequency**: Choose between instant, daily digest, weekly summary, or off
- **Application Status Updates**: Toggle notifications for application status changes
- **Interview Reminders**: Enable/disable interview reminder notifications
- **New Job Matches**: Control notifications for new job opportunities
- **Company Updates**: Opt in/out of company news and updates
- **Career Tips**: Receive or decline career advice and resources

### Database Schema

**Table**: `candidateNotificationPreferences`

```sql
CREATE TABLE candidateNotificationPreferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidateId INT NOT NULL UNIQUE,
  jobAlertFrequency ENUM('instant', 'daily_digest', 'weekly_summary', 'off') DEFAULT 'daily_digest',
  applicationStatusUpdates BOOLEAN DEFAULT true,
  interviewReminders BOOLEAN DEFAULT true,
  newJobMatches BOOLEAN DEFAULT true,
  companyUpdates BOOLEAN DEFAULT false,
  careerTips BOOLEAN DEFAULT false,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidateId) REFERENCES candidates(id) ON DELETE CASCADE
);
```

### API Endpoints

**Get Preferences**
```typescript
trpc.candidateNotifications.getPreferences.useQuery({ candidateId: number })
```

**Update Preferences**
```typescript
trpc.candidateNotifications.updatePreferences.useMutation({
  candidateId: number,
  jobAlertFrequency: "instant" | "daily_digest" | "weekly_summary" | "off",
  applicationStatusUpdates: boolean,
  interviewReminders: boolean,
  newJobMatches: boolean,
  companyUpdates: boolean,
  careerTips: boolean
})
```

### UI Location

- **Route**: `/settings/candidate-notifications`
- **Component**: `client/src/pages/CandidateNotificationSettings.tsx`

### Usage Example

```typescript
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { data: preferences } = trpc.candidateNotifications.getPreferences.useQuery({
    candidateId: 1
  });
  
  const updatePrefs = trpc.candidateNotifications.updatePreferences.useMutation();
  
  const handleUpdate = () => {
    updatePrefs.mutate({
      candidateId: 1,
      jobAlertFrequency: "weekly_summary",
      applicationStatusUpdates: true,
      interviewReminders: true,
      newJobMatches: true,
      companyUpdates: false,
      careerTips: false
    });
  };
}
```

---

## 2. Application Status Tracking Notifications

### Feature Description

This feature automatically sends email notifications to candidates whenever their application status changes. Candidates receive beautifully formatted emails for status transitions such as:

- **Submitted → Screening**: Application is under review
- **Screening → Interviewing**: Interview scheduled
- **Interviewing → Offered**: Offer extended
- **Any → Rejected**: Application not selected

### Database Schema

**Table**: `applicationStatusHistory`

```sql
CREATE TABLE applicationStatusHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicationId INT NOT NULL,
  previousStatus ENUM('submitted', 'screening', 'interviewing', 'offered', 'rejected'),
  newStatus ENUM('submitted', 'screening', 'interviewing', 'offered', 'rejected') NOT NULL,
  changedBy INT,
  notes TEXT,
  notificationSent BOOLEAN DEFAULT false,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (changedBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX applicationId_idx (applicationId),
  INDEX createdAt_idx (createdAt)
);
```

### API Endpoints

**Update Application Status**
```typescript
trpc.candidateNotifications.updateApplicationStatus.useMutation({
  applicationId: number,
  newStatus: "submitted" | "screening" | "interviewing" | "offered" | "rejected",
  notes?: string
})
```

**Get Status History**
```typescript
trpc.candidateNotifications.getStatusHistory.useQuery({
  applicationId: number
})
```

**Get Pending Notifications**
```typescript
trpc.candidateNotifications.getPendingNotifications.useQuery()
```

### Email Templates

The system generates professional, responsive HTML emails with:

- Color-coded status badges
- Clear messaging based on status transition
- Optional notes from recruiters
- Call-to-action button to view application details
- Unsubscribe information

### Background Processing

The notification service can be run as a scheduled job to process pending notifications:

```typescript
import { processPendingStatusNotifications } from "./server/applicationStatusNotificationService";

// Run every minute
setInterval(async () => {
  const result = await processPendingStatusNotifications();
  console.log(`Sent ${result.sent} notifications, ${result.failed} failed`);
}, 60000);
```

### Usage Example

```typescript
// Update application status and trigger notification
const updateStatus = trpc.candidateNotifications.updateApplicationStatus.useMutation({
  onSuccess: () => {
    toast.success("Application status updated and notification sent");
  }
});

updateStatus.mutate({
  applicationId: 123,
  newStatus: "interviewing",
  notes: "Interview scheduled for next Monday at 10 AM"
});
```

### Respecting User Preferences

The notification system automatically checks candidate preferences before sending:

```typescript
// Check if candidate has disabled status updates
const prefs = await getCandidateNotificationPreferences(candidateId);
if (prefs && !prefs.applicationStatusUpdates) {
  // Skip sending notification
  return;
}
```

---

## 3. Recruiter Dashboard Quick Actions Widget

### Feature Description

A comprehensive dashboard widget that provides recruiters with at-a-glance metrics and quick access to common tasks. The widget displays:

**Summary Metrics:**
- Pending applications count
- Upcoming interviews (next 7 days)
- Today's application count
- Weekly application count

**Upcoming Interviews:**
- Next 5 scheduled interviews
- Interview details and timing
- Quick access to interview pages

**Recent Activity:**
- Latest 5 application status changes
- Notification delivery status
- Timestamp and notes

**Quick Action Buttons:**
- Review Applications
- Schedule Interview
- View Analytics
- Settings

### API Endpoint

**Get Quick Actions Data**
```typescript
trpc.candidateNotifications.getQuickActions.useQuery()
```

**Response Structure:**
```typescript
{
  pendingApplicationsCount: number,
  upcomingInterviews: Interview[],
  recentStatusChanges: StatusHistory[],
  digestPerformance: {
    todayApplications: number,
    weekApplications: number
  }
}
```

### UI Component

**Component**: `client/src/components/RecruiterQuickActions.tsx`

### Integration Example

```typescript
import RecruiterQuickActions from "@/components/RecruiterQuickActions";

function DashboardPage() {
  return (
    <div className="container py-8">
      <h1>Recruiter Dashboard</h1>
      <RecruiterQuickActions />
    </div>
  );
}
```

### Features

1. **Real-time Data**: Automatically refreshes with latest metrics
2. **Responsive Design**: Works on desktop, tablet, and mobile
3. **Interactive Cards**: Click to navigate to detailed views
4. **Visual Indicators**: Color-coded status badges and icons
5. **Performance Metrics**: Track daily and weekly trends

---

## Testing

### Running Tests

All features include comprehensive vitest test coverage:

```bash
cd /home/ubuntu/oracle-smart-recruitment
pnpm test server/candidateNotifications.test.ts
```

### Test Coverage

The test suite covers:

- ✅ Getting default notification preferences
- ✅ Updating notification preferences
- ✅ All job alert frequency options
- ✅ Updating application status
- ✅ Creating status history entries
- ✅ All application status values
- ✅ Getting quick actions data
- ✅ Limiting results to specified counts
- ✅ Digest performance metrics
- ✅ Authentication requirements

---

## File Structure

### Backend Files

```
server/
├── candidateNotificationDb.ts           # Database helper functions
├── candidateNotificationRouter.ts       # tRPC router definitions
├── applicationStatusNotificationService.ts  # Email notification service
└── candidateNotifications.test.ts       # Vitest test suite
```

### Frontend Files

```
client/src/
├── pages/
│   └── CandidateNotificationSettings.tsx  # Notification preferences UI
└── components/
    └── RecruiterQuickActions.tsx          # Dashboard widget
```

### Database Schema

```
drizzle/
└── schema.ts  # Added candidateNotificationPreferences and applicationStatusHistory tables
```

---

## Configuration

### Environment Variables

No additional environment variables are required. The features use existing configuration:

- `BUILT_IN_FORGE_API_URL`: For sending emails via Gmail
- `BUILT_IN_FORGE_API_KEY`: Authentication for email service
- `VITE_APP_URL`: Base URL for email links

### Default Settings

When a candidate accesses notification preferences for the first time, these defaults are applied:

```typescript
{
  jobAlertFrequency: "daily_digest",
  applicationStatusUpdates: true,
  interviewReminders: true,
  newJobMatches: true,
  companyUpdates: false,
  careerTips: false
}
```

---

## Best Practices

### For Developers

1. **Always check preferences** before sending notifications
2. **Log notification attempts** for debugging and analytics
3. **Handle email failures gracefully** with retry logic
4. **Use transactions** when updating status and creating history
5. **Validate status transitions** to prevent invalid state changes

### For Recruiters

1. **Add context in notes** when changing application status
2. **Review quick actions daily** to stay on top of pending items
3. **Schedule interviews promptly** to maintain candidate engagement
4. **Monitor notification delivery** to ensure candidates are informed

### For Candidates

1. **Set realistic preferences** to avoid missing important updates
2. **Check spam folders** if notifications aren't arriving
3. **Update preferences regularly** as job search needs change
4. **Use daily digest** for a balanced notification experience

---

## Troubleshooting

### Notifications Not Sending

1. Check candidate notification preferences
2. Verify candidate has a valid email address
3. Check Gmail MCP integration status
4. Review server logs for email errors

### Quick Actions Not Loading

1. Verify database connection
2. Check user authentication status
3. Review browser console for errors
4. Ensure tRPC router is properly registered

### Preferences Not Saving

1. Verify candidate ID is correct
2. Check database table exists
3. Review foreign key constraints
3. Ensure user has permission to update

---

## Future Enhancements

Potential improvements for future versions:

1. **SMS Notifications**: Add SMS as an alternative channel
2. **In-App Notifications**: Real-time browser notifications
3. **Notification Templates**: Customizable email templates per employer
4. **Advanced Scheduling**: Custom quiet hours and time zones
5. **Notification Analytics**: Track open rates and engagement
6. **Batch Processing**: Optimize for high-volume scenarios
7. **A/B Testing**: Test different notification formats
8. **Localization**: Multi-language support for global candidates

---

## Support

For questions or issues with these features:

1. Review this documentation
2. Check the test suite for usage examples
3. Review server logs for error messages
4. Contact the development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Author**: Oracle Smart Recruitment Development Team
