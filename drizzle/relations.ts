import { relations } from "drizzle-orm/relations";
import { performanceAlerts, alertHistory, emailTemplates, users, syncJobs, apiLogs, candidates, applications, jobs, employers, atsIntegrations, betaSignups, betaFeedback, betaOnboardingProgress, billingRecords, bulkSchedulingOperations, calendarConnections, calendarEvents, emailCampaigns, campaignExecutions, emailAbTests, campaignPerformanceSnapshots, campaignTriggers, candidateAttributes, candidateAvailability, candidateEngagementScores, candidateLists, candidateValueScores, coachingSessions, emailAbVariants, emailAnalytics, emailBranding, emailCampaignVariants, emailTemplateLibrary, emailTemplateCategories, employeeSkills, employeeSurveys, engagementAlerts, engagementScoreHistory, engagementThresholds, jobAttributes, ksaCoachingSessions, listMembers, notificationHistory, notificationAnalytics, notificationPreferences, predictiveInsights, pushSubscriptions, retentionMetrics, savedJobs, shifts, skillGapAnalysis, smsProviderConfigs, strategicRoi, talentPool, teamMetrics, testScenarios, testCampaigns, testExecutions, testData, testResults, testTriggers, userNotificationPreferences, videoInterviews } from "./schema";

export const alertHistoryRelations = relations(alertHistory, ({one}) => ({
	performanceAlert: one(performanceAlerts, {
		fields: [alertHistory.alertId],
		references: [performanceAlerts.id]
	}),
	emailTemplate: one(emailTemplates, {
		fields: [alertHistory.templateId],
		references: [emailTemplates.id]
	}),
	user: one(users, {
		fields: [alertHistory.acknowledgedBy],
		references: [users.id]
	}),
}));

