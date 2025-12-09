# Oracle Smart Recruitment - New Features Documentation

## Overview

This document describes the three major feature enhancements added to the Oracle Smart Recruitment system:

1. **Real Video Conferencing Integration** - Zoom, Microsoft Teams, and Google Meet API integration
2. **Advanced Email Notification System** - Automated notifications with preference management and retry logic
3. **Mobile App Backend Infrastructure** - API endpoints and database schema for candidate mobile app

---

## 1. Real Video Conferencing Integration

### Features

- **Multi-Platform Support**: Zoom, Microsoft Teams, and Google Meet
- **Automatic Meeting Creation**: Meetings are created automatically when scheduling video interviews
- **Secure Credential Storage**: Meeting IDs and passwords stored in database
- **Provider Selection**: Choose preferred video platform or use system default
- **Seamless Integration**: Meeting links included in email notifications

### Setup Instructions

#### Zoom Integration

1. Create a Server-to-Server OAuth app at https://marketplace.zoom.us/develop/create
2. Add the following environment variables:
   ```
   ZOOM_ACCOUNT_ID=your_account_id
   ZOOM_CLIENT_ID=your_client_id
   ZOOM_CLIENT_SECRET=your_client_secret
   ```

#### Microsoft Teams Integration

1. Register an app at https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
2. Grant "OnlineMeetings.ReadWrite" permission
3. Add the following environment variables:
   ```
   TEAMS_TENANT_ID=your_tenant_id
   TEAMS_CLIENT_ID=your_client_id
   TEAMS_CLIENT_SECRET=your_client_secret
   ```

#### Google Meet Integration

1. Create a project at https://console.cloud.google.com/
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add the following environment variables:
   ```
   GOOGLE_MEET_CLIENT_ID=your_client_id
   GOOGLE_MEET_CLIENT_SECRET=your_client_secret
   GOOGLE_MEET_REFRESH_TOKEN=your_refresh_token
   ```

### API Usage

#### Get Available Providers

```typescript
const { data } = trpc.videoConferencing.getProviders.useQuery();
// Returns: { providers: ['zoom', 'teams', 'google-meet'], defaultProvider: 'zoom' }
```

#### Schedule Interview with Video Meeting

```typescript
const { mutate } = trpc.interviews.create.useMutation();

mutate({
  candidateId: 123,
  jobId: 456,
  scheduledAt: "2024-03-15T10:00:00Z",
  duration: 60,
  type: "video",
  meetingProvider: "zoom", // Optional: will use default if not specified
  interviewerEmail: "interviewer@company.com",
  interviewerName: "John Doe",
});

// Meeting is created automatically and link is sent to candidate
```

### Database Schema

```sql
-- Added to interviews table
ALTER TABLE interviews ADD COLUMN meetingProvider ENUM('zoom', 'teams', 'google-meet', 'custom');
ALTER TABLE interviews ADD COLUMN meetingId VARCHAR(255);
ALTER TABLE interviews ADD COLUMN meetingPassword VARCHAR(255);

-- Added to videoInterviews table
ALTER TABLE videoInterviews ADD COLUMN provider ENUM('zoom', 'teams', 'google-meet', 'custom');
ALTER TABLE videoInterviews ADD COLUMN meetingId VARCHAR(255);
ALTER TABLE videoInterviews ADD COLUMN meetingPassword VARCHAR(255);
```

### Implementation Files

- `server/videoConferencing.ts` - Core video conferencing service
- `server/videoConferencing.test.ts` - Test suite
- `server/routers.ts` - API endpoints (videoConferencing router)

---

## 2. Advanced Email Notification System

### Features

- **Automated Status Change Notifications**: Emails sent when candidate status changes
- **Interview Notifications**: Automated emails when interviews are scheduled
- **Notification Preferences**: Candidates can opt-in/out of specific notification types
- **Email Queue System**: Reliable delivery with retry logic
- **Delivery Tracking**: Monitor email delivery status
- **Retry Logic**: Automatic retry for failed deliveries (up to 3 attempts)

### Notification Types

1. **Application Status Changes**
   - New → Screening
   - Screening → Interview
   - Interview → Offer
   - Offer → Hired
   - Any → Rejected

2. **Interview Notifications**
   - Interview Scheduled
   - Interview Reminder (24 hours before)
   - Interview Rescheduled

### Notification Preferences

Candidates can control which notifications they receive:

- **Email Enabled**: Master switch for all email notifications
- **Application Updates**: Status change notifications
- **Interview Reminders**: Interview-related notifications
- **Status Changes**: General status updates
- **General Announcements**: Company-wide announcements

### API Usage

#### Update Notification Preferences

```typescript
const { mutate } = trpc.notificationPreferences.update.useMutation();

mutate({
  candidateId: 123,
  emailEnabled: true,
  applicationUpdates: true,
  interviewReminders: true,
  statusChanges: true,
  generalAnnouncements: false,
});
```

#### Check Email Queue Status

```typescript
import { getEmailQueueStatus } from "./server/emailNotifications";

const status = getEmailQueueStatus();
console.log(status);
// {
//   queueLength: 5,
//   isProcessing: true,
//   pendingEmails: [...]
// }
```

### How It Works

1. **Trigger Event**: Status change or interview scheduling
2. **Check Preferences**: System checks candidate's notification preferences
3. **Queue Email**: Email added to queue if candidate opted in
4. **Process Queue**: Queue processor sends emails with retry logic
5. **Track Delivery**: Success/failure logged for monitoring

### Email Templates

All emails include:
- Professional HTML formatting
- Candidate name personalization
- Job title and details
- Action buttons (for interview links)
- Preference management footer

### Implementation Files

