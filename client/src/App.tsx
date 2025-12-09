import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CandidateInterviewResponse from "./pages/CandidateInterviewResponse";
import CandidateEngagementStatus from "./pages/CandidateEngagementStatus";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import CandidatesList from "./pages/CandidatesList";
import CalendarPage from "./pages/CalendarPage";
import CandidateDetail from "./pages/CandidateDetail";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import InterviewDetail from "./pages/InterviewDetail";
import FeedbackAnalytics from "./pages/FeedbackAnalytics";
import EnhancedFeedbackAnalytics from "./pages/EnhancedFeedbackAnalytics";
import FeedbackTemplates from "./pages/FeedbackTemplates";
import MobileInterviewFeedback from "./pages/MobileInterviewFeedback";
import NotificationSettings from "./pages/NotificationSettings";
import CalendarSettings from "./pages/CalendarSettings";
import PushNotificationSettings from "./pages/PushNotificationSettings";
import NotificationCenter from "./pages/NotificationCenter";
import Help from "./pages/Help";
import LaborLawCompliance from "./pages/LaborLawCompliance";
import WorkPermitManagement from "./pages/WorkPermitManagement";
import VisaComplianceDashboard from "./pages/VisaComplianceDashboard";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import EmployeeImport from "./pages/EmployeeImport";
import ComplianceReports from "./pages/ComplianceReports";
import CandidateInsights from "./pages/CandidateInsights";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import BulkIqamaValidation from "./pages/BulkIqamaValidation";
import MatchingPreferences from "./pages/MatchingPreferences";
import KSACompliance from "./pages/KSACompliance";
import ComplianceAlertsDashboard from "./pages/ComplianceAlertsDashboard";
import ComplianceAnalytics from "./pages/ComplianceAnalytics";
import EmailEngagementDashboard from "./pages/EmailEngagementDashboard";
import BulkBroadcast from "./pages/BulkBroadcast";
import BulkBroadcastEnhanced from "./pages/BulkBroadcastEnhanced";
import EmailAutomation from "./pages/EmailAutomation";
import ABTestResults from "./pages/ABTestResults";
import EmailABTesting from "./pages/EmailABTesting";
import ABTestDashboard from "./pages/ABTestDashboard";
import EmailTemplateLibrary from "./pages/EmailTemplateLibrary";
import CampaignTemplateLibrary from "./pages/CampaignTemplateLibrary";
import ABTesting from "./pages/ABTesting";
import SmsProviderConfig from "./pages/SmsProviderConfig";
import EngagementScoreDashboard from "./pages/EngagementScoreDashboard";
import TemplateAutomation from "./pages/TemplateAutomation";
import SmsCampaignBuilder from "./pages/SmsCampaignBuilder";
import EngagementAlertsManagement from "./pages/EngagementAlertsManagement";
import AutomationTesting from "./pages/AutomationTesting";
import AutomationTestingAnalytics from "./pages/AutomationTestingAnalytics";
import AIMatchingDashboard from "./pages/AIMatchingDashboard";
import SavedMatches from "./pages/SavedMatches";
import AIMatching from "./pages/AIMatching";
import AIMatchingEnhanced from "./pages/AIMatchingEnhanced";
import Jobs from "./pages/Jobs";
import Compliance from "./pages/Compliance";
import SavedMatchesPage from "./pages/SavedMatchesPage";
import MatchingDashboard from "./pages/MatchingDashboard";
import CreateJob from "./pages/CreateJob";
import CreateCandidateProfile from "./pages/CreateCandidateProfile";
import JobRecommendations from "./pages/JobRecommendations";
import CareerCoaching from "./pages/CareerCoaching";
import MatchComparison from "./pages/MatchComparison";
import MatchNotificationSettings from "./pages/MatchNotificationSettings";
import MyApplications from "./pages/MyApplications";
import ApplicationTimeline from "./pages/ApplicationTimeline";
import ProfileSettings from "./pages/ProfileSettings";
import DigestAnalytics from "./pages/DigestAnalytics";
import CandidateNotificationSettings from "./pages/CandidateNotificationSettings";
import SMSConfiguration from "./pages/SMSConfiguration";
import EnhancedNotificationAnalytics from "./pages/EnhancedNotificationAnalytics";
import NotificationTemplates from "./pages/NotificationTemplates";
import ScheduledNotifications from "./pages/ScheduledNotifications";
import { PWAUpdateNotification } from "./components/PWAUpdateNotification";
import MatchAnalytics from "./pages/MatchAnalytics";
import BulkMatchingOps from "./pages/BulkMatchingOps";
import SmartRecommendations from "./pages/SmartRecommendations";
import EmployerMatchDashboard from "./pages/EmployerMatchDashboard";
import MatchDigestSettings from "./pages/MatchDigestSettings";
import ProfileEnrichment from "./pages/ProfileEnrichment";
import MessageTemplateLibrary from "./pages/MessageTemplateLibrary";
import NotificationAnalyticsDashboard from "./pages/NotificationAnalyticsDashboard";
import TemplateAnalytics from "./pages/TemplateAnalytics";
import WorkflowAnalytics from "./pages/WorkflowAnalytics";
import NotificationABTesting from "./pages/NotificationABTesting";
import ABTestingDetail from "./pages/ABTestingDetail";
import BulkOperations from "./pages/BulkOperations";
import Analytics from "./pages/Analytics";
import TrainingCatalog from "./pages/TrainingCatalog";
import MyLearning from "./pages/MyLearning";
import JobSearch from "./pages/JobSearch";
import ResumeBuilder from "./pages/ResumeBuilder";
import CandidateNotificationPreferences from "./pages/CandidateNotificationPreferences";
import TrainingAnalyticsDashboard from "./pages/TrainingAnalyticsDashboard";
import MatchExplanationAbTestDashboard from "./pages/MatchExplanationAbTestDashboard";
import MatchHistoryAnalytics from "./pages/MatchHistoryAnalytics";
import CandidateMatchDashboard from "./pages/CandidateMatchDashboard";
import MatchNotifications from "./pages/MatchNotifications";
import BulkMatching from "./pages/BulkMatching";
import MatchFeedback from "./pages/MatchFeedback";
import AdminDashboard from "./pages/AdminDashboard";
import SmsCostDashboard from "./pages/SmsCostDashboard";
import JobExecutionHistory from "./pages/JobExecutionHistory";
import ExportHistory from "./pages/ExportHistory";
import BudgetSettings from "./pages/BudgetSettings";
import ScheduledExports from "./pages/ScheduledExports";
import BudgetForecasting from "./pages/BudgetForecasting";
import ImportHistory from "./pages/ImportHistory";
import ScheduledReports from "./pages/ScheduledReports";
import ComplianceAuditTrail from "./pages/ComplianceAuditTrail";
import ReportEmailTemplates from "./pages/ReportEmailTemplates";
import EmailTemplateEditor from "./pages/EmailTemplateEditor";
import AdvancedAnalyticsDashboard from "./pages/AdvancedAnalyticsDashboard";
import ComplianceAlertRulesManagement from "./pages/ComplianceAlertRulesManagement";
import JobMonitoring from "./pages/JobMonitoring";
import AdvancedExports from "./pages/AdvancedExports";
import CommandCenter from "./pages/CommandCenter";
import EmailDigest from "./pages/EmailDigest";
import BudgetTemplates from "./pages/BudgetTemplates";
import ABTestInsights from "./pages/ABTestInsights";
import TemplatePerformanceAlerts from "./pages/TemplatePerformanceAlerts";
import SmartCampaignScheduler from "./pages/SmartCampaignScheduler";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path={"/"} component={Home} />
      
      {/* Mobile candidate routes - public access via token */}
      <Route path={"/interview/respond/:token"} component={CandidateInterviewResponse} />
      <Route path={"/candidate/engagement/:token"} component={CandidateEngagementStatus} />
      
      {/* Mobile interviewer routes - quick feedback submission */}
      <Route path={"/mobile/feedback/:interviewId"} component={MobileInterviewFeedback} />
      
      {/* Admin/Dashboard routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/new" component={CampaignBuilder} />
      <Route path="/campaigns/:id/edit" component={CampaignBuilder} />
      <Route path="/candidates" component={CandidatesList} />
      <Route path="/candidates/:id" component={CandidateDetail} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/campaigns/:id/analytics" component={CampaignAnalytics} />
      <Route path="/interviews/:id" component={InterviewDetail} />
      <Route path="/analytics/feedback" component={FeedbackAnalytics} />
      <Route path="/analytics/feedback-enhanced" component={EnhancedFeedbackAnalytics} />
      <Route path="/analytics/templates" component={TemplateAnalytics} />
      <Route path="/ab-testing/dashboard" component={ABTestDashboard} />
      <Route path="/ab-testing/:id" component={ABTestResults} />
      <Route path="/ab-testing" component={ABTesting} />
      <Route path="/communication/ab-testing/:id" component={ABTestResults} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/enrichment" component={ProfileEnrichment} />
      <Route path="/bulk-operations" component={BulkOperations} />
      <Route path="/settings/feedback-templates" component={FeedbackTemplates} />
      <Route path="/settings/notifications" component={NotificationSettings} />
      <Route path="/settings/calendar" component={CalendarSettings} />
      <Route path="/settings/push-notifications" component={PushNotificationSettings} />
      <Route path="/settings/matching-preferences" component={MatchingPreferences} />
      <Route path="/notifications" component={NotificationCenter} />
      <Route path="/help" component={Help} />
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Phase 26: Financial Monitoring & Operational Integrity */}
      <Route path="/admin/sms-costs" component={SmsCostDashboard} />
      <Route path="/admin/job-executions" component={JobExecutionHistory} />
      <Route path="/admin/export-history" component={ExportHistory} />
      <Route path="/budget-settings" component={BudgetSettings} />
      <Route path="/scheduled-exports" component={ScheduledExports} />
      <Route path="/budget-forecasting" component={BudgetForecasting} />
      <Route path="/job-monitoring" component={JobMonitoring} />
      <Route path="/advanced-exports" component={AdvancedExports} />
      <Route path="/command-center" component={CommandCenter} />
      <Route path="/email-digest" component={EmailDigest} />
      <Route path="/budget-templates" component={BudgetTemplates} />
      <Route path="/analytics/ab-test-insights" component={ABTestInsights} />
      <Route path="/analytics/template-alerts" component={TemplatePerformanceAlerts} />
      <Route path="/campaigns/smart-scheduler" component={SmartCampaignScheduler} />
      
      {/* Import Management & Compliance Audit */}
      <Route path="/import-history" component={ImportHistory} />
      <Route path="/scheduled-reports" component={ScheduledReports} />
      <Route path="/compliance-audit" component={ComplianceAuditTrail} />
      <Route path="/report-email-templates" component={ReportEmailTemplates} />
      <Route path="/report-email-templates/new" component={EmailTemplateEditor} />
      <Route path="/report-email-templates/:id/edit" component={EmailTemplateEditor} />
      <Route path="/advanced-analytics" component={AdvancedAnalyticsDashboard} />
      <Route path="/compliance-alerts/rules" component={ComplianceAlertRulesManagement} />
      
      {/* AI Matching routes */}
      <Route path="/ai-matching" component={AIMatching} />
      <Route path="/ai-matching-enhanced" component={AIMatchingEnhanced} />
      <Route path="/saved-matches" component={SavedMatchesPage} />
      <Route path="/jobs" component={Jobs} />
      
      {/* Compliance & Insights routes */}
      <Route path="/compliance" component={Compliance} />
      <Route path="/ksa-compliance" component={KSACompliance} />
      <Route path="/compliance/dashboard" component={ComplianceDashboard} />
      <Route path="/compliance/alerts" component={ComplianceAlertsDashboard} />
      <Route path="/compliance/analytics" component={ComplianceAnalytics} />
      <Route path="/compliance/labor-law" component={LaborLawCompliance} />
      <Route path="/compliance/work-permits" component={WorkPermitManagement} />
      <Route path="/visa-compliance" component={VisaComplianceDashboard} />
      <Route path="/whatsapp-settings" component={WhatsAppSettings} />
      <Route path="/employee-import" component={EmployeeImport} />
      <Route path="/compliance-reports" component={ComplianceReports} />
      <Route path="/compliance/bulk-iqama-validation" component={BulkIqamaValidation} />
      <Route path="/insights/candidate" component={CandidateInsights} />
      
      {/* Communication features */}
      <Route path="/communication/email-engagement" component={EmailEngagementDashboard} />
      <Route path="/communication/broadcast" component={BulkBroadcastEnhanced} />
      <Route path="/communication/automation" component={EmailAutomation} />
      <Route path="/communication/workflow-analytics" component={WorkflowAnalytics} />
      <Route path="/communication/ab-testing" component={EmailABTesting} />
      <Route path="/communication/templates" component={EmailTemplateLibrary} />
      <Route path="/template-gallery" component={CampaignTemplateLibrary} />
      <Route path="/communication/sms-config" component={SmsProviderConfig} />
      <Route path="/settings/sms-configuration" component={SMSConfiguration} />
            <Route path={"/engagement-scores"} component={EngagementScoreDashboard} />
      <Route path={"/template-automation"} component={TemplateAutomation} />
      <Route path={"/sms-campaigns"} component={SmsCampaignBuilder} />
      <Route path={"/engagement-alerts"} component={EngagementAlertsManagement} />
      <Route path={"/automation-testing"} component={AutomationTesting} />
      <Route path={'/automation-testing/analytics'} component={AutomationTestingAnalytics} />
      
      {/* AI Matching routes */}
      <Route path="/ai-matching" component={AIMatchingDashboard} />
      <Route path="/matching" component={MatchingDashboard} />
      <Route path="/saved-matches" component={SavedMatches} />
      <Route path="/jobs/new" component={CreateJob} />
      <Route path="/candidates/new" component={CreateCandidateProfile} />
      <Route path="/job-recommendations" component={JobRecommendations} />
      <Route path="/career-coaching" component={CareerCoaching} />
      <Route path="/match-comparison" component={MatchComparison} />
      <Route path="/settings/match-notifications" component={MatchNotificationSettings} />
      
      {/* B2C Job Seeker routes */}
      <Route path={"/candidate/match-dashboard"} component={CandidateMatchDashboard} />
      <Route path={"/match-notifications"} component={MatchNotifications} />
      <Route path={"/bulk-matching"} component={BulkMatching} />
      <Route path={"/match-feedback"} component={MatchFeedback} />
      <Route path="/training" component={TrainingCatalog} />
      <Route path="/my-learning" component={MyLearning} />
      <Route path="/job-search" component={JobSearch} />
      <Route path="/profile/resume" component={ResumeBuilder} />
      
      {/* Application Tracking routes */}
      <Route path="/applications" component={MyApplications} />
      <Route path="/applications/:id" component={ApplicationTimeline} />
      
      {/* Analytics routes */}
      <Route path="/analytics/digest" component={DigestAnalytics} />
      <Route path="/analytics/notifications-enhanced" component={EnhancedNotificationAnalytics} />
      
      {/* Notification Management routes */}
      <Route path="/notifications/templates" component={NotificationTemplates} />
      <Route path="/notifications/scheduled" component={ScheduledNotifications} />
      
      {/* Profile Settings */}
      <Route path="/settings/profile" component={ProfileSettings} />
      <Route path="/settings/candidate-notifications" component={CandidateNotificationSettings} />
      
      {/* Advanced Analytics & Operations */}
      <Route path="/match-analytics" component={MatchAnalytics} />
      <Route path="/match-history-analytics" component={MatchHistoryAnalytics} />
      <Route path="/bulk-matching" component={BulkMatchingOps} />
      <Route path="/smart-recommendations" component={SmartRecommendations} />
      <Route path="/employer-match-dashboard" component={EmployerMatchDashboard} />
      <Route path="/match-digest-settings" component={MatchDigestSettings} />
        <Route path="/profile-enrichment" component={ProfileEnrichment} />
      <Route path="/message-templates" component={MessageTemplateLibrary} />
      <Route path="/notification-analytics-dashboard" component={NotificationAnalyticsDashboard} />
      <Route path="/bulk-operations" component={BulkOperations} />
      
      {/* Retention & Analytics Sprint Routes */}
      <Route path="/candidate/notification-preferences" component={CandidateNotificationPreferences} />
      <Route path="/training-analytics" component={TrainingAnalyticsDashboard} />
      <Route path="/match-explanation-ab-test" component={MatchExplanationAbTestDashboard} />
      
      {/* Fallback routes */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PWAUpdateNotification />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