export const performanceAlertsRelations = relations(performanceAlerts, ({one, many}) => ({
	alertHistories: many(alertHistory),
	employer: one(employers, {
		fields: [performanceAlerts.employerId],
		references: [employers.id]
	}),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({one, many}) => ({
	alertHistories: many(alertHistory),
	emailAbVariants: many(emailAbVariants),
	employer: one(employers, {
		fields: [emailTemplates.employerId],
		references: [employers.id]
	}),
	testCampaigns: many(testCampaigns),
}));

export const usersRelations = relations(users, ({many}) => ({
	alertHistories: many(alertHistory),
	betaFeedbacks_submittedBy: many(betaFeedback, {
		relationName: "betaFeedback_submittedBy_users_id"
	}),
	betaFeedbacks_respondedBy: many(betaFeedback, {
		relationName: "betaFeedback_respondedBy_users_id"
	}),
	betaSignups: many(betaSignups),
	calendarConnections: many(calendarConnections),
	candidates: many(candidates),
	employers: many(employers),
	notificationAnalytics: many(notificationAnalytics),
	notificationHistories: many(notificationHistory),
	pushSubscriptions: many(pushSubscriptions),
	testExecutions: many(testExecutions),
	testScenarios: many(testScenarios),
	userNotificationPreferences: many(userNotificationPreferences),
}));

export const apiLogsRelations = relations(apiLogs, ({one}) => ({
	syncJob: one(syncJobs, {
		fields: [apiLogs.syncJobId],
		references: [syncJobs.id]
	}),
}));

export const syncJobsRelations = relations(syncJobs, ({many}) => ({
	apiLogs: many(apiLogs),
}));

export const applicationsRelations = relations(applications, ({one, many}) => ({
	candidate: one(candidates, {
		fields: [applications.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [applications.jobId],
		references: [jobs.id]
	}),
	campaignExecutions: many(campaignExecutions),
	retentionMetrics: many(retentionMetrics),
	videoInterviews: many(videoInterviews),
}));

export const candidatesRelations = relations(candidates, ({one, many}) => ({
	applications: many(applications),
	campaignExecutions: many(campaignExecutions),
	candidateAttributes: many(candidateAttributes),
	candidateAvailabilities: many(candidateAvailability),
	candidateEngagementScores: many(candidateEngagementScores),
	candidateValueScores: many(candidateValueScores),
	user: one(users, {
		fields: [candidates.userId],
		references: [users.id]
	}),
	coachingSessions: many(coachingSessions),
	engagementAlerts: many(engagementAlerts),
	engagementScoreHistories: many(engagementScoreHistory),
	ksaCoachingSessions: many(ksaCoachingSessions),
	listMembers: many(listMembers),
	retentionMetrics: many(retentionMetrics),
	savedJobs: many(savedJobs),
	strategicRois: many(strategicRoi),
	talentPools: many(talentPool),
	videoInterviews: many(videoInterviews),
}));

export const jobsRelations = relations(jobs, ({one, many}) => ({
	applications: many(applications),
	bulkSchedulingOperations: many(bulkSchedulingOperations),
	jobAttributes: many(jobAttributes),
	employer: one(employers, {
		fields: [jobs.employerId],
		references: [employers.id]
	}),
	savedJobs: many(savedJobs),
	strategicRois: many(strategicRoi),
	talentPools: many(talentPool),
	videoInterviews: many(videoInterviews),
}));

export const atsIntegrationsRelations = relations(atsIntegrations, ({one}) => ({
	employer: one(employers, {
		fields: [atsIntegrations.employerId],
		references: [employers.id]
	}),
}));

export const employersRelations = relations(employers, ({one, many}) => ({
	atsIntegrations: many(atsIntegrations),
	billingRecords: many(billingRecords),
	bulkSchedulingOperations: many(bulkSchedulingOperations),
	candidateLists: many(candidateLists),
	emailAbTests: many(emailAbTests),
	emailAnalytics: many(emailAnalytics),
	emailBrandings: many(emailBranding),
	emailTemplateLibraries: many(emailTemplateLibrary),
	emailTemplates: many(emailTemplates),
	employeeSkills: many(employeeSkills),
	employeeSurveys: many(employeeSurveys),
	user: one(users, {
		fields: [employers.userId],
		references: [users.id]
	}),
	engagementAlerts: many(engagementAlerts),
	engagementThresholds: many(engagementThresholds),
	jobs: many(jobs),
	notificationPreferences: many(notificationPreferences),
	performanceAlerts: many(performanceAlerts),
	predictiveInsights: many(predictiveInsights),
	retentionMetrics: many(retentionMetrics),
	shifts: many(shifts),
	skillGapAnalyses: many(skillGapAnalysis),
	smsProviderConfigs: many(smsProviderConfigs),
	strategicRois: many(strategicRoi),
	talentPools: many(talentPool),
	teamMetrics: many(teamMetrics),
	videoInterviews: many(videoInterviews),
}));

export const betaFeedbackRelations = relations(betaFeedback, ({one}) => ({
	betaSignup: one(betaSignups, {
		fields: [betaFeedback.signupId],
		references: [betaSignups.id]
	}),
	user_submittedBy: one(users, {
		fields: [betaFeedback.submittedBy],
		references: [users.id],
		relationName: "betaFeedback_submittedBy_users_id"
	}),
	user_respondedBy: one(users, {
		fields: [betaFeedback.respondedBy],
		references: [users.id],
		relationName: "betaFeedback_respondedBy_users_id"
	}),
}));

export const betaSignupsRelations = relations(betaSignups, ({one, many}) => ({
	betaFeedbacks: many(betaFeedback),
	betaOnboardingProgresses: many(betaOnboardingProgress),
	user: one(users, {
		fields: [betaSignups.approvedBy],
		references: [users.id]
	}),
}));

export const betaOnboardingProgressRelations = relations(betaOnboardingProgress, ({one}) => ({
	betaSignup: one(betaSignups, {
		fields: [betaOnboardingProgress.signupId],
		references: [betaSignups.id]
	}),
}));

export const billingRecordsRelations = relations(billingRecords, ({one}) => ({
	employer: one(employers, {
		fields: [billingRecords.employerId],
		references: [employers.id]
	}),
}));

export const bulkSchedulingOperationsRelations = relations(bulkSchedulingOperations, ({one}) => ({
	employer: one(employers, {
		fields: [bulkSchedulingOperations.employerId],
		references: [employers.id]
	}),
	job: one(jobs, {
		fields: [bulkSchedulingOperations.jobId],
		references: [jobs.id]
	}),
}));

export const calendarConnectionsRelations = relations(calendarConnections, ({one, many}) => ({
	user: one(users, {
		fields: [calendarConnections.userId],
		references: [users.id]
	}),
	calendarEvents: many(calendarEvents),
}));

export const calendarEventsRelations = relations(calendarEvents, ({one}) => ({
	calendarConnection: one(calendarConnections, {
		fields: [calendarEvents.connectionId],
		references: [calendarConnections.id]
	}),
}));

export const campaignExecutionsRelations = relations(campaignExecutions, ({one}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [campaignExecutions.campaignId],
		references: [emailCampaigns.id]
	}),
	candidate: one(candidates, {
		fields: [campaignExecutions.candidateId],
		references: [candidates.id]
	}),
	application: one(applications, {
		fields: [campaignExecutions.applicationId],
		references: [applications.id]
	}),
}));

