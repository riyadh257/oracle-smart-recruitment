# Oracle Smart Recruitment - Mobile App Development & Deployment Guide

**Version:** 1.0  
**Author:** Manus AI  
**Date:** December 3, 2025  
**Status:** Planning & Design Phase

---

## Executive Summary

This comprehensive guide provides step-by-step instructions for setting up the development environment, building, testing, and deploying the Oracle Smart Recruitment mobile application. The guide covers both iOS and Android platforms, addressing platform-specific requirements, common issues, and best practices for efficient development workflows.

The development process emphasizes automation, continuous integration, and quality assurance to ensure consistent builds across team members and environments. The deployment strategy implements staged rollouts with comprehensive monitoring to minimize risk and maximize user satisfaction.

---

## Development Environment Setup

### Prerequisites

Before beginning development, ensure your system meets the following requirements and has the necessary software installed.

**System Requirements:**

| Platform | Minimum Specification |
|----------|----------------------|
| macOS (for iOS development) | macOS 13 Ventura or later, 8GB RAM, 50GB free disk space |
| Windows/Linux (for Android only) | Windows 10/11 or Ubuntu 20.04+, 8GB RAM, 50GB free disk space |
| Processor | Intel i5 or equivalent, Apple Silicon supported |

**Required Software:**

The development environment requires Node.js for JavaScript runtime, platform-specific IDEs for native development, and version control tools for collaboration. Node.js version 18 or later provides the necessary features for modern React Native development, including improved performance and security updates. The package manager can be either npm (bundled with Node.js) or yarn, though npm is recommended for consistency with the project configuration.

For iOS development, Xcode 14 or later is mandatory as it provides the iOS SDK, simulators, and build tools. Xcode is only available on macOS, making a Mac computer essential for iOS development. The Command Line Tools must also be installed through Xcode preferences to enable command-line builds and automation.

Android development requires Android Studio 2023 or later, which includes the Android SDK, emulators, and Gradle build system. Android Studio runs on macOS, Windows, and Linux, making it accessible across different development platforms. The Android SDK must be configured with API level 26 (Android 8.0) or higher as the minimum supported version.

Version control uses Git 2.30 or later for repository management and collaboration. Git is essential for tracking changes, managing branches, and coordinating work across the development team. A GitHub account or equivalent Git hosting service is required for accessing the project repository and submitting changes.

### Installation Steps

**Step 1: Install Node.js**

