# Oracle Smart Recruitment - Mobile App Architecture

## Overview

The Oracle Smart Recruitment mobile app is a companion application for candidates to track their applications, receive push notifications, and join video interviews on-the-go.

## Technology Stack

### Cross-Platform Framework: React Native
- **Rationale**: Single codebase for iOS and Android, leverages existing React expertise
- **Version**: React Native 0.73+
- **Navigation**: React Navigation 6.x
- **State Management**: React Query (TanStack Query) for server state
- **UI Components**: React Native Paper or NativeBase

### Backend Integration
- **API**: tRPC client connecting to existing Oracle Smart Recruitment backend
- **Authentication**: OAuth 2.0 flow with Manus Auth
- **Real-time**: WebSocket connection for live updates

### Push Notifications
- **Service**: Firebase Cloud Messaging (FCM) for both iOS and Android
- **Triggers**: Application status changes, interview reminders, new messages
- **Delivery**: Server-side push via Firebase Admin SDK

### Video Conferencing
- **Integration**: Deep links to native video apps (Zoom, Teams, Google Meet)
- **Fallback**: WebView for browser-based video calls
- **Features**: One-tap join, calendar integration, pre-call reminders

## App Structure

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Applications/
│   │   │   ├── ApplicationListScreen.tsx
│   │   │   ├── ApplicationDetailScreen.tsx
│   │   │   └── ApplyScreen.tsx
│   │   ├── Interviews/
│   │   │   ├── InterviewListScreen.tsx
│   │   │   ├── InterviewDetailScreen.tsx
│   │   │   └── VideoJoinScreen.tsx
│   │   ├── Documents/
│   │   │   ├── DocumentListScreen.tsx
│   │   │   └── DocumentUploadScreen.tsx
│   │   └── Settings/
│   │       ├── ProfileScreen.tsx
│   │       └── NotificationSettingsScreen.tsx
│   ├── components/
│   │   ├── ApplicationCard.tsx
│   │   ├── InterviewCard.tsx
│   │   ├── StatusBadge.tsx
│   │   └── NotificationBanner.tsx
│   ├── services/
│   │   ├── api.ts (tRPC client)
│   │   ├── auth.ts
│   │   ├── notifications.ts (FCM)
│   │   └── storage.ts (local storage)
│   ├── hooks/
│   │   ├── useApplications.ts
│   │   ├── useInterviews.ts
│   │   └── useNotifications.ts
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   └── AuthNavigator.tsx
│   └── utils/
│       ├── dateFormat.ts
│       └── deepLinks.ts
├── android/
├── ios/
└── package.json
```

## Core Features

### 1. Authentication
- OAuth login flow with Manus Auth
- Biometric authentication (Face ID / Touch ID)
- Session management with secure token storage

### 2. Application Tracking
- View all job applications
- Real-time status updates
- Application timeline visualization
- Document upload capability

### 3. Interview Management
- Upcoming interview list with countdown
- Interview details with location/video link
- One-tap join for video interviews
- Calendar integration (add to device calendar)
- Interview rescheduling requests

### 4. Push Notifications
- Application status changes
- Interview reminders (24h, 1h, 15min before)
- New message notifications
- Configurable notification preferences

### 5. Document Management
- Upload additional documents
- View uploaded documents
- Download documents for offline viewing

### 6. Settings & Preferences
- Profile management
- Notification preferences
- Language selection
- Dark mode support

## API Endpoints (Backend Extensions)

### Mobile-Specific Endpoints

```typescript
// Push Notification Registration
mobile: router({
  registerDevice: publicProcedure
    .input(z.object({
      candidateId: z.number(),
      fcmToken: z.string(),
      platform: z.enum(["ios", "android"]),
      deviceId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Store FCM token for push notifications
    }),

  unregisterDevice: publicProcedure
    .input(z.object({
      deviceId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Remove FCM token
    }),

  getNotifications: publicProcedure
    .input(z.object({
      candidateId: z.number(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      // Get notification history
    }),
})
```

## Database Schema Extensions

```sql
-- Device Registration Table
CREATE TABLE mobile_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidate_id INT NOT NULL,
  fcm_token VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android') NOT NULL,
  device_id VARCHAR(255) NOT NULL UNIQUE,
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- Notification History Table
CREATE TABLE notification_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidate_id INT NOT NULL,
  type ENUM('status_change', 'interview_reminder', 'message', 'general') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSON,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
```

## Push Notification Flow

```
1. Candidate installs mobile app
2. App requests notification permission
3. FCM generates device token
4. App sends token to backend via registerDevice API
5. Backend stores token in mobile_devices table

When event occurs (e.g., status change):
1. Backend triggers notification
2. Server looks up FCM tokens for candidate
3. Server sends push via Firebase Admin SDK
4. FCM delivers to device
5. App displays notification
6. User taps notification → app opens to relevant screen
```

## Video Interview Deep Linking

### URL Schemes
- Zoom: `zoomus://zoom.us/join?confno=<meetingId>&pwd=<password>`
- Teams: `msteams://teams.microsoft.com/l/meetup-join/<meetingUrl>`
- Google Meet: `meet://meet.google.com/<meetingCode>`

### Implementation
```typescript
const joinVideoInterview = (provider: string, meetingLink: string, meetingId?: string, password?: string) => {
  let deepLink: string;
  
  switch (provider) {
    case 'zoom':
      deepLink = `zoomus://zoom.us/join?confno=${meetingId}&pwd=${password}`;
      break;
    case 'teams':
      deepLink = meetingLink.replace('https://', 'msteams://');
      break;
    case 'google-meet':
      const meetCode = meetingLink.split('/').pop();
      deepLink = `meet://meet.google.com/${meetCode}`;
      break;
    default:
      // Fallback to web browser
      Linking.openURL(meetingLink);
      return;
  }
  
  Linking.canOpenURL(deepLink).then(supported => {
    if (supported) {
      Linking.openURL(deepLink);
    } else {
      // App not installed, open in browser
      Linking.openURL(meetingLink);
    }
  });
};
```

## Security Considerations

1. **Token Storage**: Use React Native Keychain for secure token storage
2. **API Communication**: All API calls over HTTPS
3. **Biometric Auth**: Optional but recommended for quick access
4. **Session Management**: Auto-logout after inactivity
5. **Data Encryption**: Encrypt sensitive data at rest

## Development Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Set up React Native project
- Configure navigation
- Implement authentication flow
- Set up tRPC client

### Phase 2: Application Features (Week 3-4)
- Application list and detail screens
- Document upload functionality
- Status tracking UI

### Phase 3: Interview Features (Week 5-6)
- Interview list and details
- Video join functionality
- Calendar integration

### Phase 4: Push Notifications (Week 7-8)
- FCM integration
- Notification handling
- Backend push service
- Notification preferences

### Phase 5: Polish & Testing (Week 9-10)
- UI/UX refinements
- Performance optimization
- Testing (unit, integration, E2E)
- Beta testing

## Deployment

### iOS
- Apple Developer Account required
- TestFlight for beta testing
- App Store submission

### Android
- Google Play Console account required
- Internal testing track
- Play Store submission

## Monitoring & Analytics

- **Crash Reporting**: Sentry or Firebase Crashlytics
- **Analytics**: Firebase Analytics
- **Performance**: Firebase Performance Monitoring
- **User Feedback**: In-app feedback form

## Future Enhancements

1. **Offline Mode**: Cache data for offline viewing
2. **Chat Feature**: Direct messaging with recruiters
3. **Interview Prep**: Practice questions and tips
4. **Referral System**: Refer friends for open positions
5. **Salary Insights**: Salary ranges and negotiation tips
6. **Company Reviews**: Read reviews from current employees

## Cost Estimates

### Development
- **Developer**: $80-150/hour × 400 hours = $32,000 - $60,000
- **Designer**: $60-100/hour × 80 hours = $4,800 - $8,000
- **QA**: $40-70/hour × 100 hours = $4,000 - $7,000
- **Total Development**: $40,800 - $75,000

### Ongoing Costs
- **Firebase**: $25-100/month (depending on usage)
- **Apple Developer**: $99/year
- **Google Play**: $25 one-time
- **Push Notifications**: Included in Firebase
- **Maintenance**: $2,000-5,000/month

## Alternatives to Full Native App

### Progressive Web App (PWA)
- **Pros**: Single codebase, no app store approval, instant updates
- **Cons**: Limited push notification support on iOS, no deep linking
- **Cost**: 30-50% cheaper than native

### React Native Web
- **Pros**: Share code with mobile apps, web deployment
- **Cons**: Some platform-specific features may not work
- **Cost**: Similar to React Native

## Recommendation

For the Oracle Smart Recruitment system, I recommend starting with a **React Native mobile app** for the following reasons:

1. **Best User Experience**: Native feel with full access to device features
2. **Push Notifications**: Reliable push notifications on both platforms
3. **Video Integration**: Better deep linking and app switching
4. **Offline Capability**: Can cache data for offline viewing
5. **Future-Proof**: Easier to add advanced features later

The estimated timeline is **10-12 weeks** with a budget of **$45,000-80,000** for initial development.