export const emailCampaignsRelations = relations(emailCampaigns, ({many}) => ({
	campaignExecutions: many(campaignExecutions),
	campaignTriggers: many(campaignTriggers),
}));

export const campaignPerformanceSnapshotsRelations = relations(campaignPerformanceSnapshots, ({one}) => ({
	emailAbTest: one(emailAbTests, {
		fields: [campaignPerformanceSnapshots.testId],
		references: [emailAbTests.id]
	}),
}));

export const emailAbTestsRelations = relations(emailAbTests, ({one, many}) => ({
	campaignPerformanceSnapshots: many(campaignPerformanceSnapshots),
	employer: one(employers, {
		fields: [emailAbTests.employerId],
		references: [employers.id]
	}),
	emailAbVariants: many(emailAbVariants),
	emailCampaignVariants: many(emailCampaignVariants),
}));

export const campaignTriggersRelations = relations(campaignTriggers, ({one}) => ({
	emailCampaign: one(emailCampaigns, {
		fields: [campaignTriggers.campaignId],
		references: [emailCampaigns.id]
	}),
}));

export const candidateAttributesRelations = relations(candidateAttributes, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateAttributes.candidateId],
		references: [candidates.id]
	}),
}));

export const candidateAvailabilityRelations = relations(candidateAvailability, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateAvailability.candidateId],
		references: [candidates.id]
	}),
}));

export const candidateEngagementScoresRelations = relations(candidateEngagementScores, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateEngagementScores.candidateId],
		references: [candidates.id]
	}),
}));

export const candidateListsRelations = relations(candidateLists, ({one, many}) => ({
	employer: one(employers, {
		fields: [candidateLists.employerId],
		references: [employers.id]
	}),
	listMembers: many(listMembers),
}));

export const candidateValueScoresRelations = relations(candidateValueScores, ({one}) => ({
	candidate: one(candidates, {
		fields: [candidateValueScores.candidateId],
		references: [candidates.id]
	}),
}));

export const coachingSessionsRelations = relations(coachingSessions, ({one}) => ({
	candidate: one(candidates, {
		fields: [coachingSessions.candidateId],
		references: [candidates.id]
	}),
}));

export const emailAbVariantsRelations = relations(emailAbVariants, ({one}) => ({
	emailAbTest: one(emailAbTests, {
		fields: [emailAbVariants.testId],
		references: [emailAbTests.id]
	}),
	emailTemplate: one(emailTemplates, {
		fields: [emailAbVariants.templateId],
		references: [emailTemplates.id]
	}),
}));

export const emailAnalyticsRelations = relations(emailAnalytics, ({one}) => ({
	employer: one(employers, {
		fields: [emailAnalytics.employerId],
		references: [employers.id]
	}),
}));

export const emailBrandingRelations = relations(emailBranding, ({one}) => ({
	employer: one(employers, {
		fields: [emailBranding.employerId],
		references: [employers.id]
	}),
}));