Download and install Node.js from the official website (https://nodejs.org). The LTS (Long Term Support) version is recommended for stability and compatibility. After installation, verify the installation by opening a terminal and running:

```bash
node --version
npm --version
```

Both commands should return version numbers, confirming successful installation. If using yarn instead of npm, install it globally:

```bash
npm install -g yarn
yarn --version
```

**Step 2: Install React Native CLI**

The React Native command-line interface provides tools for creating, building, and running React Native applications. Install it globally using npm:

```bash
npm install -g react-native-cli
react-native --version
```

**Step 3: Install iOS Development Tools (macOS only)**

Download Xcode from the Mac App Store. The download is approximately 12GB and installation may take 30-60 minutes depending on your internet connection. After installation, open Xcode and accept the license agreement.

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

Install CocoaPods, the dependency manager for iOS projects:

```bash
sudo gem install cocoapods
pod --version
```

**Step 4: Install Android Development Tools**

Download Android Studio from the official website (https://developer.android.com/studio). During installation, ensure the following components are selected:

- Android SDK
- Android SDK Platform
- Android Virtual Device (AVD)

After installation, open Android Studio and complete the setup wizard. Install the Android SDK through the SDK Manager:

1. Open Android Studio
2. Navigate to Settings → Appearance & Behavior → System Settings → Android SDK
3. Select "SDK Platforms" tab
4. Check "Android 13.0 (API 33)" and "Android 8.0 (API 26)"
5. Select "SDK Tools" tab
6. Check "Android SDK Build-Tools", "Android Emulator", and "Android SDK Platform-Tools"
7. Click "Apply" to install selected components

Configure environment variables for Android SDK:

**macOS/Linux:**

Add to `~/.bash_profile` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Reload the profile:

```bash
source ~/.bash_profile  # or source ~/.zshrc
```

**Windows:**

1. Open System Properties → Advanced → Environment Variables
2. Create new user variable `ANDROID_HOME` with value `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Add to Path: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

**Step 5: Install Git**

Download Git from https://git-scm.com and follow the installation wizard. Configure Git with your identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

**Step 6: Clone Repository**

Clone the Oracle Smart Recruitment mobile app repository:

```bash
git clone https://github.com/your-org/oracle-recruitment-mobile.git
cd oracle-recruitment-mobile
```

**Step 7: Install Project Dependencies**

Install JavaScript dependencies:

```bash
npm install
```

For iOS, install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

This process may take 5-10 minutes depending on your internet connection and system performance.

### Environment Configuration

Create a `.env` file in the project root with the following configuration:

```env
# API Configuration
API_BASE_URL=https://api.oracle-recruitment.com
SOCKET_URL=wss://api.oracle-recruitment.com

# OAuth Configuration
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_REDIRECT_URI=com.oracle.recruitment://oauth/callback

# Firebase Configuration (for push notifications)
FCM_SENDER_ID=your_fcm_sender_id
FCM_SERVER_KEY=your_fcm_server_key

# Video Conferencing
ZOOM_SDK_KEY=your_zoom_sdk_key
ZOOM_SDK_SECRET=your_zoom_sdk_secret
TEAMS_CLIENT_ID=your_teams_client_id

# Feature Flags
ENABLE_BIOMETRIC_AUTH=true
ENABLE_OFFLINE_MODE=true
ENABLE_VIDEO_INTERVIEWS=true

# Analytics
ANALYTICS_ENABLED=true
FIREBASE_APP_ID=your_firebase_app_id
```

For development, create a `.env.development` file with development-specific values:

```env
API_BASE_URL=http://localhost:3000
SOCKET_URL=ws://localhost:3000
ANALYTICS_ENABLED=false
```

### Verify Installation

Run the verification script to ensure all tools are correctly installed:

```bash
npm run verify-setup
```

This script checks for Node.js, React Native CLI, Xcode (on macOS), Android SDK, and other required tools. If any issues are detected, the script provides guidance for resolution.

---

## Development Workflow

### Project Structure

Understanding the project structure is essential for efficient development and navigation.

```
oracle-recruitment-mobile/
├── android/                 # Android native code
│   ├── app/
│   │   ├── src/
│   │   └── build.gradle
│   └── build.gradle
├── ios/                     # iOS native code
│   ├── OracleRecruitment/
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.m
│   │   └── Info.plist
│   ├── OracleRecruitment.xcodeproj
│   └── Podfile
├── src/                     # React Native source code
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   ├── navigation/          # Navigation configuration
│   ├── redux/               # Redux state management
│   │   ├── slices/          # Redux Toolkit slices
│   │   └── store.ts
│   ├── services/            # API and service integrations
│   │   ├── api.ts           # tRPC client configuration
│   │   ├── socket.ts        # WebSocket connection
│   │   └── auth.ts          # Authentication service
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── App.tsx              # Root application component
├── assets/                  # Images, fonts, and static assets
├── __tests__/               # Test files
├── .env                     # Environment variables
├── .env.development         # Development environment variables
├── .env.production          # Production environment variables
├── app.json                 # React Native configuration
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

### Running the Development Server

The Metro bundler serves JavaScript code to the mobile app during development, enabling hot reloading and fast refresh.

**Start Metro Bundler:**

```bash
npm start
```

The Metro bundler starts on port 8081 by default. Keep this terminal window open while developing.

**Run on iOS Simulator:**

In a new terminal window:

```bash
npm run ios
```

This command builds the iOS app and launches it in the default iOS simulator. To specify a different simulator:

```bash
npm run ios -- --simulator="iPhone 14 Pro"
```

**Run on Android Emulator:**

Ensure an Android emulator is running or a physical device is connected. Start an emulator from Android Studio or command line:

```bash
emulator -avd Pixel_5_API_33
```

In a new terminal window:

```bash
npm run android
```

This command builds the Android app and installs it on the running emulator or connected device.

**Run on Physical Device:**

For iOS physical devices, Xcode is required for code signing and provisioning. Open `ios/OracleRecruitment.xcworkspace` in Xcode, select your device from the device dropdown, and click the Run button.

For Android physical devices, enable USB debugging in Developer Options, connect via USB, and run:

```bash
npm run android
```

### Hot Reloading and Fast Refresh

React Native supports hot reloading and fast refresh for rapid development iterations.

**Fast Refresh:**  
Fast refresh automatically reloads the app when you save changes to JavaScript files. Component state is preserved during refresh, allowing you to see changes without losing your place in the app.

**Manual Reload:**  
If fast refresh doesn't work or you need a full reload:
- **iOS Simulator:** Press `Cmd + R`
- **Android Emulator:** Press `R` twice quickly

**Debug Menu:**  
Access the debug menu for additional development tools:
- **iOS Simulator:** Press `Cmd + D`
- **Android Emulator:** Press `Cmd + M` (macOS) or `Ctrl + M` (Windows/Linux)

The debug menu provides options for:
- Reload
- Enable/Disable Fast Refresh
- Toggle Inspector
- Show Performance Monitor
- Debug JS Remotely (deprecated, use Flipper instead)

### Debugging

**React Native Debugger:**

Install React Native Debugger, a standalone debugging tool with Redux DevTools and React DevTools integration:

```bash
brew install --cask react-native-debugger  # macOS
```

For Windows/Linux, download from https://github.com/jhen0409/react-native-debugger/releases

Start React Native Debugger before running the app, then enable "Debug JS Remotely" from the debug menu.

**Flipper:**

Flipper is Facebook's platform for debugging mobile apps, with plugins for network inspection, layout inspection, and crash reporting.

Install Flipper from https://fbflipper.com. Flipper automatically detects running React Native apps and provides debugging capabilities without additional configuration.

**Console Logging:**

Use `console.log`, `console.warn`, and `console.error` for debugging. Logs appear in the Metro bundler terminal and in Flipper's Logs plugin.

**Breakpoint Debugging:**

Set breakpoints in VS Code or other IDEs with React Native debugging extensions. The debugger pauses execution at breakpoints, allowing variable inspection and step-through debugging.

### Code Quality Tools

**ESLint:**

ESLint enforces code style and catches common errors. Run ESLint manually:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint:fix
```

Configure ESLint rules in `.eslintrc.js` to match team preferences.

**Prettier:**

Prettier formats code automatically for consistent styling. Format all files:

```bash
npm run format
```

Configure Prettier in `.prettierrc` and integrate with your IDE for format-on-save.

**TypeScript:**

TypeScript provides static type checking to catch errors before runtime. Run type checking:

```bash
npm run type-check
```

Fix type errors before committing code. TypeScript configuration is in `tsconfig.json`.

### Git Workflow

The project follows a feature branch workflow with pull requests for code review.

**Branch Naming Convention:**

- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `refactor/refactor-description` - Code refactoring
- `docs/documentation-update` - Documentation changes

**Development Process:**

1. **Create Feature Branch:**

```bash
git checkout main
git pull origin main
git checkout -b feature/job-search-filters
```

2. **Make Changes:**

Develop your feature, committing regularly with descriptive messages:

```bash
git add .
git commit -m "feat: add location filter to job search"
```

Follow conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

3. **Push to Remote:**

```bash
git push origin feature/job-search-filters
```

4. **Create Pull Request:**

Open a pull request on GitHub, providing:
- Clear description of changes
- Screenshots for UI changes
- Testing instructions
- Related issue numbers

5. **Code Review:**

Team members review the pull request, providing feedback and requesting changes if needed. Address feedback by making additional commits to the feature branch.

6. **Merge:**

After approval, merge the pull request using "Squash and Merge" to maintain a clean commit history on the main branch.

---

## Testing

### Unit Testing

Unit tests verify individual components and functions in isolation.

**Test Framework:**

The project uses Jest as the test runner and React Native Testing Library for component testing.

**Running Tests:**

Run all tests:

```bash
npm test
```

Run tests in watch mode (re-runs tests on file changes):

```bash
npm test -- --watch
```

Run tests with coverage report:

```bash
npm test -- --coverage
```

**Writing Unit Tests:**

Create test files alongside the code they test, using the `.test.ts` or `.test.tsx` extension.

Example component test:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import JobCard from '../components/JobCard';

describe('JobCard', () => {
  const mockJob = {
    id: 1,
    title: 'Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco',
    employmentType: 'full-time'
  };

  it('renders job information correctly', () => {
    const { getByText } = render(<JobCard job={mockJob} />);
    
    expect(getByText('Software Engineer')).toBeTruthy();
    expect(getByText('TechCorp')).toBeTruthy();
    expect(getByText('San Francisco')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<JobCard job={mockJob} onPress={onPress} />);
    
    fireEvent.press(getByTestId('job-card'));
    expect(onPress).toHaveBeenCalledWith(mockJob);
  });
});
```

Example service test:

```typescript
import { formatDate, calculateDaysAgo } from '../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-12-03T10:00:00Z');
      expect(formatDate(date)).toBe('Dec 3, 2025');
    });
  });

  describe('calculateDaysAgo', () => {
    it('calculates days ago correctly', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(calculateDaysAgo(date)).toBe(2);
    });
  });
});
```

**Coverage Goals:**

Maintain minimum 80% code coverage for critical paths:
- Authentication flows
- Application submission
- Interview scheduling
- Payment processing (when implemented)

### Integration Testing

Integration tests verify that multiple components work together correctly.

**Test Framework:**

The project uses Detox for end-to-end testing on real devices and simulators.

**Setup Detox:**

Install Detox CLI:

```bash
npm install -g detox-cli
```

Build the app for testing:

**iOS:**

```bash
detox build --configuration ios.sim.debug
```

**Android:**

```bash
detox build --configuration android.emu.debug
```

**Running Integration Tests:**

**iOS:**

```bash
detox test --configuration ios.sim.debug
```

**Android:**

```bash
detox test --configuration android.emu.debug
```

**Writing Integration Tests:**

Create test files in the `e2e/` directory:

```typescript
describe('Job Application Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should allow user to apply for a job', async () => {
    // Navigate to Jobs tab
    await element(by.id('jobs-tab')).tap();
    
    // Tap on first job
    await element(by.id('job-card-0')).tap();
    
    // Tap Apply button
    await element(by.id('apply-button')).tap();
    
    // Fill application form
    await element(by.id('cover-letter-input')).typeText('I am excited to apply...');
    
    // Submit application
    await element(by.id('submit-button')).tap();
    
    // Verify success message
    await expect(element(by.text('Application submitted successfully!'))).toBeVisible();
  });
});
```

### Manual Testing

Manual testing ensures the app works correctly on real devices with various configurations.

**Test Devices:**

Maintain a test device matrix covering:

**iOS:**
- iPhone SE (small screen)
- iPhone 14 (standard screen)
- iPhone 14 Pro Max (large screen)
- iPad Air (tablet)

**Android:**
- Samsung Galaxy S21 (flagship)
- Google Pixel 5 (mid-range)
- OnePlus Nord (budget)
- Samsung Galaxy Tab S7 (tablet)

**Test Scenarios:**

Create test scenarios covering all major user flows:

1. **Authentication:**
   - Login with valid credentials
   - Login with invalid credentials
   - Biometric authentication
   - Logout

2. **Job Discovery:**
   - Browse job listings
   - Search jobs
   - Apply filters
   - Bookmark jobs
   - View job details

3. **Application:**
   - Submit application with resume
   - Submit application with cover letter
   - View application status
   - Withdraw application

4. **Interviews:**
   - View scheduled interviews
   - Reschedule interview
   - Join video interview
   - Submit feedback

5. **Profile:**
   - Update profile information
   - Upload documents
   - Configure notification preferences

6. **Offline Mode:**
   - Browse jobs offline
   - Submit application offline
   - Sync when connectivity restored

**Bug Reporting:**

Report bugs using the issue tracker with:
- Device model and OS version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots or screen recordings
- Console logs

---

## Building for Production

### iOS Production Build

**Prerequisites:**

- Apple Developer account ($99/year)
- App Store Connect access
- Provisioning profiles and certificates configured

**Step 1: Configure App Identifier**

1. Log in to Apple Developer portal
2. Navigate to Certificates, Identifiers & Profiles
3. Create App ID: `com.oracle.recruitment`
4. Enable capabilities: Push Notifications, Sign in with Apple

**Step 2: Create Provisioning Profile**

1. Create Distribution provisioning profile
2. Select App ID created in Step 1
3. Select Distribution certificate
4. Download and install provisioning profile

**Step 3: Configure Xcode**

1. Open `ios/OracleRecruitment.xcworkspace` in Xcode
2. Select project in navigator
3. Select "OracleRecruitment" target
4. Navigate to "Signing & Capabilities"
5. Select your team
6. Ensure provisioning profile is selected

**Step 4: Update Version and Build Number**

In `ios/OracleRecruitment/Info.plist`:

```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

Increment version for each release following semantic versioning.

**Step 5: Build Archive**

In Xcode:
1. Select "Any iOS Device" as build target
2. Product → Archive
3. Wait for archive to complete (5-10 minutes)

**Step 6: Upload to App Store Connect**

1. Window → Organizer
2. Select the archive
3. Click "Distribute App"
4. Select "App Store Connect"
5. Click "Upload"
6. Wait for upload to complete

**Step 7: Submit for Review**

1. Log in to App Store Connect
2. Navigate to your app
3. Create new version
4. Fill in required metadata:
   - App description
   - Keywords
   - Screenshots (required sizes: 6.5", 5.5", 12.9")
   - App icon (1024x1024px)
   - Privacy policy URL
   - Support URL
5. Select the uploaded build
6. Submit for review

Apple review typically takes 24-48 hours. Address any feedback from the review team promptly.

### Android Production Build

**Prerequisites:**

- Google Play Console account ($25 one-time fee)
- Keystore file for app signing

**Step 1: Generate Keystore**

Generate a keystore for signing the app:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore oracle-recruitment.keystore -alias oracle-recruitment -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file securely and never commit it to version control. Save the keystore password and key password in a secure password manager.

**Step 2: Configure Gradle**

Create `android/gradle.properties` (add to `.gitignore`):

```properties
ORACLE_RECRUITMENT_UPLOAD_STORE_FILE=oracle-recruitment.keystore
ORACLE_RECRUITMENT_UPLOAD_KEY_ALIAS=oracle-recruitment
ORACLE_RECRUITMENT_UPLOAD_STORE_PASSWORD=your_keystore_password
ORACLE_RECRUITMENT_UPLOAD_KEY_PASSWORD=your_key_password
```

Update `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('ORACLE_RECRUITMENT_UPLOAD_STORE_FILE')) {
                storeFile file(ORACLE_RECRUITMENT_UPLOAD_STORE_FILE)
                storePassword ORACLE_RECRUITMENT_UPLOAD_STORE_PASSWORD
                keyAlias ORACLE_RECRUITMENT_UPLOAD_KEY_ALIAS
                keyPassword ORACLE_RECRUITMENT_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

**Step 3: Update Version**

In `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        ...
        versionCode 1
        versionName "1.0.0"
    }
}
```

Increment `versionCode` for each release (must be higher than previous). Update `versionName` following semantic versioning.

**Step 4: Build APK/AAB**

Build Android App Bundle (required for Play Store):

```bash
cd android
./gradlew bundleRelease
```

The AAB file is generated at `android/app/build/outputs/bundle/release/app-release.aab`.

Alternatively, build APK for direct distribution:

```bash
./gradlew assembleRelease
```

The APK file is generated at `android/app/build/outputs/apk/release/app-release.apk`.

**Step 5: Upload to Google Play Console**

1. Log in to Google Play Console
2. Select your app (or create new app)
3. Navigate to Production → Releases
4. Click "Create new release"
5. Upload the AAB file
6. Fill in release notes
7. Review and roll out

**Step 6: Complete Store Listing**

1. Navigate to Store presence → Main store listing
2. Fill in required information:
   - App name
   - Short description (80 characters)
   - Full description (4000 characters)
   - Screenshots (minimum 2, recommended 8)
   - Feature graphic (1024x500px)
   - App icon (512x512px)
3. Navigate to Store presence → Store settings
   - App category
   - Contact details
   - Privacy policy URL
4. Navigate to Policy → App content
   - Complete content rating questionnaire
   - Declare target audience
   - Complete privacy and security declarations

**Step 7: Submit for Review**

After completing all required sections, submit the app for review. Google review typically takes 1-3 days.

---

## Continuous Integration & Deployment

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment.

**Workflow Configuration:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: cd ios && pod install
      - run: xcodebuild -workspace ios/OracleRecruitment.xcworkspace -scheme OracleRecruitment -configuration Release -sdk iphonesimulator

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      - run: npm install
      - run: cd android && ./gradlew assembleRelease
```

**Deployment Workflow:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: cd ios && pod install
      - name: Build and upload to TestFlight
        env:
          FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
        run: cd ios && fastlane beta

  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      - run: npm install
      - name: Build and upload to Play Console
        env:
          ANDROID_KEYSTORE: ${{ secrets.ANDROID_KEYSTORE }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        run: cd android && ./gradlew bundleRelease && fastlane deploy
```

### Fastlane Configuration

Fastlane automates building and deployment processes.

**Install Fastlane:**

```bash
sudo gem install fastlane -NV
```

**iOS Fastlane Configuration:**

Create `ios/fastlane/Fastfile`:

```ruby
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "OracleRecruitment.xcodeproj")
    build_app(workspace: "OracleRecruitment.xcworkspace", scheme: "OracleRecruitment")
    upload_to_testflight
  end

  desc "Push a new release build to the App Store"
  lane :release do
    increment_build_number(xcodeproj: "OracleRecruitment.xcodeproj")
    build_app(workspace: "OracleRecruitment.xcworkspace", scheme: "OracleRecruitment")
    upload_to_app_store
  end
end
```

**Android Fastlane Configuration:**

Create `android/fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Deploy a new version to the Google Play"
  lane :deploy do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(track: 'internal')
  end

  desc "Deploy to beta track"
  lane :beta do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(track: 'beta')
  end

  desc "Deploy to production"
  lane :production do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(track: 'production')
  end
end
```

---

## Monitoring & Analytics

### Crash Reporting

**Firebase Crashlytics:**

Firebase Crashlytics provides real-time crash reporting with detailed stack traces.

**Setup:**

1. Create Firebase project at https://console.firebase.google.com
2. Add iOS and Android apps to Firebase project
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
4. Place configuration files in respective directories
5. Install Firebase SDK:

```bash
npm install @react-native-firebase/app @react-native-firebase/crashlytics
```

6. Configure native projects following Firebase documentation

**Usage:**

Crashlytics automatically captures crashes. Manually log non-fatal errors:

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

try {
  // Risky operation
} catch (error) {
  crashlytics().recordError(error);
}
```

### Performance Monitoring

**Firebase Performance Monitoring:**

Monitor app startup time, network requests, and custom traces.

**Setup:**

```bash
npm install @react-native-firebase/perf
```

**Usage:**

```typescript
import perf from '@react-native-firebase/perf';

// Measure custom operation
const trace = await perf().startTrace('job_search');
// Perform job search
await trace.stop();

// Measure network request
const metric = await perf().newHttpMetric(url, 'GET');
await metric.start();
// Perform request
metric.setHttpResponseCode(response.status);
metric.setResponseContentType(response.headers['content-type']);
await metric.stop();
```

### User Analytics

**Firebase Analytics:**

Track user behavior, screen views, and custom events.

**Setup:**

```bash
npm install @react-native-firebase/analytics
```

**Usage:**

```typescript
import analytics from '@react-native-firebase/analytics';

// Log screen view
await analytics().logScreenView({
  screen_name: 'JobDetails',
  screen_class: 'JobDetailsScreen'
});

// Log custom event
await analytics().logEvent('job_application_submitted', {
  job_id: 123,
  job_title: 'Software Engineer',
  source: 'mobile_app'
});

// Set user properties
await analytics().setUserProperty('user_role', 'candidate');
```

---

## Troubleshooting

### Common Issues

**Issue: Metro bundler fails to start**

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear watchman cache (macOS/Linux)
watchman watch-del-all

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**Issue: iOS build fails with CocoaPods error**

**Solution:**
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clear CocoaPods cache
cd ios
pod deintegrate
pod install

# If still failing, update pod repo
pod repo update
pod install
```

**Issue: Android build fails with Gradle error**

**Solution:**
```bash
# Clean Gradle cache
cd android
./gradlew clean

# Clear Gradle cache globally
rm -rf ~/.gradle/caches/

# Rebuild
./gradlew assembleDebug
```

**Issue: App crashes on launch**

**Solution:**
1. Check console logs for error messages
2. Verify all native dependencies are linked correctly
3. Ensure environment variables are configured
4. Check Firebase configuration files are present
5. Verify API endpoints are accessible

**Issue: Biometric authentication not working**

**Solution:**
1. Verify device supports biometric authentication
2. Check permissions in Info.plist (iOS) or AndroidManifest.xml (Android)
3. Ensure biometric authentication is enrolled on device
4. Test on physical device (simulators have limited biometric support)

**Issue: Push notifications not received**

**Solution:**
1. Verify FCM configuration is correct
2. Check device token is registered with backend
3. Ensure app has notification permissions
4. Test on physical device (simulators have limited notification support)
5. Check Firebase console for delivery status

---

## Best Practices

### Code Organization

**Component Structure:**

Organize components by feature rather than type:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── jobs/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── hooks/
│   │   └── types.ts
│   └── applications/
│       ├── components/
│       ├── screens/
│       ├── hooks/
│       └── types.ts
```

**Naming Conventions:**

- Components: PascalCase (e.g., `JobCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Types/Interfaces: PascalCase (e.g., `Job`, `Application`)

### Performance Optimization

**Image Optimization:**

Use `react-native-fast-image` for efficient image loading and caching:

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: imageUrl,
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.contain}
/>
```

**List Optimization:**

Use `FlatList` with proper optimization props:

```typescript
<FlatList
  data={jobs}
  renderItem={renderJobCard}
  keyExtractor={(item) => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

**Memoization:**

Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders:

```typescript
const JobCard = React.memo(({ job, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(job);
  }, [job, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Card content */}
    </TouchableOpacity>
  );
});
```

### Security Best Practices

**Secure Storage:**

Never store sensitive data in AsyncStorage. Use secure storage:

```typescript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('access_token', token);

// Retrieve token
const token = await SecureStore.getItemAsync('access_token');

// Delete token
await SecureStore.deleteItemAsync('access_token');
```

**API Security:**

Always use HTTPS for API communication. Implement certificate pinning for production:

```typescript
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  sslPinning: {
    certs: ['certificate']
  }
});
```

**Input Validation:**

Validate all user inputs before sending to API:

```typescript
import { z } from 'zod';

const applicationSchema = z.object({
  jobId: z.number().positive(),
  coverLetter: z.string().max(5000),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email()
});

try {
  const validatedData = applicationSchema.parse(formData);
  // Submit application
} catch (error) {
  // Handle validation errors
}
```

---

## Conclusion

This development and deployment guide provides comprehensive instructions for building, testing, and releasing the Oracle Smart Recruitment mobile application. Following these guidelines ensures consistent development practices, high code quality, and smooth deployment processes.

Regular updates to this guide are essential as the project evolves and new tools or practices are adopted. All team members should familiarize themselves with this guide and contribute improvements based on their experiences.

For questions or issues not covered in this guide, consult with the mobile development lead or create an issue in the project repository for documentation updates.

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 3, 2025 | Manus AI | Initial development guide |

**Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Mobile Lead | _______________ | _______________ | _______________ |
| DevOps Lead | _______________ | _______________ | _______________ |
| QA Lead | _______________ | _______________ | _______________ |