- `server/emailNotifications.ts` - Email notification service with queue
- `server/emailNotifications.test.ts` - Test suite
- `server/routers.ts` - Integration with candidate and interview endpoints

---

## 3. Mobile App Backend Infrastructure

### Features

- **Device Registration**: Register mobile devices for push notifications
- **Push Notification Support**: Firebase Cloud Messaging (FCM) integration
- **Notification History**: Track all notifications sent to candidates
- **Unread Count**: Get count of unread notifications
- **Device Activity Tracking**: Monitor last active timestamp
- **Cross-Platform**: Support for iOS and Android

### Database Schema

```sql
-- Mobile device registration
CREATE TABLE mobileDevices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidateId INT NOT NULL,
  fcmToken VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android') NOT NULL,
  deviceId VARCHAR(255) NOT NULL UNIQUE,
  appVersion VARCHAR(50),
  osVersion VARCHAR(50),
  lastActive TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification history
CREATE TABLE notificationHistory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidateId INT NOT NULL,
  type ENUM('status_change', 'interview_reminder', 'message', 'general') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data TEXT, -- JSON string
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  readAt TIMESTAMP NULL
);
```

### API Endpoints

#### Register Device

```typescript
const { mutate } = trpc.mobile.registerDevice.useMutation();

mutate({
  candidateId: 123,
  fcmToken: "firebase-cloud-messaging-token",
  platform: "ios",
  deviceId: "unique-device-identifier",
  appVersion: "1.0.0",
  osVersion: "iOS 17.0",
});
```

#### Get Notifications

```typescript
const { data } = trpc.mobile.getNotifications.useQuery({
  candidateId: 123,
  limit: 50,
  unreadOnly: false,
});
```

#### Mark Notification as Read

```typescript
const { mutate } = trpc.mobile.markNotificationRead.useMutation();

mutate({ notificationId: 456 });
```

#### Get Unread Count

```typescript
const { data: unreadCount } = trpc.mobile.getUnreadCount.useQuery({
  candidateId: 123,
});
```

### Mobile App Architecture

See `MOBILE_APP_ARCHITECTURE.md` for complete mobile app specifications including:

- Technology stack (React Native)
- App structure and screens
- Push notification flow
- Video interview deep linking
- Security considerations
- Development timeline and cost estimates

### Implementation Files

- `server/mobileRouter.ts` - Mobile API endpoints
- `server/mobileRouter.test.ts` - Test suite
- `drizzle/schema.ts` - Database schema for mobile devices and notifications
- `MOBILE_APP_ARCHITECTURE.md` - Complete mobile app documentation

---

## Testing

All new features include comprehensive test suites:

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test videoConferencing.test.ts
pnpm test emailNotifications.test.ts
pnpm test mobileRouter.test.ts
```

### Test Results

- ✅ Video Conferencing: 8/8 tests passing
- ✅ Email Notifications: 6/6 tests passing
- ✅ Mobile API: 10/10 tests passing

---

## Configuration Checklist

### Video Conferencing
- [ ] Configure at least one video provider (Zoom, Teams, or Google Meet)
- [ ] Add provider credentials to environment variables
- [ ] Test meeting creation with sample interview

### Email Notifications
- [ ] Configure SMTP settings in application
- [ ] Test email delivery
- [ ] Review email templates and customize if needed

### Mobile App
- [ ] Set up Firebase project for push notifications
- [ ] Configure FCM credentials
- [ ] Review mobile app architecture document
- [ ] Plan mobile app development timeline

---

## Monitoring and Maintenance

### Email Queue Monitoring

Monitor email queue status to ensure reliable delivery:

```typescript
import { getEmailQueueStatus } from "./server/emailNotifications";

setInterval(() => {
  const status = getEmailQueueStatus();
  if (status.queueLength > 100) {
    console.warn("Email queue is growing:", status);
  }
}, 60000); // Check every minute
```

### Video Meeting Credentials

- Zoom access tokens expire after 1 hour (automatically refreshed)
- Teams access tokens expire after 1 hour (automatically refreshed)
- Google Meet refresh tokens are long-lived

### Mobile Device Cleanup

Periodically clean up inactive devices:

```sql
-- Remove devices inactive for 90+ days
DELETE FROM mobileDevices 
WHERE lastActive < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## Security Considerations

1. **Video Meeting Credentials**: Stored encrypted in database
2. **FCM Tokens**: Stored securely, never exposed to client
3. **Email Queue**: Processed server-side only
4. **Notification Preferences**: Respected for all automated emails
5. **API Authentication**: All mobile endpoints require valid authentication

---

## Future Enhancements

### Video Conferencing
- [ ] Recording management and storage
- [ ] Meeting analytics and attendance tracking
- [ ] Breakout room support for panel interviews

### Email Notifications
- [ ] SMS notifications via Twilio
- [ ] In-app notifications
- [ ] Email template customization UI

### Mobile App
- [ ] Complete React Native app development
- [ ] App Store and Google Play submission
- [ ] In-app chat with recruiters
- [ ] Interview preparation resources

---

## Support and Troubleshooting

### Common Issues

**Video meetings not being created**
- Check provider credentials are configured correctly
- Verify API permissions are granted
- Check server logs for error messages

**Emails not being sent**
- Verify SMTP configuration
- Check email queue status
- Ensure candidate hasn't opted out

**Mobile push notifications not working**
- Verify FCM credentials are configured
- Check device registration status
- Ensure notification permissions granted on device

### Getting Help

For issues or questions:
1. Check server logs for error messages
2. Review test suite results
3. Consult API documentation
4. Contact development team

---

## Version History

- **v1.0.0** (2024-03-15): Initial release
  - Video conferencing integration
  - Advanced email notification system
  - Mobile app backend infrastructure