export const emailCampaignVariantsRelations = relations(emailCampaignVariants, ({one}) => ({
	emailAbTest: one(emailAbTests, {
		fields: [emailCampaignVariants.testId],
		references: [emailAbTests.id]
	}),
}));

export const emailTemplateLibraryRelations = relations(emailTemplateLibrary, ({one}) => ({
	employer: one(employers, {
		fields: [emailTemplateLibrary.employerId],
		references: [employers.id]
	}),
	emailTemplateCategory: one(emailTemplateCategories, {
		fields: [emailTemplateLibrary.categoryId],
		references: [emailTemplateCategories.id]
	}),
}));

export const emailTemplateCategoriesRelations = relations(emailTemplateCategories, ({many}) => ({
	emailTemplateLibraries: many(emailTemplateLibrary),
}));

export const employeeSkillsRelations = relations(employeeSkills, ({one}) => ({
	employer: one(employers, {
		fields: [employeeSkills.employerId],
		references: [employers.id]
	}),
}));

export const employeeSurveysRelations = relations(employeeSurveys, ({one}) => ({
	employer: one(employers, {
		fields: [employeeSurveys.employerId],
		references: [employers.id]
	}),
}));

export const engagementAlertsRelations = relations(engagementAlerts, ({one}) => ({
	employer: one(employers, {
		fields: [engagementAlerts.employerId],
		references: [employers.id]
	}),
	candidate: one(candidates, {
		fields: [engagementAlerts.candidateId],
		references: [candidates.id]
	}),
}));

export const engagementScoreHistoryRelations = relations(engagementScoreHistory, ({one}) => ({
	candidate: one(candidates, {
		fields: [engagementScoreHistory.candidateId],
		references: [candidates.id]
	}),
}));

export const engagementThresholdsRelations = relations(engagementThresholds, ({one}) => ({
	employer: one(employers, {
		fields: [engagementThresholds.employerId],
		references: [employers.id]
	}),
}));

export const jobAttributesRelations = relations(jobAttributes, ({one}) => ({
	job: one(jobs, {
		fields: [jobAttributes.jobId],
		references: [jobs.id]
	}),
}));

export const ksaCoachingSessionsRelations = relations(ksaCoachingSessions, ({one}) => ({
	candidate: one(candidates, {
		fields: [ksaCoachingSessions.candidateId],
		references: [candidates.id]
	}),
}));

export const listMembersRelations = relations(listMembers, ({one}) => ({
	candidateList: one(candidateLists, {
		fields: [listMembers.listId],
		references: [candidateLists.id]
	}),
	candidate: one(candidates, {
		fields: [listMembers.candidateId],
		references: [candidates.id]
	}),
}));

export const notificationAnalyticsRelations = relations(notificationAnalytics, ({one}) => ({
	notificationHistory: one(notificationHistory, {
		fields: [notificationAnalytics.notificationId],
		references: [notificationHistory.id]
	}),
	user: one(users, {
		fields: [notificationAnalytics.userId],
		references: [users.id]
	}),
}));

export const notificationHistoryRelations = relations(notificationHistory, ({one, many}) => ({
	notificationAnalytics: many(notificationAnalytics),
	user: one(users, {
		fields: [notificationHistory.userId],
		references: [users.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	employer: one(employers, {
		fields: [notificationPreferences.employerId],
		references: [employers.id]
	}),
}));

export const predictiveInsightsRelations = relations(predictiveInsights, ({one}) => ({
	employer: one(employers, {
		fields: [predictiveInsights.employerId],
		references: [employers.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
}));

export const retentionMetricsRelations = relations(retentionMetrics, ({one}) => ({
	candidate: one(candidates, {
		fields: [retentionMetrics.candidateId],
		references: [candidates.id]
	}),
	employer: one(employers, {
		fields: [retentionMetrics.employerId],
		references: [employers.id]
	}),
	application: one(applications, {
		fields: [retentionMetrics.applicationId],
		references: [applications.id]
	}),
}));

export const savedJobsRelations = relations(savedJobs, ({one}) => ({
	candidate: one(candidates, {
		fields: [savedJobs.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [savedJobs.jobId],
		references: [jobs.id]
	}),
}));

export const shiftsRelations = relations(shifts, ({one}) => ({
	employer: one(employers, {
		fields: [shifts.employerId],
		references: [employers.id]
	}),
}));

export const skillGapAnalysisRelations = relations(skillGapAnalysis, ({one}) => ({
	employer: one(employers, {
		fields: [skillGapAnalysis.employerId],
		references: [employers.id]
	}),
}));

export const smsProviderConfigsRelations = relations(smsProviderConfigs, ({one}) => ({
	employer: one(employers, {
		fields: [smsProviderConfigs.employerId],
		references: [employers.id]
	}),
}));

export const strategicRoiRelations = relations(strategicRoi, ({one}) => ({
	employer: one(employers, {
		fields: [strategicRoi.employerId],
		references: [employers.id]
	}),
	candidate: one(candidates, {
		fields: [strategicRoi.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [strategicRoi.jobId],
		references: [jobs.id]
	}),
}));

export const talentPoolRelations = relations(talentPool, ({one}) => ({
	employer: one(employers, {
		fields: [talentPool.employerId],
		references: [employers.id]
	}),
	candidate: one(candidates, {
		fields: [talentPool.candidateId],
		references: [candidates.id]
	}),
	job: one(jobs, {
		fields: [talentPool.addedFromJobId],
		references: [jobs.id]
	}),
}));

export const teamMetricsRelations = relations(teamMetrics, ({one}) => ({
	employer: one(employers, {
		fields: [teamMetrics.employerId],
		references: [employers.id]
	}),
}));

export const testCampaignsRelations = relations(testCampaigns, ({one}) => ({
	testScenario: one(testScenarios, {
		fields: [testCampaigns.scenarioId],
		references: [testScenarios.id]
	}),
	emailTemplate: one(emailTemplates, {
		fields: [testCampaigns.templateId],
		references: [emailTemplates.id]
	}),
}));

export const testScenariosRelations = relations(testScenarios, ({one, many}) => ({
	testCampaigns: many(testCampaigns),
	testExecutions: many(testExecutions),
	user: one(users, {
		fields: [testScenarios.createdBy],
		references: [users.id]
	}),
	testTriggers: many(testTriggers),
}));

export const testDataRelations = relations(testData, ({one}) => ({
	testExecution: one(testExecutions, {
		fields: [testData.executionId],
		references: [testExecutions.id]
	}),
}));

export const testExecutionsRelations = relations(testExecutions, ({one, many}) => ({
	testData: many(testData),
	testScenario: one(testScenarios, {
		fields: [testExecutions.scenarioId],
		references: [testScenarios.id]
	}),
	user: one(users, {
		fields: [testExecutions.executedBy],
		references: [users.id]
	}),
	testResults: many(testResults),
}));

export const testResultsRelations = relations(testResults, ({one}) => ({
	testExecution: one(testExecutions, {
		fields: [testResults.executionId],
		references: [testExecutions.id]
	}),
}));

export const testTriggersRelations = relations(testTriggers, ({one}) => ({
	testScenario: one(testScenarios, {
		fields: [testTriggers.scenarioId],
		references: [testScenarios.id]
	}),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({one}) => ({
	user: one(users, {
		fields: [userNotificationPreferences.userId],
		references: [users.id]
	}),
}));

export const videoInterviewsRelations = relations(videoInterviews, ({one}) => ({
	application: one(applications, {
		fields: [videoInterviews.applicationId],
		references: [applications.id]
	}),
	candidate: one(candidates, {
		fields: [videoInterviews.candidateId],
		references: [candidates.id]
	}),
	employer: one(employers, {
		fields: [videoInterviews.employerId],
		references: [employers.id]
	}),
	job: one(jobs, {
		fields: [videoInterviews.jobId],
		references: [jobs.id]
	}),
}));