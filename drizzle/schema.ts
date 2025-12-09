import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, timestamp, mysqlEnum, text, foreignKey, varchar, json, tinyint, bigint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"
import { decimal } from "drizzle-orm/mysql-core"

export const abTestResultsLegacy = mysqlTable("abTestResults", {
	id: int().autoincrement().notNull(),
	testId: int().notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	testDuration: int(),
	winnerVariantId: int(),
	winnerDeterminedAt: timestamp({ mode: 'string' }),
	winnerDeterminedBy: mysqlEnum(['automatic','manual']),
	statisticalSignificance: int().default(0),
	pValue: int().default(0),
	confidenceLevel: int().default(95),
	variantAopenRate: int().default(0),
	variantBopenRate: int().default(0),
	variantAclickRate: int().default(0),
	variantBclickRate: int().default(0),
	relativeImprovement: int().default(0),
	absoluteImprovement: int().default(0),
	recommendation: text(),
	appliedToProduction: tinyint().default(0),
	appliedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
	index("winnerVariantId_idx").on(table.winnerVariantId),
	index("appliedToProduction_idx").on(table.appliedToProduction),
]);

export const alertHistory = mysqlTable("alertHistory", {
	id: int().autoincrement().notNull(),
	alertId: int().notNull().references(() => performanceAlerts.id, { onDelete: "cascade" } ),
	triggeredAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	metricValue: int(),
	benchmarkValue: int(),
	campaignId: int(),
	templateId: int().references(() => emailTemplates.id, { onDelete: "set null" } ),
	alertMessage: text(),
	severity: mysqlEnum(['info','warning','critical']).default('info'),
	acknowledged: tinyint().default(0),
	acknowledgedBy: int().references(() => users.id, { onDelete: "set null" } ),
	acknowledgedAt: timestamp({ mode: 'string' }),
	notes: text(),
},
(table) => [
	index("alertId_idx").on(table.alertId),
]);

export const apiCredentials = mysqlTable("apiCredentials", {
	id: int().autoincrement().notNull(),
	serviceName: mysqlEnum(['qiwa','mhrsd','mol','gosi']).notNull(),
	environment: mysqlEnum(['sandbox','production']).default('sandbox').notNull(),
	credentialType: mysqlEnum(['oauth2','api_key','jwt']).notNull(),
	clientId: text(),
	clientSecret: text(),
	apiKey: text(),
	accessToken: text(),
	refreshToken: text(),
	tokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	endpointBaseUrl: varchar({ length: 500 }),
	status: mysqlEnum(['active','expired','revoked','pending']).default('pending').notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const apiLogs = mysqlTable("apiLogs", {
	id: int().autoincrement().notNull(),
	serviceName: mysqlEnum(['qiwa','mhrsd','mol','gosi']).notNull(),
	endpoint: varchar({ length: 500 }).notNull(),
	method: mysqlEnum(['GET','POST','PUT','PATCH','DELETE']).notNull(),
	requestHeaders: json(),
	requestBody: text(),
	responseStatus: int(),
	responseHeaders: json(),
	responseBody: text(),
	responseTime: int(),
	success: tinyint().notNull(),
	errorMessage: text(),
	syncJobId: int().references(() => syncJobs.id, { onDelete: "set null" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const applications = mysqlTable("applications", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	coverLetter: text(),
	overallMatchScore: int(),
	skillMatchScore: int(),
	cultureFitScore: int(),
	wellbeingMatchScore: int(),
	matchBreakdown: json(),
	status: mysqlEnum(['submitted','screening','interviewing','offered','rejected']).default('submitted'),
	qualifiesForBilling: tinyint().default(0),
	billingAmount: int(),
	atsSynced: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	isFavorite: tinyint().default(0),
	withdrawnAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
]);

export const applicationTimeline = mysqlTable("applicationTimeline", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id, { onDelete: "cascade" }),
	eventType: mysqlEnum(['status_change', 'interview_scheduled', 'feedback_submitted', 'note_added', 'document_uploaded']).notNull(),
	eventDescription: text().notNull(),
	oldValue: text(),
	newValue: text(),
	performedBy: int().references(() => users.id, { onDelete: "set null" }),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("applicationId_idx").on(table.applicationId),
	index("eventType_idx").on(table.eventType),
]);

export const atsIntegrations = mysqlTable("atsIntegrations", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	atsSystem: varchar({ length: 100 }).notNull(),
	atsApiKey: text(),
	atsEndpoint: varchar({ length: 500 }),
	autoSync: tinyint().default(1),
	lastSync: timestamp({ mode: 'string' }),
	status: mysqlEnum(['active','inactive']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const automationLogs = mysqlTable("automation_logs", {
	id: int().autoincrement().notNull(),
	triggerId: int("trigger_id").notNull(),
	candidateId: int("candidate_id").notNull(),
	eventType: varchar("event_type", { length: 100 }).notNull(),
	status: mysqlEnum(['pending','sent','failed']).notNull(),
	emailSent: tinyint("email_sent").default(0).notNull(),
	errorMessage: text("error_message"),
	executedAt: timestamp("executed_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const automationTriggers = mysqlTable("automation_triggers", {
	id: int().autoincrement().notNull(),
	employerId: int("employer_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	eventType: mysqlEnum("event_type", ['application_received','interview_scheduled','interview_completed','offer_extended','offer_accepted','offer_rejected','candidate_registered']).notNull(),
	templateId: int("template_id").notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	conditions: text(),
	delayMinutes: int("delay_minutes").default(0),
	timesTriggered: int("times_triggered").default(0).notNull(),
	lastTriggeredAt: timestamp("last_triggered_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const betaFeedback = mysqlTable("betaFeedback", {
	id: int().autoincrement().notNull(),
	signupId: int().notNull().references(() => betaSignups.id, { onDelete: "cascade" } ),
	submittedBy: int().notNull().references(() => users.id),
	category: mysqlEnum(['bug','feature_request','usability','performance','general']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium'),
	status: mysqlEnum(['new','acknowledged','in_progress','resolved','wont_fix']).default('new').notNull(),
	rating: int(),
	attachmentUrls: json(),
	adminResponse: text(),
	respondedBy: int().references(() => users.id),
	respondedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const betaOnboardingProgress = mysqlTable("betaOnboardingProgress", {
	id: int().autoincrement().notNull(),
	signupId: int().notNull().references(() => betaSignups.id, { onDelete: "cascade" } ),
	currentStep: int().default(1).notNull(),
	totalSteps: int().default(5).notNull(),
	step1Completed: tinyint().default(0),
	step2Completed: tinyint().default(0),
	step3Completed: tinyint().default(0),
	step4Completed: tinyint().default(0),
	step5Completed: tinyint().default(0),
	step1Data: json(),
	step2Data: json(),
	step3Data: json(),
	step4Data: json(),
	step5Data: json(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const betaSignups = mysqlTable("betaSignups", {
	id: int().autoincrement().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	contactName: varchar({ length: 255 }).notNull(),
	contactEmail: varchar({ length: 320 }).notNull(),
	contactPhone: varchar({ length: 50 }),
	industry: varchar({ length: 100 }),
	companySize: mysqlEnum(['1-10','11-50','51-200','201-500','501+']),
	currentAts: varchar({ length: 255 }),
	painPoints: text(),
	expectedHires: int(),
	status: mysqlEnum(['pending','approved','rejected','active','completed']).default('pending').notNull(),
	approvedBy: int().references(() => users.id),
	approvedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const billingRecords = mysqlTable("billingRecords", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	qualifiedApplications: int().default(0),
	scheduledInterviews: int().default(0),
	totalAmount: int().notNull(),
	status: mysqlEnum(['pending','paid']).default('pending'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const broadcastMessages = mysqlTable("broadcastMessages", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	createdBy: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	messageType: mysqlEnum(['sms','whatsapp','email']).notNull(),
	messageContent: text().notNull(),
	emailSubject: varchar({ length: 500 }),
	emailHtml: text(),
	targetAudience: mysqlEnum(['all_candidates','filtered','manual_selection']).default('all_candidates').notNull(),
	filterCriteria: json(),
	status: mysqlEnum(['draft','scheduled','sending','sent','failed','cancelled']).default('draft').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	totalRecipients: int().default(0),
	successCount: int().default(0),
	failureCount: int().default(0),
	estimatedCost: int().default(0),
	actualCost: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("createdBy_idx").on(table.createdBy),
	index("status_idx").on(table.status),
	index("messageType_idx").on(table.messageType),
	index("scheduledAt_idx").on(table.scheduledAt),
]);

export const broadcastRecipients = mysqlTable("broadcastRecipients", {
	id: int().autoincrement().notNull(),
	broadcastId: int().notNull(),
	candidateId: int(),
	recipientName: varchar({ length: 255 }),
	recipientEmail: varchar({ length: 320 }),
	recipientPhone: varchar({ length: 50 }),
	deliveryStatus: mysqlEnum(['pending','sent','delivered','failed','bounced','opted_out']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	opened: tinyint().default(0),
	openedAt: timestamp({ mode: 'string' }),
	clicked: tinyint().default(0),
	clickedAt: timestamp({ mode: 'string' }),
	externalMessageId: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("broadcastId_idx").on(table.broadcastId),
	index("candidateId_idx").on(table.candidateId),
	index("deliveryStatus_idx").on(table.deliveryStatus),
]);

export const bulkSchedulingOperations = mysqlTable("bulkSchedulingOperations", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	jobId: int().references(() => jobs.id, { onDelete: "cascade" } ),
	operationName: varchar({ length: 255 }).notNull(),
	totalCandidates: int().notNull(),
	scheduledCount: int().default(0),
	conflictCount: int().default(0),
	failedCount: int().default(0),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	schedulingRules: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("status_idx").on(table.status),
]);

export const calendarConnections = mysqlTable("calendarConnections", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	calendarProvider: mysqlEnum(['google','outlook']).notNull(),
	calendarId: varchar({ length: 255 }).notNull(),
	calendarName: varchar({ length: 255 }),
	isDefault: tinyint().default(0),
	isActive: tinyint().default(1),
	lastSyncAt: timestamp({ mode: 'string' }),
	syncStatus: mysqlEnum(['active','error','paused']).default('active'),
	syncError: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("isActive_idx").on(table.isActive),
	index("isDefault_idx").on(table.isDefault),
]);

export const calendarEvents = mysqlTable("calendarEvents", {
	id: int().autoincrement().notNull(),
	connectionId: int().notNull().references(() => calendarConnections.id, { onDelete: "cascade" } ),
	externalEventId: varchar({ length: 255 }).notNull(),
	summary: text(),
	description: text(),
	location: text(),
	startTime: timestamp({ mode: 'string' }).notNull(),
	endTime: timestamp({ mode: 'string' }).notNull(),
	isAllDay: tinyint().default(0),
	status: mysqlEnum(['confirmed','tentative','cancelled']).default('confirmed'),
	attendees: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("connectionId_idx").on(table.connectionId),
	index("startTime_idx").on(table.startTime),
	index("endTime_idx").on(table.endTime),
	index("externalEventId_idx").on(table.externalEventId),
]);

export const campaignExecutions = mysqlTable("campaignExecutions", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull().references(() => emailCampaigns.id, { onDelete: "cascade" } ),
	candidateId: int().references(() => candidates.id, { onDelete: "cascade" } ),
	applicationId: int().references(() => applications.id, { onDelete: "cascade" } ),
	currentStep: varchar({ length: 255 }),
	executionData: json(),
	status: mysqlEnum(['pending','running','completed','failed','paused']).default('pending').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const campaignPerformanceSnapshots = mysqlTable("campaignPerformanceSnapshots", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => emailAbTests.id, { onDelete: "cascade" } ),
	variantId: int().notNull(),
	snapshotDate: timestamp({ mode: 'string' }).notNull(),
	sentCount: int().default(0),
	openCount: int().default(0),
	clickCount: int().default(0),
	conversionCount: int().default(0),
	openRate: int().default(0),
	clickRate: int().default(0),
	conversionRate: int().default(0),
	statisticalSignificance: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
	index("variantId_idx").on(table.variantId),
	index("snapshotDate_idx").on(table.snapshotDate),
]);

export const campaignTriggers = mysqlTable("campaignTriggers", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull().references(() => emailCampaigns.id, { onDelete: "cascade" } ),
	triggerType: mysqlEnum(['application_submitted','interview_scheduled','interview_completed','application_rejected','email_opened','email_clicked','time_delay']).notNull(),
	triggerConditions: json(),
	delayMinutes: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const candidateAttributes = mysqlTable("candidateAttributes", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	communicationScore: int(),
	leadershipScore: int(),
	teamworkScore: int(),
	problemSolvingScore: int(),
	adaptabilityScore: int(),
	creativityScore: int(),
	criticalThinkingScore: int(),
	emotionalIntelligenceScore: int(),
	empathyScore: int(),
	selfAwarenessScore: int(),
	preferredWorkPace: mysqlEnum(['fast','moderate','methodical']),
	preferredTeamSize: mysqlEnum(['solo','small','medium','large']),
	preferredManagementStyle: mysqlEnum(['hands_on','collaborative','autonomous']),
	preferredCommunicationStyle: mysqlEnum(['direct','collaborative','formal','informal']),
	careerAmbitionLevel: int(),
	learningAgility: int(),
	growthPotential: int(),
	requiresPrayerBreaks: tinyint().default(0),
	prefersSeparateGenderWorkspace: tinyint().default(0),
	requiresHalalDining: tinyint().default(0),
	culturalAccommodationNeeds: json(),
	maxOvertimeHoursPerWeek: int(),
	requiresFlexibleHours: tinyint().default(0),
	familyCommitments: mysqlEnum(['none','low','moderate','high']),
	aiConfidenceScore: int(),
	attributeSource: mysqlEnum(['self_reported','ai_inferred','hybrid']).default('hybrid'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateAttributes_candidateId_unique").on(table.candidateId),
]);

export const candidateAvailability = mysqlTable("candidateAvailability", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	dayOfWeek: mysqlEnum(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']).notNull(),
	startTime: varchar({ length: 5 }).notNull(),
	endTime: varchar({ length: 5 }).notNull(),
	timezone: varchar({ length: 100 }).default('UTC'),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("dayOfWeek_idx").on(table.dayOfWeek),
]);

export const candidateEngagementScores = mysqlTable("candidateEngagementScores", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	totalEmailsSent: int().default(0),
	totalEmailsOpened: int().default(0),
	totalEmailsClicked: int().default(0),
	totalSmsReceived: int().default(0),
	totalApplications: int().default(0),
	totalInterviewResponses: int().default(0),
	totalProfileViews: int().default(0),
	overallScore: int().default(0),
	emailEngagementScore: int().default(0),
	applicationEngagementScore: int().default(0),
	interviewEngagementScore: int().default(0),
	engagementLevel: mysqlEnum(['very_high','high','medium','low','very_low']).default('medium'),
	lastEngagementAt: timestamp({ mode: 'string' }),
	firstEngagementAt: timestamp({ mode: 'string' }),
	scoreCalculatedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("overallScore_idx").on(table.overallScore),
	index("engagementLevel_idx").on(table.engagementLevel),
]);

export const candidateLists = mysqlTable("candidateLists", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	listName: varchar({ length: 255 }).notNull(),
	description: text(),
	segmentationRules: json().notNull(),
	candidateCount: int().default(0),
	lastRefreshed: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isAutoRefresh: tinyint().default(1),
	listType: mysqlEnum(['static','dynamic']).default('dynamic').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const candidateValueScores = mysqlTable("candidateValueScores", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	overallValueScore: int().default(0),
	skillRarityScore: int().default(0),
	experienceScore: int().default(0),
	engagementScore: int().default(0),
	fitScore: int().default(0),
	demandScore: int().default(0),
	competitorInterestSignals: int().default(0),
	lastCalculated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateValueScores_candidateId_unique").on(table.candidateId),
	index("candidateId_idx").on(table.candidateId),
	index("overallValueScore_idx").on(table.overallValueScore),
	index("competitorInterestSignals_idx").on(table.competitorInterestSignals),
]);

export const candidates = mysqlTable("candidates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	fullName: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	phone: varchar({ length: 50 }),
	location: varchar({ length: 255 }),
	headline: varchar({ length: 500 }),
	summary: text(),
	yearsOfExperience: int(),
	desiredSalaryMin: int(),
	desiredSalaryMax: int(),
	preferredWorkSetting: mysqlEnum(['remote','hybrid','onsite','flexible']),
	willingToRelocate: tinyint().default(0),
	technicalSkills: json(),
	softSkills: json(),
	workStyleAttributes: json(),
	personalityTraits: json(),
	cultureFitPreferences: json(),
	resumeUrl: text(),
	resumeFileKey: text(),
	aiProfileScore: int(),
	aiInferredAttributes: json(),
	profileStatus: mysqlEnum(['incomplete','active','inactive']).default('incomplete'),
	isAvailable: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
]);

export const candidatePreferences = mysqlTable("candidatePreferences", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	preferredIndustries: json(),
	preferredCompanySizes: json(),
	preferredLocations: json(),
	maxCommuteTime: int(),
	desiredBenefits: json(),
	careerGoals: text(),
	learningInterests: json(),
	workEnvironmentPreferences: json(),
	managementStylePreference: text(),
	teamSizePreference: mysqlEnum(['small', 'medium', 'large', 'any']),
	notificationPreferences: json(),
	privacySettings: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
]);

export const candidateNotificationPreferences = mysqlTable("candidateNotificationPreferences", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobAlertFrequency: mysqlEnum(['realtime', 'daily', 'weekly', 'never']).default('daily').notNull(),
	applicationStatusUpdates: tinyint().default(1).notNull(),
	interviewReminders: tinyint().default(1).notNull(),
	newJobMatches: tinyint().default(1).notNull(),
	companyUpdates: tinyint().default(1).notNull(),
	careerTips: tinyint().default(0).notNull(),
	quietHoursEnabled: tinyint().default(0).notNull(),
	quietHoursStart: varchar({ length: 5 }).default('22:00'),
	quietHoursEnd: varchar({ length: 5 }).default('08:00'),
	timezone: varchar({ length: 50 }).default('Asia/Riyadh'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
]);

export const applicationStatusHistory = mysqlTable("applicationStatusHistory", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id, { onDelete: "cascade" }),
	oldStatus: mysqlEnum(['submitted', 'screening', 'interviewing', 'offered', 'rejected']),
	newStatus: mysqlEnum(['submitted', 'screening', 'interviewing', 'offered', 'rejected']).notNull(),
	changedBy: int().references(() => users.id, { onDelete: "set null" }),
	changeReason: text(),
	notificationSent: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("applicationId_idx").on(table.applicationId),
	index("notificationSent_idx").on(table.notificationSent),
]);

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
export type InsertApplicationStatusHistory = typeof applicationStatusHistory.$inferInsert;

export const coachingSessions = mysqlTable("coachingSessions", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	sessionType: mysqlEnum(['resume_review','career_path','interview_prep','general']),
	userQuery: text(),
	aiResponse: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
]);

export const communicationEvents = mysqlTable("communicationEvents", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull(),
	employerId: int(),
	applicationId: int(),
	eventType: mysqlEnum(['email_sent','email_opened','email_clicked','application_submitted','application_viewed','interview_scheduled','interview_completed','interview_cancelled','status_changed','note_added','document_uploaded','message_sent','message_received']).notNull(),
	eventTitle: varchar({ length: 500 }).notNull(),
	eventDescription: text(),
	eventMetadata: json(),
	relatedEmailId: int(),
	relatedInterviewId: int(),
	initiatedBy: mysqlEnum(['candidate','employer','system']).notNull(),
	isRead: tinyint().default(0),
	eventTimestamp: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const communicationSummaries = mysqlTable("communicationSummaries", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull(),
	totalEmails: int().default(0),
	emailsOpened: int().default(0),
	emailsClicked: int().default(0),
	totalInterviews: int().default(0),
	completedInterviews: int().default(0),
	totalApplications: int().default(0),
	lastContactDate: timestamp({ mode: 'string' }),
	engagementScore: int().default(0),
	responseRate: int().default(0),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("communicationSummaries_candidateId_unique").on(table.candidateId),
]);

export const companyInsights = mysqlTable("companyInsights", {
	id: int().autoincrement().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	glassdoorId: varchar({ length: 255 }),
	overallRating: int(),
	cultureRating: int(),
	workLifeBalanceRating: int(),
	seniorManagementRating: int(),
	compensationRating: int(),
	careerOpportunitiesRating: int(),
	reviewCount: int(),
	recommendToFriend: int(),
	ceoApproval: int(),
	pros: text(),
	cons: text(),
	industry: varchar({ length: 255 }),
	size: varchar({ length: 100 }),
	headquarters: varchar({ length: 255 }),
	founded: int(),
	lastUpdated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const competitiveMetrics = mysqlTable("competitiveMetrics", {
	id: int().autoincrement().notNull(),
	metricName: varchar({ length: 255 }).notNull(),
	metricCategory: mysqlEnum(['matching','speed','quality','cost','features']).notNull(),
	oracleValue: int(),
	oracleRank: int(),
	recruitHoldingsValue: int(),
	eightfoldValue: int(),
	industryAverageValue: int(),
	unit: varchar({ length: 50 }),
	higherIsBetter: tinyint().default(1),
	competitiveAdvantage: text(),
	improvementOpportunity: text(),
	lastUpdated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const complianceAlerts = mysqlTable("complianceAlerts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	alertType: mysqlEnum(['nitaqat_red_zone','nitaqat_yellow_zone','approaching_deadline','permit_expiring','contract_expiring','compliance_violation','penalty_risk','sync_failure']).notNull(),
	severity: mysqlEnum(['info','warning','critical']).default('warning').notNull(),
	alertTitle: varchar({ length: 255 }).notNull(),
	alertMessage: text().notNull(),
	actionRequired: text(),
	relatedRecordType: varchar({ length: 100 }),
	relatedRecordId: int(),
	alertStatus: mysqlEnum(['active','acknowledged','resolved','dismissed']).default('active'),
	acknowledgedBy: int(),
	acknowledgedAt: timestamp({ mode: 'string' }),
	resolvedAt: timestamp({ mode: 'string' }),
	notificationSent: tinyint().default(0),
	notificationSentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const complianceReports = mysqlTable("complianceReports", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	reportType: mysqlEnum(['monthly','quarterly','annual','audit','custom']).notNull(),
	reportPeriodStart: timestamp({ mode: 'string' }).notNull(),
	reportPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	submittedTo: mysqlEnum(['mhrsd','qiwa','mudad','gosi','other']).notNull(),
	submissionStatus: mysqlEnum(['draft','submitted','accepted','rejected','pending_review']).default('draft').notNull(),
	submittedAt: timestamp({ mode: 'string' }),
	submittedBy: int(),
	referenceNumber: varchar({ length: 100 }),
	reportData: json(),
	reportFileUrl: text(),
	responseData: json(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const customTemplates = mysqlTable("customTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	scenarioType: varchar({ length: 50 }).notNull(),
	createdBy: int().notNull(),
	isPublic: tinyint().default(0),
	templateData: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_created_by").on(table.createdBy),
	index("idx_scenario_type").on(table.scenarioType),
]);

export const datasets = mysqlTable("datasets", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	datasetType: mysqlEnum(['resume','job_description','mixed','validation']).notNull(),
	source: varchar({ length: 255 }),
	description: text(),
	language: mysqlEnum(['arabic','english','mixed']).default('arabic'),
	recordCount: int().default(0),
	labeledCount: int().default(0),
	validationSplit: int().default(20),
	storageUrl: text(),
	fileKey: text(),
	format: mysqlEnum(['json','csv','parquet','txt']).default('json'),
	status: mysqlEnum(['collecting','processing','ready','archived']).default('collecting').notNull(),
	qualityScore: int(),
	metadata: json(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailAbTests = mysqlTable("emailAbTests", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	emailType: mysqlEnum(['interview_invite','interview_reminder','application_received','application_update','job_match','rejection','follow_up','broadcast','offer','custom']).notNull(),
	status: mysqlEnum(['draft','active','completed','paused']).default('draft'),
	trafficSplit: int().default(50),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	winnerVariant: mysqlEnum(['A','B','none']).default('none'),
	autoPromoteWinner: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const emailAbVariants = mysqlTable("emailAbVariants", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => emailAbTests.id, { onDelete: "cascade" } ),
	variant: mysqlEnum(['A','B']).notNull(),
	templateId: int().references(() => emailTemplates.id, { onDelete: "set null" } ),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	sentCount: int().default(0),
	deliveredCount: int().default(0),
	openCount: int().default(0),
	clickCount: int().default(0),
	openRate: int().default(0),
	clickRate: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
]);

export const emailAnalytics = mysqlTable("emailAnalytics", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	emailType: mysqlEnum(['invoice','weekly_report','interview_invite','application_confirmation','job_match','custom']).notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	subject: text(),
	sentAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	deliveredAt: timestamp({ mode: 'string' }),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	openCount: int().default(0),
	clickCount: int().default(0),
	trackingId: varchar({ length: 64 }).notNull(),
	metadata: json(),
},
(table) => [
	index("emailAnalytics_trackingId_unique").on(table.trackingId),
	index("employerId_idx").on(table.employerId),
	index("trackingId_idx").on(table.trackingId),
]);

export const emailBranding = mysqlTable("emailBranding", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	logoUrl: text(),
	primaryColor: varchar({ length: 7 }).default('#3B82F6'),
	secondaryColor: varchar({ length: 7 }).default('#1E40AF'),
	fontFamily: varchar({ length: 100 }).default('Arial, sans-serif'),
	companyName: varchar({ length: 255 }),
	footerText: text(),
	socialLinks: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("emailBranding_employerId_unique").on(table.employerId),
]);

export const emailCampaignVariants = mysqlTable("emailCampaignVariants", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => emailAbTests.id, { onDelete: "cascade" } ),
	variantName: varchar({ length: 100 }).notNull(),
	subjectLine: varchar({ length: 500 }).notNull(),
	emailContent: text().notNull(),
	trafficAllocation: int().default(50),
	sentCount: int().default(0),
	openCount: int().default(0),
	clickCount: int().default(0),
	replyCount: int().default(0),
	openRate: int().default(0),
	clickRate: int().default(0),
	replyRate: int().default(0),
	conversionCount: int().default(0),
	conversionRate: int().default(0),
	isWinner: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
	index("isWinner_idx").on(table.isWinner),
]);

export const emailCampaigns = mysqlTable("emailCampaigns", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['draft','active','paused','completed']).default('draft').notNull(),
	workflowDefinition: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailEvents = mysqlTable("emailEvents", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	emailAnalyticsId: int(),
	campaignId: int(),
	abTestId: int(),
	variantId: int(),
	eventType: mysqlEnum(['sent','delivered','opened','clicked','bounced','complained','unsubscribed']).notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	candidateId: int(),
	emailType: mysqlEnum(['interview_invite','interview_reminder','application_received','application_update','job_match','rejection','follow_up','broadcast','custom']).notNull(),
	subject: text(),
	linkUrl: text(),
	linkPosition: int(),
	userAgent: text(),
	ipAddress: varchar({ length: 45 }),
	deviceType: mysqlEnum(['desktop','mobile','tablet','unknown']),
	eventTimestamp: timestamp({ mode: 'string' }).notNull(),
	hourOfDay: int(),
	dayOfWeek: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("campaignId_idx").on(table.campaignId),
	index("abTestId_idx").on(table.abTestId),
	index("eventType_idx").on(table.eventType),
	index("emailType_idx").on(table.emailType),
	index("candidateId_idx").on(table.candidateId),
	index("eventTimestamp_idx").on(table.eventTimestamp),
	index("hourOfDay_idx").on(table.hourOfDay),
	index("dayOfWeek_idx").on(table.dayOfWeek),
]);

export const emailTemplateCategories = mysqlTable("emailTemplateCategories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	displayOrder: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const emailTemplateLibrary = mysqlTable("emailTemplateLibrary", {
	id: int().autoincrement().notNull(),
	employerId: int().references(() => employers.id, { onDelete: "cascade" } ),
	categoryId: int().references(() => emailTemplateCategories.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	thumbnailUrl: varchar({ length: 500 }),
	isPublic: tinyint().default(0),
	usageCount: int().default(0),
	lastUsedAt: timestamp({ mode: 'string' }),
	variables: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("categoryId_idx").on(table.categoryId),
]);

export const emailTemplateVersions = mysqlTable("emailTemplateVersions", {
	id: int().autoincrement().notNull(),
	templateId: varchar({ length: 255 }).notNull(),
	version: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	variables: json(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isActive: tinyint().default(0).notNull(),
	performanceScore: int().default(0).notNull(),
	totalSent: int().default(0).notNull(),
	totalOpened: int().default(0).notNull(),
	totalClicked: int().default(0).notNull(),
	openRate: int().default(0).notNull(),
	clickRate: int().default(0).notNull(),
	notes: text(),
},
(table) => [
	index("templateId_idx").on(table.templateId),
	index("version_idx").on(table.version),
]);

export const emailTemplates = mysqlTable("emailTemplates", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['interview_invite','interview_reminder','application_received','application_update','job_match','rejection','offer','custom']).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	variables: json(),
	isDefault: tinyint().default(0),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const employeeSkills = mysqlTable("employeeSkills", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	employeeRef: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 255 }),
	currentSkills: json(),
	skillGaps: json(),
	retentionRisk: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const employeeSurveys = mysqlTable("employeeSurveys", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	surveyName: varchar({ length: 255 }).notNull(),
	surveyType: mysqlEnum(['satisfaction','engagement','wellbeing','feedback','exit']).notNull(),
	questions: json().notNull(),
	targetAudience: mysqlEnum(['all','department','role','specific']).notNull(),
	frequency: mysqlEnum(['one_time','weekly','monthly','quarterly']).notNull(),
	isAnonymous: tinyint().default(1).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const employerMatchingPreferences = mysqlTable("employerMatchingPreferences", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	technicalWeight: int().default(40).notNull(),
	cultureWeight: int().default(30).notNull(),
	wellbeingWeight: int().default(30).notNull(),
	minOverallMatchScore: int().default(60).notNull(),
	minTechnicalScore: int().default(50).notNull(),
	minCultureScore: int().default(50).notNull(),
	minWellbeingScore: int().default(50).notNull(),
	enableAutoNotifications: tinyint().default(1).notNull(),
	notificationFrequency: mysqlEnum(['immediate','daily_digest','weekly_digest']).default('daily_digest').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerMatchingPreferences_employerId_unique").on(table.employerId),
]);

export const employers = mysqlTable("employers", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	companyName: varchar({ length: 255 }).notNull(),
	industry: varchar({ length: 255 }),
	companySize: mysqlEnum(['1-10','11-50','51-200','201-500','501-1000','1000+']),
	description: text(),
	contactEmail: varchar({ length: 320 }),
	contactPhone: varchar({ length: 50 }),
	cultureAttributes: json(),
	saasToolEnabled: tinyint().default(0),
	operationalMetrics: json(),
	predictedHiringNeeds: json(),
	billingModel: mysqlEnum(['subscription','performance','hybrid']).default('subscription'),
	accountStatus: mysqlEnum(['active','inactive']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
]);

export const engagementAlerts = mysqlTable("engagementAlerts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	alertType: mysqlEnum(['declining_engagement','high_value_candidate','competitor_approach','inactive_candidate','engagement_spike']).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	alertMessage: text().notNull(),
	engagementScoreBefore: int(),
	engagementScoreAfter: int(),
	triggerMetrics: json(),
	isRead: tinyint().default(0),
	isResolved: tinyint().default(0),
	resolvedAt: timestamp({ mode: 'string' }),
	actionTaken: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("candidateId_idx").on(table.candidateId),
	index("alertType_idx").on(table.alertType),
	index("severity_idx").on(table.severity),
	index("isRead_idx").on(table.isRead),
	index("isResolved_idx").on(table.isResolved),
]);

export const engagementScoreHistory = mysqlTable("engagementScoreHistory", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	score: int().notNull(),
	engagementLevel: mysqlEnum(['very_high','high','medium','low','very_low']).notNull(),
	recordedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("recordedAt_idx").on(table.recordedAt),
]);

export const engagementThresholds = mysqlTable("engagementThresholds", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	alertType: mysqlEnum(['declining_engagement','high_value_candidate','competitor_approach','inactive_candidate','engagement_spike']).notNull(),
	thresholdValue: int().notNull(),
	timeWindowDays: int().default(7),
	isEnabled: tinyint().default(1),
	notificationMethod: mysqlEnum(['email','dashboard','both']).default('both'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("alertType_idx").on(table.alertType),
	index("isEnabled_idx").on(table.isEnabled),
]);

export const engagementAlertConfigs = mysqlTable("engagement_alert_configs", {
	id: int().autoincrement().notNull(),
	employerId: int("employer_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	isActive: tinyint("is_active").default(1).notNull(),
	minEngagementScore: int("min_engagement_score").default(60).notNull(),
	scoreDropThreshold: int("score_drop_threshold").default(20).notNull(),
	timeWindowDays: int("time_window_days").default(7).notNull(),
	notifyEmail: tinyint("notify_email").default(1).notNull(),
	notifyInApp: tinyint("notify_in_app").default(1).notNull(),
	recipientEmails: text("recipient_emails"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const engagementAlertsV2 = mysqlTable("engagement_alerts", {
	id: int().autoincrement().notNull(),
	configId: int("config_id").notNull(),
	candidateId: int("candidate_id").notNull(),
	previousScore: int("previous_score").notNull(),
	currentScore: int("current_score").notNull(),
	scoreDrop: int("score_drop").notNull(),
	alertLevel: mysqlEnum("alert_level", ['warning','critical']).notNull(),
	status: mysqlEnum(['new','acknowledged','resolved']).default('new').notNull(),
	acknowledgedBy: int("acknowledged_by"),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const externalJobs = mysqlTable("externalJobs", {
	id: int().autoincrement().notNull(),
	source: mysqlEnum(['indeed','glassdoor','linkedin']).notNull(),
	externalJobId: varchar({ length: 255 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	company: varchar({ length: 255 }),
	location: varchar({ length: 255 }),
	description: text(),
	url: text(),
	salaryMin: int(),
	salaryMax: int(),
	employmentType: varchar({ length: 100 }),
	postedDate: timestamp({ mode: 'string' }),
	companyRating: int(),
	companyReviews: int(),
	applyUrl: text(),
	isSponsored: tinyint().default(0),
	viewCount: int().default(0),
	applicationCount: int().default(0),
	lastSynced: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("externalJobId_idx").on(table.externalJobId),
]);

export const feedbackTemplates = mysqlTable("feedbackTemplates", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	interviewType: varchar({ length: 100 }),
	questions: json(),
	isDefault: tinyint().default(0),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const governmentSyncLog = mysqlTable("governmentSyncLog", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	syncSystem: mysqlEnum(['mhrsd','qiwa','mudad','absher']).notNull(),
	syncType: mysqlEnum(['workforce_data','compliance_report','work_permit','contract','identity_verification']).notNull(),
	syncDirection: mysqlEnum(['push','pull','bidirectional']).notNull(),
	syncStatus: mysqlEnum(['pending','in_progress','success','failed','partial']).default('pending').notNull(),
	recordsProcessed: int().default(0),
	recordsFailed: int().default(0),
	requestPayload: json(),
	responsePayload: json(),
	errorMessage: text(),
	errorCode: varchar({ length: 100 }),
	syncStarted: timestamp({ mode: 'string' }).notNull(),
	syncCompleted: timestamp({ mode: 'string' }),
	durationMs: int(),
	initiatedBy: int(),
	isAutomated: tinyint().default(0),
	retryCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const interviewCalendarInvites = mysqlTable("interviewCalendarInvites", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull(),
	calendarEventId: int(),
	externalEventId: varchar({ length: 255 }),
	inviteSentAt: timestamp({ mode: 'string' }),
	candidateAccepted: tinyint(),
	candidateResponseAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("interviewCalendarInvites_interviewId_unique").on(table.interviewId),
]);

export const interviewConflicts = mysqlTable("interviewConflicts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	conflictDate: timestamp({ mode: 'string' }).notNull(),
	conflictingInterviewIds: json(),
	conflictType: mysqlEnum(['overlapping','back_to_back','resource']).notNull(),
	resolved: tinyint().default(0),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const interviewFeedback = mysqlTable("interviewFeedback", {
	id: int().autoincrement().notNull(),
	interviewId: int().notNull(),
	candidateId: int().notNull(),
	interviewerId: int().notNull(),
	overallRating: int().notNull(),
	technicalSkillsRating: int(),
	communicationRating: int(),
	problemSolvingRating: int(),
	cultureFitRating: int(),
	recommendation: mysqlEnum(['strong_hire','hire','maybe','no_hire','strong_no_hire']).notNull(),
	strengths: text(),
	weaknesses: text(),
	detailedNotes: text(),
	questionsResponses: json(),
	interviewDuration: int(),
	isConfidential: tinyint().default(0),
	submittedAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const interviews = mysqlTable("interviews", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull(),
	employerId: int().notNull(),
	candidateId: int().notNull(),
	jobId: int().notNull(),
	scheduledAt: timestamp({ mode: 'string' }).notNull(),
	duration: int().default(60).notNull(),
	interviewType: mysqlEnum(['phone','video','onsite','technical']).default('video').notNull(),
	location: text(),
	notes: text(),
	status: mysqlEnum(['scheduled','completed','cancelled','rescheduled']).default('scheduled').notNull(),
	reminderSent: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	templateId: int(),
});

export const jobAttributes = mysqlTable("jobAttributes", {
	id: int().autoincrement().notNull(),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	requiredCommunicationLevel: int(),
	requiredLeadershipLevel: int(),
	requiredTeamworkLevel: int(),
	requiredProblemSolvingLevel: int(),
	requiredAdaptabilityLevel: int(),
	teamSize: int(),
	teamWorkStyle: mysqlEnum(['collaborative','independent','mixed']),
	managementStyle: mysqlEnum(['hands_on','collaborative','autonomous']),
	workPaceExpectation: mysqlEnum(['fast','moderate','methodical']),
	overtimeExpectation: int(),
	travelRequirement: int(),
	providesPrayerFacilities: tinyint().default(0),
	hasGenderSeparateWorkspaces: tinyint().default(0),
	providesHalalDining: tinyint().default(0),
	saudizationCompliant: tinyint().default(0),
	nitaqatCategory: mysqlEnum(['platinum','green','yellow','red']),
	careerGrowthOpportunities: int(),
	trainingBudgetPerYear: int(),
	mentorshipAvailable: tinyint().default(0),
	flexibleHoursAvailable: tinyint().default(0),
	paidTimeOffDays: int(),
	parentalLeaveWeeks: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("jobAttributes_jobId_unique").on(table.jobId),
]);

export const jobDescriptionAnalysis = mysqlTable("jobDescriptionAnalysis", {
	id: int().autoincrement().notNull(),
	jobId: int(),
	jobDescription: text().notNull(),
	language: mysqlEnum(['arabic','english','mixed']).default('mixed'),
	analysisStatus: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	confidenceScore: int(),
	extractedRequirements: json(),
	inferredAttributes: json(),
	cultureFitIndicators: json(),
	salaryRange: json(),
	errorMessage: text(),
	processingTime: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const jobs = mysqlTable("jobs", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }),
	workSetting: mysqlEnum(['remote','hybrid','onsite','flexible']),
	employmentType: mysqlEnum(['full_time','part_time','contract']),
	salaryMin: int(),
	salaryMax: int(),
	originalDescription: text(),
	enrichedDescription: text(),
	requiredSkills: json(),
	aiInferredRequirements: json(),
	idealCandidateProfile: json(),
	status: mysqlEnum(['draft','active','closed']).default('draft'),
	viewCount: int().default(0),
	applicationCount: int().default(0),
	atsJobId: varchar({ length: 255 }),
	atsSystem: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const matchHistory = mysqlTable("matchHistory", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	userId: int().references(() => users.id, { onDelete: "cascade" }),
	overallScore: int().notNull(),
	skillScore: int(),
	technicalScore: int(),
	cultureScore: int(),
	cultureFitScore: int(),
	wellbeingScore: int(),
	burnoutRisk: int(),
	matchExplanation: text(),
	matchBreakdown: json(),
	topAttributes: json(),
	wasRecommended: tinyint().default(0),
	wasApplied: tinyint().default(0),
	wasViewed: tinyint().default(0),
	// Outcome tracking
	outcome: mysqlEnum(['hired','rejected','withdrawn','pending']),
	outcomeDate: timestamp({ mode: 'string' }),
	timeToHire: int(),
	performanceRating: int(),
	retentionMonths: int(),
	wasSuccessfulHire: tinyint(),
	feedbackNotes: text(),
	matchVersion: varchar({ length: 50 }),
	attributeWeights: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
	index("userId_idx").on(table.userId),
	index("overallScore_idx").on(table.overallScore),
	index("outcome_idx").on(table.outcome),
	index("wasSuccessfulHire_idx").on(table.wasSuccessfulHire),
]);

export const matchDigestPreferences = mysqlTable("matchDigestPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	enabled: tinyint().default(1).notNull(),
	frequency: mysqlEnum(['daily', 'weekly', 'biweekly']).default('daily').notNull(),
	deliveryTime: varchar({ length: 10 }).default('08:00').notNull(),
	minMatchScore: int().default(70).notNull(),
	maxMatchesPerDigest: int().default(10).notNull(),
	includeNewCandidates: tinyint().default(1).notNull(),
	includeScoreChanges: tinyint().default(1).notNull(),
	includeSavedMatches: tinyint().default(1).notNull(),
	jobFilters: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
]);

export const digestDeliveryLog = mysqlTable("digestDeliveryLog", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	digestType: mysqlEnum(['daily', 'weekly', 'biweekly']).notNull(),
	deliveredAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	matchesIncluded: int().default(0).notNull(),
	emailSubject: varchar({ length: 500 }),
	emailSent: tinyint().default(0).notNull(),
	emailOpened: tinyint().default(0),
	openedAt: timestamp({ mode: 'string' }),
	clicksCount: int().default(0),
	metadata: json(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("deliveredAt_idx").on(table.deliveredAt),
]);

export const ksaCoachingSessions = mysqlTable("ksaCoachingSessions", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	sessionType: mysqlEnum(['ksa_market_guidance','vision2030_alignment','saudization_advice','arabic_cv_optimization','cultural_fit_coaching','salary_negotiation_ksa','industry_specific_prep']).notNull(),
	userQuery: text(),
	aiResponse: text(),
	targetIndustry: varchar({ length: 255 }),
	targetRole: varchar({ length: 255 }),
	skillGapsIdentified: json(),
	recommendedUpskilling: json(),
	marketInsightsProvided: json(),
	actionItemsGenerated: json(),
	candidateSatisfaction: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
]);

export const ksaMarketData = mysqlTable("ksaMarketData", {
	id: int().autoincrement().notNull(),
	skillName: varchar({ length: 255 }).notNull(),
	demandLevel: mysqlEnum(['low','moderate','high','critical']).notNull(),
	demandTrend: mysqlEnum(['declining','stable','growing','surging']),
	averageSalary: int(),
	salaryRangeMin: int(),
	salaryRangeMax: int(),
	primaryIndustries: json(),
	vision2030Alignment: tinyint().default(0),
	saudizationPriority: tinyint().default(0),
	availableTalentCount: int(),
	talentGapPercentage: int(),
	recommendedCourses: json(),
	averageTrainingDuration: int(),
	dataSource: varchar({ length: 255 }),
	lastUpdated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const laborLawCompliance = mysqlTable("laborLawCompliance", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	candidateId: int(),
	employeeName: varchar({ length: 255 }).notNull(),
	employeeType: mysqlEnum(['saudi','expat']).notNull(),
	weeklyWorkingHours: int().default(48),
	weeklyOvertimeHours: int().default(0),
	isWorkingHoursCompliant: tinyint().default(1),
	annualLeaveDays: int().default(21),
	sickLeaveDays: int().default(0),
	eidLeaveDays: int().default(4),
	nationalDayLeaveDays: int().default(1),
	contractType: mysqlEnum(['fixed_term','indefinite']).notNull(),
	probationPeriodDays: int().default(90),
	noticePeriodDays: int().default(60),
	endOfServiceBenefitAmount: bigint({ mode: "number" }),
	lastCalculatedDate: timestamp({ mode: 'string' }),
	violationType: varchar({ length: 255 }),
	violationDescription: text(),
	violationDate: timestamp({ mode: 'string' }),
	violationResolved: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const listMembers = mysqlTable("listMembers", {
	id: int().autoincrement().notNull(),
	listId: int().notNull().references(() => candidateLists.id, { onDelete: "cascade" } ),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	matchScore: int(),
	tags: json(),
},
(table) => [
	index("listId_idx").on(table.listId),
	index("candidateId_idx").on(table.candidateId),
]);

export const mhrsdRegulations = mysqlTable("mhrsdRegulations", {
	id: int().autoincrement().notNull(),
	regulationId: varchar({ length: 255 }).notNull(),
	titleAr: text(),
	titleEn: text(),
	category: varchar({ length: 255 }),
	descriptionAr: text(),
	descriptionEn: text(),
	effectiveDate: timestamp({ mode: 'string' }),
	expiryDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['active','draft','archived']).default('active'),
	applicableSectors: json(),
	complianceRequirements: json(),
	penalties: json(),
	documentUrl: varchar({ length: 1000 }),
	rawData: json(),
	lastSyncedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("mhrsdRegulations_regulationId_unique").on(table.regulationId),
]);

export const mhrsdReports = mysqlTable("mhrsdReports", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	reportType: mysqlEnum(['monthly','quarterly','annual','ad_hoc']).notNull(),
	reportPeriodStart: timestamp({ mode: 'string' }).notNull(),
	reportPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	reportData: json().notNull(),
	reportFileUrl: text(),
	reportFileKey: text(),
	submissionStatus: mysqlEnum(['draft','submitted','accepted','rejected']).default('draft'),
	submittedAt: timestamp({ mode: 'string' }),
	submittedBy: int(),
	mhrsdReferenceNumber: varchar({ length: 255 }),
	mhrsdResponse: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const mhrsdSyncStatus = mysqlTable("mhrsdSyncStatus", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	lastSyncAt: timestamp({ mode: 'string' }),
	nextScheduledSync: timestamp({ mode: 'string' }),
	syncStatus: mysqlEnum(['success','failed','in_progress','pending']).default('pending').notNull(),
	syncType: mysqlEnum(['manual','scheduled','automatic']).default('automatic'),
	recordsSynced: int().default(0),
	errorMessage: text(),
	syncDuration: int(),
	dataHash: varchar({ length: 64 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const modelInferences = mysqlTable("modelInferences", {
	id: int().autoincrement().notNull(),
	trainingJobId: int(),
	modelVersion: varchar({ length: 100 }).notNull(),
	inferenceType: mysqlEnum(['resume_parsing','job_matching','skill_extraction']).notNull(),
	inputText: text().notNull(),
	inputLanguage: mysqlEnum(['arabic','english','mixed']),
	outputData: json(),
	confidenceScore: int(),
	processingTime: int(),
	success: tinyint().notNull(),
	errorMessage: text(),
	feedbackProvided: tinyint().default(0),
	feedbackCorrect: tinyint(),
	userId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const mudadContracts = mysqlTable("mudadContracts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	candidateId: int(),
	employeeName: varchar({ length: 255 }).notNull(),
	nationalId: varchar({ length: 50 }).notNull(),
	contractType: mysqlEnum(['fixed_term','indefinite','part_time','seasonal']).notNull(),
	jobTitle: varchar({ length: 255 }).notNull(),
	salary: bigint({ mode: "number" }).notNull(),
	allowances: bigint({ mode: "number" }),
	contractStartDate: timestamp({ mode: 'string' }).notNull(),
	contractEndDate: timestamp({ mode: 'string' }),
	probationPeriodDays: int().default(90),
	mudadStatus: mysqlEnum(['draft','submitted','active','terminated','expired']).default('draft'),
	mudadContractId: varchar({ length: 255 }),
	mudadSubmissionDate: timestamp({ mode: 'string' }),
	contractFileUrl: text(),
	contractFileKey: text(),
	terminationDate: timestamp({ mode: 'string' }),
	terminationReason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const nitaqatTracking = mysqlTable("nitaqatTracking", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	totalEmployees: int().default(0).notNull(),
	saudiEmployees: int().default(0).notNull(),
	expatEmployees: int().default(0).notNull(),
	saudizationPercentage: bigint({ mode: "number" }).notNull(),
	entitySize: mysqlEnum(['small','medium','large','very_large']).notNull(),
	activitySector: varchar({ length: 255 }).notNull(),
	nitaqatBand: mysqlEnum(['platinum','green','yellow','red']).notNull(),
	requiredSaudizationPercentage: bigint({ mode: "number" }).notNull(),
	isCompliant: tinyint().default(0).notNull(),
	complianceGap: int(),
	riskLevel: mysqlEnum(['low','medium','high','critical']).default('low').notNull(),
	estimatedPenalty: bigint({ mode: "number" }),
	eligibleIncentives: json(),
	projectedComplianceDate: timestamp({ mode: 'string' }),
	forecastedBand3Months: mysqlEnum(['platinum','green','yellow','red']),
	forecastedBand6Months: mysqlEnum(['platinum','green','yellow','red']),
	forecastedBand12Months: mysqlEnum(['platinum','green','yellow','red']),
	lastCalculated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	calculationSource: mysqlEnum(['manual','qiwa_sync','system_calculated']).default('system_calculated'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const nlpTrainingData = mysqlTable("nlpTrainingData", {
	id: int().autoincrement().notNull(),
	dataType: mysqlEnum(['resume','job_description','feedback']).notNull(),
	originalText: text().notNull(),
	correctedExtraction: json(),
	feedbackType: mysqlEnum(['correction','validation','enhancement']),
	submittedBy: int(),
	language: mysqlEnum(['arabic','english','mixed']).default('mixed'),
	usedForTraining: tinyint().default(0),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const notificationAnalytics = mysqlTable("notificationAnalytics", {
	id: int().autoincrement().notNull(),
	notificationId: int().notNull().references(() => notificationHistory.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	channel: mysqlEnum(['push','email','sms']).notNull(),
	deliveredAt: timestamp({ mode: 'string' }),
	deliveryStatus: mysqlEnum(['pending','sent','delivered','failed','expired','bounced','undelivered']).default('pending'),
	deliveryError: text(),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	dismissedAt: timestamp({ mode: 'string' }),
	bouncedAt: timestamp({ mode: 'string' }),
	bounceReason: text(),
	deviceType: varchar({ length: 50 }),
	browserType: varchar({ length: 50 }),
	carrier: varchar({ length: 100 }),
	countryCode: varchar({ length: 10 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationId_idx").on(table.notificationId),
	index("userId_idx").on(table.userId),
	index("deliveryStatus_idx").on(table.deliveryStatus),
	index("openedAt_idx").on(table.openedAt),
	index("clickedAt_idx").on(table.clickedAt),
]);

export const notificationHistory = mysqlTable("notificationHistory", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['interview_reminder','feedback_request','candidate_response','engagement_alert','ab_test_result','system_update','general']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	actionUrl: text(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium'),
	deliveryMethod: mysqlEnum(['push','email','sms','push_email','push_sms','email_sms','all']).default('push'),
	pushSent: tinyint().default(0),
	pushSentAt: timestamp({ mode: 'string' }),
	emailSent: tinyint().default(0),
	emailSentAt: timestamp({ mode: 'string' }),
	smsSent: tinyint().default(0),
	smsSentAt: timestamp({ mode: 'string' }),
	smsDeliveryStatus: mysqlEnum(['pending','sent','delivered','failed','undelivered']),
	smsMessageId: varchar({ length: 255 }),
	isRead: tinyint().default(0),
	readAt: timestamp({ mode: 'string' }),
	relatedEntityType: varchar({ length: 50 }),
	relatedEntityId: int(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("type_idx").on(table.type),
	index("isRead_idx").on(table.isRead),
	index("priority_idx").on(table.priority),
	index("createdAt_idx").on(table.createdAt),
]);

export const notificationPreferences = mysqlTable("notificationPreferences", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	enableMonthlyInvoices: tinyint().default(1),
	enableWeeklyReports: tinyint().default(1),
	enableApplicationNotifications: tinyint().default(1),
	enableInterviewReminders: tinyint().default(1),
	enableJobMatchAlerts: tinyint().default(1),
	weeklyReportDay: mysqlEnum(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']).default('monday'),
	weeklyReportTime: varchar({ length: 5 }).default('08:00'),
	emailFrequency: mysqlEnum(['realtime','daily_digest','weekly_digest']).default('realtime'),
	unsubscribedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationPreferences_employerId_unique").on(table.employerId),
]);

export const optimalSendTimes = mysqlTable("optimalSendTimes", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	emailType: mysqlEnum(['interview_invite','interview_reminder','application_received','application_update','job_match','rejection','follow_up','broadcast','custom']).notNull(),
	candidateSegment: varchar({ length: 100 }),
	optimalDayOfWeek: int().notNull(),
	optimalHourOfDay: int().notNull(),
	avgOpenRate: int().default(0),
	avgClickRate: int().default(0),
	sampleSize: int().default(0),
	confidenceScore: int().default(0),
	analysisStartDate: timestamp({ mode: 'string' }).notNull(),
	analysisEndDate: timestamp({ mode: 'string' }).notNull(),
	lastCalculated: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("emailType_idx").on(table.emailType),
	index("candidateSegment_idx").on(table.candidateSegment),
]);

export const performanceAlerts = mysqlTable("performanceAlerts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	alertName: varchar({ length: 255 }).notNull(),
	alertType: mysqlEnum(['underperformance','high_engagement','low_deliverability','benchmark_deviation','campaign_success']).notNull(),
	triggerConditions: json().notNull(),
	isActive: tinyint().default(1),
	lastTriggered: timestamp({ mode: 'string' }),
	triggerCount: int().default(0),
	notificationChannels: json(),
	recipientEmails: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const predictiveInsights = mysqlTable("predictiveInsights", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	predictedHiringNeedDate: timestamp({ mode: 'string' }),
	predictedRole: varchar({ length: 255 }),
	predictedHeadcount: int(),
	predictionConfidence: int(),
	predictionReason: text(),
	identifiedSkillGaps: json(),
	turnoverRiskDepartments: json(),
	seasonalHiringPattern: json(),
	talentScarcityLevel: mysqlEnum(['low','moderate','high','critical']),
	averageTimeToFillDays: int(),
	competitiveHiringPressure: int(),
	recommendedActions: json(),
	proactiveTalentPipelineSize: int(),
	status: mysqlEnum(['active','actioned','dismissed']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const pushSubscriptions = mysqlTable("pushSubscriptions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	userAgent: text(),
	isActive: tinyint().default(1),
	lastUsedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("isActive_idx").on(table.isActive),
]);

export const qiwaCompanies = mysqlTable("qiwaCompanies", {
	id: int().autoincrement().notNull(),
	qiwaCompanyId: varchar({ length: 255 }).notNull(),
	commercialRegistration: varchar({ length: 255 }),
	companyNameAr: varchar({ length: 500 }),
	companyNameEn: varchar({ length: 500 }),
	legalForm: varchar({ length: 100 }),
	sector: varchar({ length: 255 }),
	activity: text(),
	establishmentDate: timestamp({ mode: 'string' }),
	employeeCount: int(),
	saudiEmployeeCount: int(),
	nonSaudiEmployeeCount: int(),
	nitaqatColor: mysqlEnum(['platinum','green','yellow','red']),
	nitaqatScore: int(),
	city: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	contactEmail: varchar({ length: 320 }),
	contactPhone: varchar({ length: 50 }),
	status: mysqlEnum(['active','suspended','closed']).default('active'),
	rawData: json(),
	lastSyncedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("qiwaCompanies_qiwaCompanyId_unique").on(table.qiwaCompanyId),
]);

export const qiwaWorkPermits = mysqlTable("qiwaWorkPermits", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	candidateId: int(),
	employeeName: varchar({ length: 255 }).notNull(),
	nationalId: varchar({ length: 50 }).notNull(),
	nationality: varchar({ length: 100 }).notNull(),
	permitType: mysqlEnum(['new','renewal','transfer']).notNull(),
	jobTitle: varchar({ length: 255 }).notNull(),
	occupation: varchar({ length: 255 }),
	applicationStatus: mysqlEnum(['draft','submitted','under_review','approved','rejected','expired']).default('draft'),
	qiwaApplicationId: varchar({ length: 255 }),
	qiwaPermitNumber: varchar({ length: 255 }),
	applicationDate: timestamp({ mode: 'string' }),
	approvalDate: timestamp({ mode: 'string' }),
	expiryDate: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const resumeParseResults = mysqlTable("resumeParseResults", {
	id: int().autoincrement().notNull(),
	candidateId: int(),
	resumeUrl: text().notNull(),
	resumeFileKey: text(),
	language: mysqlEnum(['arabic','english','mixed']).default('mixed'),
	parseStatus: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	confidenceScore: int(),
	extractedData: json(),
	rawText: text(),
	errorMessage: text(),
	processingTime: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const retentionMetrics = mysqlTable("retentionMetrics", {
	id: int().autoincrement().notNull(),
	candidateId: int().references(() => candidates.id, { onDelete: "cascade" } ),
	employerId: int().references(() => employers.id, { onDelete: "cascade" } ),
	applicationId: int().references(() => applications.id, { onDelete: "cascade" } ),
	burnoutRiskScore: int(),
	workLifeBalanceScore: int(),
	jobSatisfactionPrediction: int(),
	retentionProbability6Month: int(),
	retentionProbability1Year: int(),
	retentionProbability2Year: int(),
	identifiedRiskFactors: json(),
	protectiveFactors: json(),
	recommendedInterventions: json(),
	careerDevelopmentNeeds: json(),
	engagementScore: int(),
	motivationLevel: int(),
	assessmentDate: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("employerId_idx").on(table.employerId),
]);

export const savedJobs = mysqlTable("savedJobs", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
]);

export const schedulingConflictResolutions = mysqlTable("schedulingConflictResolutions", {
	id: int().autoincrement().notNull(),
	conflictId: int().notNull(),
	suggestedTime: timestamp({ mode: 'string' }).notNull(),
	reason: text(),
	priority: int().default(0),
	applied: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("conflictId_idx").on(table.conflictId),
	index("priority_idx").on(table.priority),
]);

export const shifts = mysqlTable("shifts", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	shiftName: varchar({ length: 255 }),
	startTime: timestamp({ mode: 'string' }).notNull(),
	endTime: timestamp({ mode: 'string' }).notNull(),
	requiredHeadcount: int().notNull(),
	currentHeadcount: int().default(0),
	skillsRequired: json(),
	staffingGap: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const skillGapAnalysis = mysqlTable("skillGapAnalysis", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	department: varchar({ length: 255 }),
	analysisDate: timestamp({ mode: 'string' }).notNull(),
	currentSkills: json().notNull(),
	requiredSkills: json().notNull(),
	identifiedGaps: json().notNull(),
	trainingRecommendations: json(),
	hiringRecommendations: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const smsProviderConfigs = mysqlTable("smsProviderConfigs", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	provider: mysqlEnum(['twilio','aws_sns']).notNull(),
	isActive: tinyint().default(0),
	twilioAccountSid: varchar({ length: 255 }),
	twilioAuthToken: varchar({ length: 255 }),
	twilioPhoneNumber: varchar({ length: 50 }),
	awsAccessKeyId: varchar({ length: 255 }),
	awsSecretAccessKey: varchar({ length: 255 }),
	awsRegion: varchar({ length: 50 }),
	awsSnsTopicArn: varchar({ length: 500 }),
	messagesSent: int().default(0),
	messagesDelivered: int().default(0),
	messagesFailed: int().default(0),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const smsCampaignRecipients = mysqlTable("sms_campaign_recipients", {
	id: int().autoincrement().notNull(),
	campaignId: int("campaign_id").notNull(),
	candidateId: int("candidate_id").notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	status: mysqlEnum(['pending','sent','delivered','failed']).default('pending').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	errorMessage: text("error_message"),
});

export const smsCampaigns = mysqlTable("sms_campaigns", {
	id: int().autoincrement().notNull(),
	employerId: int("employer_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: mysqlEnum(['draft','scheduled','sending','completed','cancelled']).default('draft').notNull(),
	segmentationRules: text("segmentation_rules"),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	totalRecipients: int("total_recipients").default(0).notNull(),
	sentCount: int("sent_count").default(0).notNull(),
	deliveredCount: int("delivered_count").default(0).notNull(),
	failedCount: int("failed_count").default(0).notNull(),
	createdBy: int("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const strategicRoi = mysqlTable("strategicRoi", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	hireId: int(),
	candidateId: int().references(() => candidates.id, { onDelete: "set null" } ),
	jobId: int().references(() => jobs.id, { onDelete: "set null" } ),
	day90PerformanceScore: int(),
	day180PerformanceScore: int(),
	year1PerformanceScore: int(),
	stillEmployed: tinyint().default(1),
	terminationDate: timestamp({ mode: 'string' }),
	terminationReason: varchar({ length: 255 }),
	costPerHire: int(),
	costPerQualityHire: int(),
	timeToHireDays: int(),
	estimatedValueGenerated: int(),
	roiPercentage: int(),
	vsTraditionalRecruitmentCost: int(),
	vsTraditionalRecruitmentTime: int(),
	hireDate: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const syncJobs = mysqlTable("syncJobs", {
	id: int().autoincrement().notNull(),
	jobType: mysqlEnum(['qiwa_companies','qiwa_employees','mhrsd_regulations','mhrsd_violations','mol_contracts','gosi_contributions']).notNull(),
	status: mysqlEnum(['pending','running','completed','failed','cancelled']).default('pending').notNull(),
	triggerType: mysqlEnum(['manual','scheduled','webhook']).default('scheduled').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	lastRunAt: timestamp({ mode: 'string' }),
	nextRunAt: timestamp({ mode: 'string' }),
	cronExpression: varchar({ length: 100 }),
	recordsProcessed: int().default(0),
	recordsCreated: int().default(0),
	recordsUpdated: int().default(0),
	recordsFailed: int().default(0),
	errorMessage: text(),
	executionLog: json(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const systemConfig = mysqlTable("systemConfig", {
	id: int().autoincrement().notNull(),
	configKey: varchar({ length: 255 }).notNull(),
	configValue: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_config_key").on(table.configKey),
	index("configKey").on(table.configKey),
]);

export const talentPool = mysqlTable("talentPool", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	tags: json(),
	notes: text(),
	matchScore: int(),
	addedFromJobId: int().references(() => jobs.id, { onDelete: "set null" } ),
	status: mysqlEnum(['active','contacted','hired','not_interested']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
	index("candidateId_idx").on(table.candidateId),
]);

export const teamMetrics = mysqlTable("teamMetrics", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	teamId: varchar({ length: 100 }).notNull(),
	teamName: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 255 }),
	memberCount: int().notNull(),
	productivityScore: int(),
	collaborationScore: int(),
	goalAchievementRate: int(),
	avgSkillLevel: int(),
	innovationIndex: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("employerId_idx").on(table.employerId),
]);

export const testCampaigns = mysqlTable("testCampaigns", {
	id: int().autoincrement().notNull(),
	scenarioId: int().notNull().references(() => testScenarios.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	campaignType: mysqlEnum(['email','sms','notification','multi_channel']).notNull(),
	templateId: int().references(() => emailTemplates.id, { onDelete: "cascade" } ),
	targetAudience: json(),
	content: json(),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("scenarioId_idx").on(table.scenarioId),
]);

export const testData = mysqlTable("testData", {
	id: int().autoincrement().notNull(),
	executionId: int().notNull().references(() => testExecutions.id, { onDelete: "cascade" } ),
	dataType: mysqlEnum(['candidate','job','application','interview','email','campaign_execution']).notNull(),
	recordId: int().notNull(),
	recordData: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("executionId_idx").on(table.executionId),
	index("dataType_idx").on(table.dataType),
]);

export const testExecutions = mysqlTable("testExecutions", {
	id: int().autoincrement().notNull(),
	scenarioId: int().notNull().references(() => testScenarios.id, { onDelete: "cascade" } ),
	status: mysqlEnum(['pending','running','completed','failed']).default('pending'),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	executedBy: int().references(() => users.id, { onDelete: "cascade" } ),
	sampleDataGenerated: tinyint().default(0),
	testCandidatesCount: int().default(0),
	testJobsCount: int().default(0),
	testApplicationsCount: int().default(0),
	triggersExecuted: int().default(0),
	campaignsExecuted: int().default(0),
	results: json(),
	errorLog: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("scenarioId_idx").on(table.scenarioId),
	index("status_idx").on(table.status),
]);

export const testResults = mysqlTable("testResults", {
	id: int().autoincrement().notNull(),
	executionId: int().notNull().references(() => testExecutions.id, { onDelete: "cascade" } ),
	testType: varchar({ length: 100 }).notNull(),
	testName: varchar({ length: 255 }).notNull(),
	passed: tinyint().notNull(),
	expectedValue: text(),
	actualValue: text(),
	executionTime: int(),
	errorMessage: text(),
	stackTrace: text(),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("executionId_idx").on(table.executionId),
	index("passed_idx").on(table.passed),
]);

export const testScenarios = mysqlTable("testScenarios", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	scenarioType: mysqlEnum(['candidate_application','interview_scheduling','email_campaign','engagement_tracking','ab_testing','full_workflow']).notNull(),
	isActive: tinyint().default(1),
	createdBy: int().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const testTriggers = mysqlTable("testTriggers", {
	id: int().autoincrement().notNull(),
	scenarioId: int().notNull().references(() => testScenarios.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	triggerType: mysqlEnum(['application_submitted','interview_scheduled','interview_completed','feedback_submitted','engagement_score_change','time_based','manual']).notNull(),
	triggerConditions: json(),
	delayMinutes: int().default(0),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("scenarioId_idx").on(table.scenarioId),
]);

export const trainingJobs = mysqlTable("trainingJobs", {
	id: int().autoincrement().notNull(),
	modelName: varchar({ length: 255 }).notNull(),
	modelVersion: varchar({ length: 100 }).notNull(),
	modelType: mysqlEnum(['resume_parser','job_matcher','skill_extractor','entity_recognition']).notNull(),
	datasetId: int().notNull(),
	baseModel: varchar({ length: 255 }),
	hyperparameters: json(),
	status: mysqlEnum(['queued','running','completed','failed','cancelled']).default('queued').notNull(),
	progress: int().default(0),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	trainingDuration: int(),
	metrics: json(),
	modelArtifactUrl: text(),
	modelArtifactKey: text(),
	errorMessage: text(),
	logs: text(),
	isProduction: tinyint().default(0),
	deployedAt: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userNotificationPreferences = mysqlTable("userNotificationPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	quietHoursEnabled: tinyint().default(0),
	quietHoursStart: varchar({ length: 5 }).default('22:00'),
	quietHoursEnd: varchar({ length: 5 }).default('08:00'),
	quietHoursTimezone: varchar({ length: 100 }).default('UTC'),
	quietHoursDays: json(),
	interviewReminderPush: tinyint().default(1),
	interviewReminderEmail: tinyint().default(1),
	interviewReminderSms: tinyint().default(0),
	feedbackRequestPush: tinyint().default(1),
	feedbackRequestEmail: tinyint().default(1),
	feedbackRequestSms: tinyint().default(0),
	candidateResponsePush: tinyint().default(1),
	candidateResponseEmail: tinyint().default(1),
	candidateResponseSms: tinyint().default(0),
	engagementAlertPush: tinyint().default(1),
	engagementAlertEmail: tinyint().default(0),
	engagementAlertSms: tinyint().default(0),
	abTestResultPush: tinyint().default(0),
	abTestResultEmail: tinyint().default(1),
	abTestResultSms: tinyint().default(0),
	systemUpdatePush: tinyint().default(0),
	systemUpdateEmail: tinyint().default(1),
	systemUpdateSms: tinyint().default(0),
	generalPush: tinyint().default(1),
	generalEmail: tinyint().default(1),
	generalSms: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("userId").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','candidate','employer']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	calendarProvider: mysqlEnum(['google','outlook']).default('google'),
	outlookUserId: varchar({ length: 320 }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const videoInterviews = mysqlTable("videoInterviews", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id, { onDelete: "cascade" } ),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" } ),
	employerId: int().notNull().references(() => employers.id, { onDelete: "cascade" } ),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" } ),
	scheduledTime: timestamp({ mode: 'string' }),
	duration: int().default(30),
	meetingUrl: text(),
	calendlyEventId: varchar({ length: 255 }),
	status: mysqlEnum(['pending','scheduled','completed','cancelled']).default('pending'),
	notes: text(),
	reminderSent: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	templateId: int(),
},
(table) => [
	index("applicationId_idx").on(table.applicationId),
	index("candidateId_idx").on(table.candidateId),
	index("employerId_idx").on(table.employerId),
]);

export const workPermits = mysqlTable("workPermits", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	candidateId: int(),
	permitNumber: varchar({ length: 100 }).notNull(),
	employeeName: varchar({ length: 255 }).notNull(),
	candidateName: varchar({ length: 255 }),
	employeeNationalId: varchar({ length: 50 }),
	iqamaNumber: varchar({ length: 50 }),
	nationality: varchar({ length: 100 }),
	occupation: varchar({ length: 255 }),
	jobTitle: varchar({ length: 255 }),
	issueDate: timestamp({ mode: 'string' }).notNull(),
	expiryDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['active','expired','cancelled','pending_renewal','suspended']).default('active').notNull(),
	qiwaReferenceId: varchar({ length: 100 }),
	renewalReminderSent: tinyint().default(0),
	calendarEventId: varchar({ length: 255 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const workforceHistory = mysqlTable("workforceHistory", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	snapshotDate: timestamp({ mode: 'string' }).notNull(),
	totalEmployees: int().notNull(),
	saudiEmployees: int().notNull(),
	expatEmployees: int().notNull(),
	saudizationPercentage: bigint({ mode: "number" }).notNull(),
	nitaqatBand: mysqlEnum(['platinum','green','yellow','red']).notNull(),
	employeesAdded: int().default(0),
	employeesRemoved: int().default(0),
	saudiEmployeesAdded: int().default(0),
	saudiEmployeesRemoved: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const workforcePlanningScenarios = mysqlTable("workforcePlanningScenarios", {
	id: int().autoincrement().notNull(),
	employerId: int().notNull(),
	scenarioName: varchar({ length: 255 }).notNull(),
	scenarioDescription: text(),
	baselineTotalEmployees: int().notNull(),
	baselineSaudiEmployees: int().notNull(),
	baselineExpatEmployees: int().notNull(),
	baselineNitaqatBand: mysqlEnum(['platinum','green','yellow','red']).notNull(),
	plannedSaudiHires: int().default(0),
	plannedExpatHires: int().default(0),
	plannedSaudiTerminations: int().default(0),
	plannedExpatTerminations: int().default(0),
	projectedTotalEmployees: int().notNull(),
	projectedSaudiEmployees: int().notNull(),
	projectedExpatEmployees: int().notNull(),
	projectedSaudizationPercentage: bigint({ mode: "number" }).notNull(),
	projectedNitaqatBand: mysqlEnum(['platinum','green','yellow','red']).notNull(),
	complianceImprovement: tinyint().notNull(),
	bandChange: varchar({ length: 100 }),
	estimatedCostImpact: bigint({ mode: "number" }),
	estimatedTimeToCompliance: int(),
	aiRecommendations: json(),
	riskAssessment: text(),
	scenarioStatus: mysqlEnum(['draft','active','implemented','archived']).default('draft'),
	implementedDate: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const candidateNationality = mysqlTable("candidateNationality", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	isSaudi: tinyint().default(0).notNull(),
	nationality: varchar({ length: 100 }).notNull(),
	iqamaNumber: varchar({ length: 50 }),
	iqamaExpiry: timestamp({ mode: 'string' }),
	workPermitStatus: varchar({ length: 50 }),
	workPermitExpiry: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("isSaudi_idx").on(table.isSaudi),
]);

export const smsProviderConfig = mysqlTable("smsProviderConfig", {
	id: int().autoincrement().notNull(),
	provider: mysqlEnum(['twilio','aws_sns','custom']).notNull(),
	accountSid: varchar({ length: 255 }),
	authToken: text(),
	fromPhoneNumber: varchar({ length: 50 }),
	awsAccessKeyId: varchar({ length: 255 }),
	awsSecretAccessKey: text(),
	awsRegion: varchar({ length: 50 }),
	customApiUrl: text(),
	customApiKey: text(),
	isActive: tinyint().default(0).notNull(),
	dailyLimit: int().default(1000),
	monthlyLimit: int().default(10000),
	costPerSms: bigint({ mode: "number" }).default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const smsNotificationLog = mysqlTable("smsNotificationLog", {
	id: int().autoincrement().notNull(),
	notificationId: int().references(() => notificationHistory.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	phoneNumber: varchar({ length: 50 }).notNull(),
	message: text().notNull(),
	provider: mysqlEnum(['twilio','aws_sns','custom']).notNull(),
	messageId: varchar({ length: 255 }),
	status: mysqlEnum(['pending','sent','delivered','failed','undelivered']).default('pending').notNull(),
	deliveredAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	cost: bigint({ mode: "number" }).default(0),
	segments: int().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationId_idx").on(table.notificationId),
	index("userId_idx").on(table.userId),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
]);

export const quietHoursSchedule = mysqlTable("quietHoursSchedule", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	dayOfWeek: mysqlEnum(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']).notNull(),
	startTime: varchar({ length: 5 }).notNull(),
	endTime: varchar({ length: 5 }).notNull(),
	timezone: varchar({ length: 100 }).default('UTC').notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("dayOfWeek_idx").on(table.dayOfWeek),
	index("isActive_idx").on(table.isActive),
]);

	export const notificationTemplates = mysqlTable("notificationTemplates", {
		id: int().autoincrement().notNull(),
		employerId: int().references(() => employers.id, { onDelete: "cascade" }),
		name: varchar({ length: 255 }).notNull(),
		description: text(),
		type: mysqlEnum(['interview_reminder','feedback_request','candidate_response','engagement_alert','ab_test_result','system_update','general','custom']).notNull(),
		channel: mysqlEnum(['push','email','sms','push_email']).notNull(),
		subject: varchar({ length: 500 }),
		bodyTemplate: text().notNull(),
		variables: json(),
		isDefault: tinyint().default(0),
		isActive: tinyint().default(1),
		usageCount: int().default(0),
		lastUsedAt: timestamp({ mode: 'string' }),
		createdBy: int().references(() => users.id, { onDelete: "set null" }),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	},
	(table) => [
		index("employerId_idx").on(table.employerId),
		index("type_idx").on(table.type),
		index("channel_idx").on(table.channel),
		index("isActive_idx").on(table.isActive),
	]);

	export const notificationTemplateVariables = mysqlTable("notificationTemplateVariables", {
		id: int().autoincrement().notNull(),
		name: varchar({ length: 100 }).notNull(),
		description: text(),
		placeholder: varchar({ length: 100 }).notNull(),
		dataType: mysqlEnum(['string','number','date','boolean','url']).default('string').notNull(),
		defaultValue: text(),
		isRequired: tinyint().default(0),
		category: mysqlEnum(['candidate','interview','job','company','system']).notNull(),
		exampleValue: text(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	},
	(table) => [
		index("name_idx").on(table.name),
		index("category_idx").on(table.category),
	]);

	export const notificationQueue = mysqlTable("notificationQueue", {
		id: int().autoincrement().notNull(),
		userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
		templateId: int().references(() => notificationTemplates.id, { onDelete: "set null" }),
		type: mysqlEnum(['interview_reminder','feedback_request','candidate_response','engagement_alert','ab_test_result','system_update','general']).notNull(),
		title: varchar({ length: 255 }).notNull(),
		message: text().notNull(),
		actionUrl: text(),
		priority: mysqlEnum(['low','medium','high','urgent']).default('medium'),
		deliveryMethod: mysqlEnum(['push','email','sms','push_email','push_sms','email_sms','all']).notNull(),
		scheduledFor: timestamp({ mode: 'string' }).notNull(),
		optimalSendTime: tinyint().default(0),
		userSegment: varchar({ length: 100 }),
		campaignId: int().references(() => emailCampaigns.id, { onDelete: "set null" }),
		status: mysqlEnum(['queued','processing','sent','failed','cancelled']).default('queued').notNull(),
		attempts: int().default(0).notNull(),
		lastAttemptAt: timestamp({ mode: 'string' }),
		errorMessage: text(),
		metadata: json(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	},
	(table) => [
		index("userId_idx").on(table.userId),
		index("templateId_idx").on(table.templateId),
		index("status_idx").on(table.status),
		index("scheduledFor_idx").on(table.scheduledFor),
		index("priority_idx").on(table.priority),
		index("userSegment_idx").on(table.userSegment),
		index("campaignId_idx").on(table.campaignId),
	]);


// Saved Matches - Bookmark promising candidate-job matches
export const savedMatches = mysqlTable("savedMatches", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	overallScore: int().notNull(),
	technicalScore: int().notNull(),
	cultureFitScore: int().notNull(),
	wellbeingScore: int().notNull(),
	matchExplanation: text(),
	matchMetadata: json(), // Store full match details for future reference
	notes: text(), // User's notes about this match
	tags: json(), // Array of custom tags for organization
	status: mysqlEnum(['saved','contacted','interviewing','hired','rejected','archived']).default('saved').notNull(),
	priority: mysqlEnum(['low','medium','high']).default('medium'),
	savedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	lastViewedAt: timestamp({ mode: 'string' }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
	index("status_idx").on(table.status),
	index("priority_idx").on(table.priority),
	index("savedAt_idx").on(table.savedAt),
	// Unique constraint to prevent duplicate saves
	index("unique_match_idx").on(table.userId, table.candidateId, table.jobId),
]);

// Match Analytics - Aggregate statistics for predictive insights
export const matchAnalytics = mysqlTable("matchAnalytics", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	// Overall metrics
	totalMatches: int().default(0).notNull(),
	totalHires: int().default(0).notNull(),
	successRate: int().default(0),
	averageTimeToHire: int(),
	averageRetention: int(),
	// Score accuracy
	averageMatchScore: int(),
	averageHiredScore: int(),
	averageRejectedScore: int(),
	scoreAccuracy: int(),
	// Attribute insights
	topPredictiveAttributes: json(),
	attributeImportance: json(),
	// Culture & wellbeing insights
	cultureFitImportance: int(),
	wellbeingImportance: int(),
	burnoutCorrelation: int(),
	// Recommendations
	recommendedWeights: json(),
	insights: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("periodStart_idx").on(table.periodStart),
	index("periodEnd_idx").on(table.periodEnd),
]);


// ============================================================================
// PROFILE ENRICHMENT SYSTEM
// ============================================================================

// Profile Enrichment Jobs - Track enrichment requests and status
export const profileEnrichmentJobs = mysqlTable("profileEnrichmentJobs", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'partial']).default('pending').notNull(),
	enrichmentType: mysqlEnum(['full', 'skills', 'experience', 'education', 'certifications']).default('full').notNull(),
	dataSource: mysqlEnum(['resume', 'linkedin', 'manual', 'api']).default('resume').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	processingTime: int(), // milliseconds
	errorMessage: text(),
	errorDetails: json(),
	retryCount: int().default(0),
	maxRetries: int().default(3),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("userId_idx").on(table.userId),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
]);

// Enrichment Results - Store extracted data from enrichment process
export const enrichmentResults = mysqlTable("enrichmentResults", {
	id: int().autoincrement().notNull(),
	jobId: int().notNull().references(() => profileEnrichmentJobs.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	// Skills extraction
	extractedSkills: json(), // [{name, level, yearsOfExperience, category}]
	skillsConfidence: int(), // 0-100
	// Experience extraction
	extractedExperience: json(), // [{company, title, duration, responsibilities, achievements}]
	experienceConfidence: int(),
	totalYearsExperience: int(),
	// Education extraction
	extractedEducation: json(), // [{institution, degree, field, graduationYear, gpa}]
	educationConfidence: int(),
	// Certifications extraction
	extractedCertifications: json(), // [{name, issuer, issueDate, expiryDate, credentialId}]
	certificationsConfidence: int(),
	// Additional insights
	careerProgression: text(),
	industryExpertise: json(),
	leadershipIndicators: json(),
	technicalDepth: int(), // 0-100
	overallConfidence: int(), // 0-100
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("jobId_idx").on(table.jobId),
	index("candidateId_idx").on(table.candidateId),
]);

// Enrichment Metrics - Track enrichment system performance
export const enrichmentMetrics = mysqlTable("enrichmentMetrics", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	totalEnrichments: int().default(0),
	successfulEnrichments: int().default(0),
	failedEnrichments: int().default(0),
	partialEnrichments: int().default(0),
	averageProcessingTime: int(), // milliseconds
	averageConfidence: int(), // 0-100
	skillsExtracted: int().default(0),
	experienceExtracted: int().default(0),
	educationExtracted: int().default(0),
	certificationsExtracted: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("periodStart_idx").on(table.periodStart),
]);

// ============================================================================
// BULK OPERATIONS SYSTEM
// ============================================================================

// Bulk Operations - Track bulk operation requests
export const bulkOperations = mysqlTable("bulkOperations", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	operationType: mysqlEnum([
		'status_update',
		'send_notification',
		'schedule_interview',
		'export_data',
		'enrich_profiles',
		'send_email_campaign'
	]).notNull(),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending').notNull(),
	targetCount: int().notNull(), // Total number of items to process
	processedCount: int().default(0), // Number of items processed
	successCount: int().default(0), // Number of successful operations
	failedCount: int().default(0), // Number of failed operations
	targetCriteria: json(), // Filter criteria for target selection
	operationParams: json(), // Parameters for the operation
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	cancelledBy: int().references(() => users.id, { onDelete: "set null" }),
	processingTime: int(), // milliseconds
	errorSummary: text(),
	resultsSummary: json(), // Summary of results
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("operationType_idx").on(table.operationType),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
]);

// Bulk Operation Items - Individual items in a bulk operation
export const bulkOperationItems = mysqlTable("bulkOperationItems", {
	id: int().autoincrement().notNull(),
	operationId: int().notNull().references(() => bulkOperations.id, { onDelete: "cascade" }),
	targetId: int().notNull(), // ID of the target entity (candidate, application, etc.)
	targetType: mysqlEnum(['candidate', 'application', 'interview', 'job']).notNull(),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'skipped']).default('pending').notNull(),
	processedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	result: json(), // Result data for this item
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("operationId_idx").on(table.operationId),
	index("targetId_idx").on(table.targetId),
	index("status_idx").on(table.status),
]);

// ============================================================================
// EMAIL TEMPLATE SYSTEM
// ============================================================================

// Email Templates - Reusable email templates with variables
export const emailTemplatesV2 = mysqlTable("emailTemplatesV2", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: mysqlEnum([
		'interview_invitation',
		'rejection',
		'offer',
		'follow_up',
		'reminder',
		'welcome',
		'general'
	]).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(), // Plain text version
	variables: json(), // [{name, description, required, defaultValue}]
	isActive: tinyint().default(1),
	isDefault: tinyint().default(0), // Default template for category
	usageCount: int().default(0),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("category_idx").on(table.category),
	index("isActive_idx").on(table.isActive),
]);

// Template Variables - Available variables for templates
export const templateVariables = mysqlTable("templateVariables", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull().unique(), // e.g., "firstName", "jobTitle"
	displayName: varchar({ length: 255 }).notNull(), // e.g., "First Name", "Job Title"
	description: text(),
	category: mysqlEnum(['candidate', 'job', 'company', 'interview', 'system']).notNull(),
	dataType: mysqlEnum(['string', 'number', 'date', 'boolean', 'array', 'object']).notNull(),
	sampleValue: varchar({ length: 500 }),
	isSystem: tinyint().default(0), // System variables cannot be deleted
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("isSystem_idx").on(table.isSystem),
]);

// Email A/B Tests - A/B testing for email templates
export const emailAbTestsV2 = mysqlTable("emailAbTestsV2", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	testType: mysqlEnum(['subject', 'content', 'send_time', 'full_template']).notNull(),
	variantATemplateId: int().notNull().references(() => emailTemplatesV2.id, { onDelete: "cascade" }),
	variantBTemplateId: int().notNull().references(() => emailTemplatesV2.id, { onDelete: "cascade" }),
	status: mysqlEnum(['draft', 'running', 'completed', 'cancelled']).default('draft').notNull(),
	trafficSplit: int().default(50), // Percentage for variant A (B gets 100-A)
	minimumSampleSize: int().default(100),
	confidenceLevel: int().default(95), // 90, 95, or 99
	primaryMetric: mysqlEnum(['open_rate', 'click_rate', 'response_rate', 'conversion_rate']).notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	winnerVariant: mysqlEnum(['A', 'B', 'no_winner']),
	winnerDeterminedAt: timestamp({ mode: 'string' }),
	statisticalSignificance: int(), // 0-100
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("status_idx").on(table.status),
	index("startedAt_idx").on(table.startedAt),
]);

// A/B Test Results - Detailed results for each variant
export const abTestVariantResults = mysqlTable("abTestVariantResults", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => emailAbTestsV2.id, { onDelete: "cascade" }),
	variant: mysqlEnum(['A', 'B']).notNull(),
	sentCount: int().default(0),
	deliveredCount: int().default(0),
	openedCount: int().default(0),
	clickedCount: int().default(0),
	respondedCount: int().default(0),
	convertedCount: int().default(0),
	bouncedCount: int().default(0),
	unsubscribedCount: int().default(0),
	openRate: int().default(0), // Percentage * 100 (e.g., 2550 = 25.50%)
	clickRate: int().default(0),
	responseRate: int().default(0),
	conversionRate: int().default(0),
	averageResponseTime: int(), // minutes
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
	index("variant_idx").on(table.variant),
]);

// Campaign Sends - Track individual email sends from campaigns
export const campaignSends = mysqlTable("campaignSends", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
	abTestId: int().references(() => emailAbTestsV2.id, { onDelete: "set null" }),
	variant: mysqlEnum(['A', 'B', 'control']),
	templateId: int().notNull().references(() => emailTemplatesV2.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	recipientEmail: varchar({ length: 320 }).notNull(),
	recipientName: varchar({ length: 255 }),
	personalizedSubject: varchar({ length: 500 }).notNull(),
	personalizedBody: text().notNull(),
	variablesUsed: json(), // Variables and their values for this send
	status: mysqlEnum(['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	bouncedAt: timestamp({ mode: 'string' }),
	openCount: int().default(0), // Track multiple opens
	clickCount: int().default(0), // Track multiple clicks
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("campaignId_idx").on(table.campaignId),
	index("abTestId_idx").on(table.abTestId),
	index("templateId_idx").on(table.templateId),
	index("candidateId_idx").on(table.candidateId),
	index("status_idx").on(table.status),
	index("sentAt_idx").on(table.sentAt),
]);

// ============================================================================
// REPORT EMAIL TEMPLATES - Advanced templates for scheduled reports
// ============================================================================

// Report Email Templates - Branded templates for scheduled reports with custom headers/footers
export const reportEmailTemplates = mysqlTable("reportEmailTemplates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	// Branding settings
	logoUrl: varchar({ length: 1000 }),
	primaryColor: varchar({ length: 7 }).default('#1e40af'), // Hex color
	secondaryColor: varchar({ length: 7 }).default('#3b82f6'),
	fontFamily: varchar({ length: 100 }).default('Arial, sans-serif'),
	// Header/Footer content
	headerHtml: text(),
	footerHtml: text(),
	// Main template content
	subjectTemplate: varchar({ length: 500 }).notNull(),
	bodyHtml: text().notNull(),
	bodyText: text(),
	// Dynamic content blocks configuration
	contentBlocks: json(), // [{id, type, config, position}]
	// Merge tags/variables
	availableMergeTags: json(), // [{tag, description, sampleValue}]
	// Template settings
	isDefault: tinyint().default(0),
	isActive: tinyint().default(1),
	usageCount: int().default(0),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("isActive_idx").on(table.isActive),
]);

// Template Preview History - Store preview snapshots
export const templatePreviewHistory = mysqlTable("templatePreviewHistory", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull().references(() => reportEmailTemplates.id, { onDelete: "cascade" }),
	previewHtml: text().notNull(),
	sampleData: json(), // Sample data used for preview
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("templateId_idx").on(table.templateId),
]);

// ============================================================================
// ANALYTICS AGGREGATION TABLES
// ============================================================================

// Advanced Analytics - Import, Audit, and Report delivery metrics
export const advancedAnalytics = mysqlTable("advancedAnalytics", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	date: timestamp({ mode: 'string' }).notNull(),
	// Import metrics
	importsStarted: int().default(0),
	importsCompleted: int().default(0),
	importsFailed: int().default(0),
	recordsImported: int().default(0),
	avgImportTime: int().default(0), // milliseconds
	// Audit activity metrics
	auditEventsCreated: int().default(0),
	dataChanges: int().default(0),
	complianceViolations: int().default(0),
	criticalChanges: int().default(0),
	// Report delivery metrics
	reportsScheduled: int().default(0),
	reportsDelivered: int().default(0),
	reportsFailed: int().default(0),
	avgDeliveryTime: int().default(0), // milliseconds
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_date_idx").on(table.userId, table.date),
	index("date_idx").on(table.date),
]);

// Daily Analytics Snapshots - Pre-aggregated daily metrics
export const dailyAnalytics = mysqlTable("dailyAnalytics", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	date: timestamp({ mode: 'string' }).notNull(),
	// Notification metrics
	notificationsSent: int().default(0),
	notificationsRead: int().default(0),
	notificationsClicked: int().default(0),
	avgNotificationResponseTime: int(), // minutes
	// Enrichment metrics
	enrichmentsStarted: int().default(0),
	enrichmentsCompleted: int().default(0),
	enrichmentsFailed: int().default(0),
	avgEnrichmentTime: int(), // milliseconds
	avgEnrichmentConfidence: int(), // 0-100
	// Bulk operation metrics
	bulkOperationsStarted: int().default(0),
	bulkOperationsCompleted: int().default(0),
	bulkOperationsFailed: int().default(0),
	avgBulkOperationTime: int(), // milliseconds
	totalItemsProcessed: int().default(0),
	// Email campaign metrics
	emailsSent: int().default(0),
	emailsDelivered: int().default(0),
	emailsOpened: int().default(0),
	emailsClicked: int().default(0),
	emailBounceRate: int(), // Percentage * 100
	// Time-to-hire metrics
	candidatesHired: int().default(0),
	avgTimeToHire: int(), // days
	avgTimeToHireWithEnrichment: int(), // days
	avgTimeToHireWithoutEnrichment: int(), // days
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("date_idx").on(table.date),
	index("unique_user_date").on(table.userId, table.date),
]);


// ============================================================================
// B2C TRAINING & SKILL DEVELOPMENT SYSTEM
// ============================================================================

// Training Programs - Catalog of available courses and learning paths
export const trainingPrograms = mysqlTable("trainingPrograms", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull().unique(),
	description: text(),
	category: mysqlEnum(['technical','soft_skills','industry_specific','certification','language','leadership']).notNull(),
	level: mysqlEnum(['beginner','intermediate','advanced','expert']).default('beginner').notNull(),
	duration: int(), // Total duration in hours
	format: mysqlEnum(['self_paced','instructor_led','hybrid','workshop']).default('self_paced').notNull(),
	price: int().default(0), // Price in smallest currency unit (e.g., cents)
	isFree: tinyint().default(1).notNull(),
	thumbnailUrl: text(),
	videoPreviewUrl: text(),
	skillsGained: json(), // Array of skill IDs or names
	prerequisites: json(), // Array of prerequisite program IDs
	learningOutcomes: json(), // Array of learning outcome strings
	instructorName: varchar({ length: 255 }),
	instructorBio: text(),
	enrollmentCount: int().default(0),
	averageRating: int().default(0), // Rating * 100 (e.g., 4.5 = 450)
	reviewCount: int().default(0),
	isPublished: tinyint().default(0).notNull(),
	isFeatured: tinyint().default(0),
	certificateAwarded: tinyint().default(0),
	certificateTemplate: text(), // URL or template ID
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("level_idx").on(table.level),
	index("isPublished_idx").on(table.isPublished),
	index("isFeatured_idx").on(table.isFeatured),
]);

// Course Modules - Structured learning modules within programs
export const courseModules = mysqlTable("courseModules", {
	id: int().autoincrement().notNull(),
	programId: int().notNull().references(() => trainingPrograms.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	orderIndex: int().notNull(), // Order within the program
	duration: int(), // Duration in minutes
	isRequired: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("programId_idx").on(table.programId),
	index("orderIndex_idx").on(table.orderIndex),
]);

// Course Lessons - Individual lessons within modules
export const courseLessons = mysqlTable("courseLessons", {
	id: int().autoincrement().notNull(),
	moduleId: int().notNull().references(() => courseModules.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	contentType: mysqlEnum(['video','article','quiz','assignment','interactive','download']).notNull(),
	contentUrl: text(), // Video URL, article content, etc.
	contentKey: text(), // S3 key if stored in S3
	duration: int(), // Duration in minutes
	orderIndex: int().notNull(),
	isPreview: tinyint().default(0), // Can be accessed without enrollment
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("moduleId_idx").on(table.moduleId),
	index("orderIndex_idx").on(table.orderIndex),
]);

// Program Enrollments - Track user enrollments in training programs
export const programEnrollments = mysqlTable("programEnrollments", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	programId: int().notNull().references(() => trainingPrograms.id, { onDelete: "cascade" }),
	status: mysqlEnum(['enrolled','in_progress','completed','dropped','expired']).default('enrolled').notNull(),
	progress: int().default(0), // Percentage * 100 (e.g., 45% = 4500)
	enrolledAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	certificateUrl: text(), // Generated certificate URL
	certificateKey: text(), // S3 key for certificate
	lastAccessedAt: timestamp({ mode: 'string' }),
	timeSpent: int().default(0), // Total time spent in minutes
	currentModuleId: int().references(() => courseModules.id, { onDelete: "set null" }),
	currentLessonId: int().references(() => courseLessons.id, { onDelete: "set null" }),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("programId_idx").on(table.programId),
	index("status_idx").on(table.status),
	index("unique_user_program").on(table.userId, table.programId),
]);

// Lesson Progress - Track individual lesson completion
export const lessonProgress = mysqlTable("lessonProgress", {
	id: int().autoincrement().notNull(),
	enrollmentId: int().notNull().references(() => programEnrollments.id, { onDelete: "cascade" }),
	lessonId: int().notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
	status: mysqlEnum(['not_started','in_progress','completed']).default('not_started').notNull(),
	progress: int().default(0), // Percentage * 100
	timeSpent: int().default(0), // Time spent in minutes
	completedAt: timestamp({ mode: 'string' }),
	lastAccessedAt: timestamp({ mode: 'string' }),
	notes: text(), // User's personal notes
},
(table) => [
	index("enrollmentId_idx").on(table.enrollmentId),
	index("lessonId_idx").on(table.lessonId),
	index("unique_enrollment_lesson").on(table.enrollmentId, table.lessonId),
]);

// Quiz Attempts - Track quiz/assessment attempts
export const quizAttempts = mysqlTable("quizAttempts", {
	id: int().autoincrement().notNull(),
	enrollmentId: int().notNull().references(() => programEnrollments.id, { onDelete: "cascade" }),
	lessonId: int().notNull().references(() => courseLessons.id, { onDelete: "cascade" }),
	attemptNumber: int().notNull(),
	score: int(), // Score * 100 (e.g., 85% = 8500)
	maxScore: int().notNull(),
	passed: tinyint().default(0),
	answers: json(), // User's answers
	startedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
	timeSpent: int(), // Time spent in minutes
},
(table) => [
	index("enrollmentId_idx").on(table.enrollmentId),
	index("lessonId_idx").on(table.lessonId),
]);

// Program Reviews - User reviews and ratings for programs
export const programReviews = mysqlTable("programReviews", {
	id: int().autoincrement().notNull(),
	programId: int().notNull().references(() => trainingPrograms.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	rating: int().notNull(), // 1-5 stars
	review: text(),
	isVerifiedEnrollment: tinyint().default(0), // User completed the program
	helpfulCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("programId_idx").on(table.programId),
	index("userId_idx").on(table.userId),
	index("unique_user_program").on(table.userId, table.programId),
]);

// ============================================================================
// SKILL DEVELOPMENT & CAREER PATHS
// ============================================================================

// Skills Taxonomy - Master list of skills
export const skillsTaxonomy = mysqlTable("skillsTaxonomy", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull().unique(),
	category: mysqlEnum(['technical','soft_skill','language','certification','tool','framework','domain_knowledge']).notNull(),
	description: text(),
	parentSkillId: int(), // For skill hierarchies (e.g., "React" under "JavaScript")
	demandScore: int().default(0), // Market demand score (0-100)
	isVerifiable: tinyint().default(0), // Can be verified through tests/certificates
	relatedSkills: json(), // Array of related skill IDs
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("parentSkillId_idx").on(table.parentSkillId),
]);

// Candidate Skills - Skills associated with candidates
export const candidateSkills = mysqlTable("candidateSkills", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	skillId: int().notNull().references(() => skillsTaxonomy.id, { onDelete: "cascade" }),
	proficiencyLevel: mysqlEnum(['beginner','intermediate','advanced','expert']).default('beginner').notNull(),
	yearsOfExperience: int(),
	isVerified: tinyint().default(0),
	verificationSource: mysqlEnum(['certificate','test','endorsement','self_reported']),
	verificationDate: timestamp({ mode: 'string' }),
	lastUsed: timestamp({ mode: 'string' }),
	acquiredFrom: mysqlEnum(['work','training','education','self_study']),
	acquiredAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("skillId_idx").on(table.skillId),
	index("unique_candidate_skill").on(table.candidateId, table.skillId),
]);

// Career Paths - Predefined career progression paths
export const careerPaths = mysqlTable("careerPaths", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	industry: varchar({ length: 255 }),
	startingRole: varchar({ length: 255 }),
	targetRole: varchar({ length: 255 }),
	estimatedDuration: int(), // Duration in months
	requiredSkills: json(), // Array of skill IDs
	recommendedPrograms: json(), // Array of training program IDs
	milestones: json(), // Array of career milestones
	salaryRange: json(), // {min, max, currency} for each level
	demandTrend: mysqlEnum(['declining','stable','growing','high_demand']),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("industry_idx").on(table.industry),
	index("demandTrend_idx").on(table.demandTrend),
]);

// Candidate Career Goals - User's career aspirations and progress
export const candidateCareerGoals = mysqlTable("candidateCareerGoals", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	careerPathId: int().references(() => careerPaths.id, { onDelete: "set null" }),
	targetRole: varchar({ length: 255 }).notNull(),
	targetIndustry: varchar({ length: 255 }),
	targetSalary: int(),
	targetDate: timestamp({ mode: 'string' }),
	currentProgress: int().default(0), // Percentage * 100
	skillGaps: json(), // Array of missing skill IDs
	recommendedActions: json(), // AI-generated recommendations
	status: mysqlEnum(['active','achieved','abandoned','on_hold']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("careerPathId_idx").on(table.careerPathId),
	index("status_idx").on(table.status),
]);

// Skill Assessments - Tests to verify skill proficiency
export const skillAssessments = mysqlTable("skillAssessments", {
	id: int().autoincrement().notNull(),
	skillId: int().notNull().references(() => skillsTaxonomy.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	difficulty: mysqlEnum(['beginner','intermediate','advanced','expert']).notNull(),
	duration: int(), // Duration in minutes
	passingScore: int().notNull(), // Percentage * 100
	questions: json(), // Array of question objects
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("skillId_idx").on(table.skillId),
	index("difficulty_idx").on(table.difficulty),
]);

// Assessment Results - User's assessment attempt results
export const assessmentResults = mysqlTable("assessmentResults", {
	id: int().autoincrement().notNull(),
	assessmentId: int().notNull().references(() => skillAssessments.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	score: int().notNull(), // Percentage * 100
	passed: tinyint().notNull(),
	answers: json(), // User's answers
	timeSpent: int(), // Time spent in minutes
	attemptNumber: int().notNull(),
	completedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("assessmentId_idx").on(table.assessmentId),
	index("candidateId_idx").on(table.candidateId),
]);

// Certifications - Professional certifications earned by candidates
export const certifications = mysqlTable("certifications", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	issuingOrganization: varchar({ length: 255 }).notNull(),
	issueDate: timestamp({ mode: 'string' }),
	expiryDate: timestamp({ mode: 'string' }),
	credentialId: varchar({ length: 255 }),
	credentialUrl: text(),
	certificateUrl: text(), // Uploaded certificate file
	certificateKey: text(), // S3 key
	isVerified: tinyint().default(0),
	relatedSkills: json(), // Array of skill IDs
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("issuingOrganization_idx").on(table.issuingOrganization),
]);

// ============================================================================
// JOB SEEKER PORTAL & APPLICATION TRACKING
// ============================================================================

// Saved Jobs - Jobs bookmarked by candidates
export const savedJobsNew = mysqlTable("savedJobsNew", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	notes: text(),
	savedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
	index("unique_candidate_job").on(table.candidateId, table.jobId),
]);

// Job Alerts - Automated job alerts based on preferences
export const jobAlerts = mysqlTable("jobAlerts", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	keywords: json(), // Array of keywords
	location: varchar({ length: 255 }),
	jobType: mysqlEnum(['full_time','part_time','contract','internship']),
	workSetting: mysqlEnum(['remote','hybrid','onsite','flexible']),
	salaryMin: int(),
	frequency: mysqlEnum(['instant','daily','weekly']).default('daily').notNull(),
	isActive: tinyint().default(1).notNull(),
	lastSent: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("isActive_idx").on(table.isActive),
]);

// Resume Templates - Pre-built resume templates
export const resumeTemplates = mysqlTable("resumeTemplates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: mysqlEnum(['professional','creative','modern','traditional','technical']).notNull(),
	thumbnailUrl: text(),
	templateData: json(), // Template structure and styling
	isActive: tinyint().default(1).notNull(),
	usageCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("category_idx").on(table.category),
	index("isActive_idx").on(table.isActive),
]);

// Candidate Resumes - Resumes created/uploaded by candidates
export const candidateResumes = mysqlTable("candidateResumes", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	templateId: int().references(() => resumeTemplates.id, { onDelete: "set null" }),
	resumeData: json(), // Structured resume data
	fileUrl: text(), // Generated PDF URL
	fileKey: text(), // S3 key
	isDefault: tinyint().default(0),
	version: int().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("templateId_idx").on(table.templateId),
]);

// Career Assessments - Personality and career fit assessments
export const careerAssessments = mysqlTable("careerAssessments", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	assessmentType: mysqlEnum(['personality','skills','interests','values','work_style']).notNull(),
	questions: json(), // Array of question objects
	scoringRubric: json(), // How to calculate results
	duration: int(), // Duration in minutes
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("assessmentType_idx").on(table.assessmentType),
	index("isActive_idx").on(table.isActive),
]);

// Assessment Responses - User responses to career assessments
export const assessmentResponses = mysqlTable("assessmentResponses", {
	id: int().autoincrement().notNull(),
	assessmentId: int().notNull().references(() => careerAssessments.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	responses: json(), // User's answers
	results: json(), // Calculated results and insights
	recommendedCareers: json(), // Array of recommended career paths
	completedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("assessmentId_idx").on(table.assessmentId),
	index("candidateId_idx").on(table.candidateId),
]);

// Job Application Notes - Internal notes on applications
export const applicationNotes = mysqlTable("applicationNotes", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	note: text().notNull(),
	isInternal: tinyint().default(1), // Internal note vs shared with candidate
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("applicationId_idx").on(table.applicationId),
	index("userId_idx").on(table.userId),
]);


// ============================================
// Type Exports for all tables
// ============================================

// Core entities - with both singular and plural exports for compatibility
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = typeof employers.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

// Email and communication types
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export type EmailBranding = typeof emailBranding.$inferSelect;
export type InsertEmailBranding = typeof emailBranding.$inferInsert;

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

export type EmailAbTest = typeof emailAbTests.$inferSelect;
export type InsertEmailAbTest = typeof emailAbTests.$inferInsert;

export type EmailAbVariant = typeof emailAbVariants.$inferSelect;
export type InsertEmailAbVariant = typeof emailAbVariants.$inferInsert;

export type EmailAnalytics = typeof emailAnalytics.$inferSelect;
export type InsertEmailAnalytics = typeof emailAnalytics.$inferInsert;

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = typeof emailEvents.$inferInsert;

// Beta program types
export type BetaSignup = typeof betaSignups.$inferSelect;
export type InsertBetaSignup = typeof betaSignups.$inferInsert;

export type BetaOnboardingProgress = typeof betaOnboardingProgress.$inferSelect;
export type InsertBetaOnboardingProgress = typeof betaOnboardingProgress.$inferInsert;

export type BetaFeedback = typeof betaFeedback.$inferSelect;
export type InsertBetaFeedback = typeof betaFeedback.$inferInsert;

// KSA compliance types
export type MhrsdSyncStatus = typeof mhrsdSyncStatus.$inferSelect;
export type InsertMhrsdSyncStatus = typeof mhrsdSyncStatus.$inferInsert;

export type WorkPermit = typeof workPermits.$inferSelect;
export type InsertWorkPermit = typeof workPermits.$inferInsert;

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = typeof complianceReports.$inferInsert;

export type NitaqatTracking = typeof nitaqatTracking.$inferSelect;
export type InsertNitaqatTracking = typeof nitaqatTracking.$inferInsert;

// AI and NLP types
export type ResumeParseResult = typeof resumeParseResults.$inferSelect;
export type InsertResumeParseResult = typeof resumeParseResults.$inferInsert;

export type JobDescriptionAnalysis = typeof jobDescriptionAnalysis.$inferSelect;
export type InsertJobDescriptionAnalysis = typeof jobDescriptionAnalysis.$inferInsert;

export type NlpTrainingData = typeof nlpTrainingData.$inferSelect;
export type InsertNlpTrainingData = typeof nlpTrainingData.$inferInsert;

// Interview and feedback types
export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = typeof interviewFeedback.$inferInsert;

export type FeedbackTemplate = typeof feedbackTemplates.$inferSelect;
export type InsertFeedbackTemplate = typeof feedbackTemplates.$inferInsert;

// Notification types
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// Calendar types
export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type InsertCalendarConnection = typeof calendarConnections.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// Automation types
export type AutomationTrigger = typeof automationTriggers.$inferSelect;
export type InsertAutomationTrigger = typeof automationTriggers.$inferInsert;

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

// SMS and broadcast types
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = typeof smsCampaigns.$inferInsert;

export type SmsProviderConfig = typeof smsProviderConfig.$inferSelect;
export type InsertSmsProviderConfig = typeof smsProviderConfig.$inferInsert;

export type BroadcastMessage = typeof broadcastMessages.$inferSelect;
export type InsertBroadcastMessage = typeof broadcastMessages.$inferInsert;

export type BroadcastRecipient = typeof broadcastRecipients.$inferSelect;
export type InsertBroadcastRecipient = typeof broadcastRecipients.$inferInsert;

// Matching and analytics types
export type SavedMatch = typeof savedMatches.$inferSelect;
export type InsertSavedMatch = typeof savedMatches.$inferInsert;

export type MatchAnalytics = typeof matchAnalytics.$inferSelect;
export type InsertMatchAnalytics = typeof matchAnalytics.$inferInsert;

export type EngagementScoreHistory = typeof engagementScoreHistory.$inferSelect;
export type InsertEngagementScoreHistory = typeof engagementScoreHistory.$inferInsert;

// Bulk operations types
export type BulkOperation = typeof bulkOperations.$inferSelect;
export type InsertBulkOperation = typeof bulkOperations.$inferInsert;

export type BulkOperationItem = typeof bulkOperationItems.$inferSelect;
export type InsertBulkOperationItem = typeof bulkOperationItems.$inferInsert;

// Training types
export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = typeof trainingPrograms.$inferInsert;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;

// Profile enrichment types
export type ProfileEnrichmentJob = typeof profileEnrichmentJobs.$inferSelect;
export type InsertProfileEnrichmentJob = typeof profileEnrichmentJobs.$inferInsert;

export type EnrichmentResult = typeof enrichmentResults.$inferSelect;
export type InsertEnrichmentResult = typeof enrichmentResults.$inferInsert;

// Application timeline types
export type ApplicationTimeline = typeof applicationTimeline.$inferSelect;
export type InsertApplicationTimeline = typeof applicationTimeline.$inferInsert;

export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
export type InsertApplicationStatusHistory = typeof applicationStatusHistory.$inferInsert;

// Compliance alerts types
export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = typeof complianceAlerts.$inferInsert;

// Performance alerts types
export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

// Testing types
export type TestTrigger = typeof testTriggers.$inferSelect;
export type InsertTestTrigger = typeof testTriggers.$inferInsert;

export type TestCampaign = typeof testCampaigns.$inferSelect;
export type InsertTestCampaign = typeof testCampaigns.$inferInsert;

export type TestExecution = typeof testExecutions.$inferSelect;
export type InsertTestExecution = typeof testExecutions.$inferInsert;

export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = typeof testResults.$inferInsert;

// Additional types for remaining tables
export type CandidateSkill = typeof candidateSkills.$inferSelect;
export type InsertCandidateSkill = typeof candidateSkills.$inferInsert;

export type SkillsTaxonomy = typeof skillsTaxonomy.$inferSelect;
export type InsertSkillsTaxonomy = typeof skillsTaxonomy.$inferInsert;

export type JobAlert = typeof jobAlerts.$inferSelect;
export type InsertJobAlert = typeof jobAlerts.$inferInsert;

export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = typeof savedJobs.$inferInsert;

export type CandidateList = typeof candidateLists.$inferSelect;
export type InsertCandidateList = typeof candidateLists.$inferInsert;

export type ListMember = typeof listMembers.$inferSelect;
export type InsertListMember = typeof listMembers.$inferInsert;

export type EngagementAlert = typeof engagementAlerts.$inferSelect;
export type InsertEngagementAlert = typeof engagementAlerts.$inferInsert;

export type EngagementThreshold = typeof engagementThresholds.$inferSelect;
export type InsertEngagementThreshold = typeof engagementThresholds.$inferInsert;

export type CustomTemplate = typeof customTemplates.$inferSelect;
export type InsertCustomTemplate = typeof customTemplates.$inferInsert;

export type TemplateVariable = typeof templateVariables.$inferSelect;
export type InsertTemplateVariable = typeof templateVariables.$inferInsert;

export type DigestDeliveryLog = typeof digestDeliveryLog.$inferSelect;
export type InsertDigestDeliveryLog = typeof digestDeliveryLog.$inferInsert;

export type MatchDigestPreference = typeof matchDigestPreferences.$inferSelect;
export type InsertMatchDigestPreference = typeof matchDigestPreferences.$inferInsert;

export type CandidateNotificationPreferences = typeof candidateNotificationPreferences.$inferSelect;
export type InsertCandidateNotificationPreferences = typeof candidateNotificationPreferences.$inferInsert;

export type NotificationAnalytics = typeof notificationAnalytics.$inferSelect;
export type InsertNotificationAnalytics = typeof notificationAnalytics.$inferInsert;

export type EmployerMatchingPreferences = typeof employerMatchingPreferences.$inferSelect;
export type InsertEmployerMatchingPreferences = typeof employerMatchingPreferences.$inferInsert;

export type CandidateAttribute = typeof candidateAttributes.$inferSelect;
export type InsertCandidateAttribute = typeof candidateAttributes.$inferInsert;

export type JobAttribute = typeof jobAttributes.$inferSelect;
export type InsertJobAttribute = typeof jobAttributes.$inferInsert;

export type MatchHistory = typeof matchHistory.$inferSelect;
export type InsertMatchHistory = typeof matchHistory.$inferInsert;

export type ApplicationNote = typeof applicationNotes.$inferSelect;
export type InsertApplicationNote = typeof applicationNotes.$inferInsert;

export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type InsertResumeTemplate = typeof resumeTemplates.$inferInsert;

export type CandidateResume = typeof candidateResumes.$inferSelect;
export type InsertCandidateResume = typeof candidateResumes.$inferInsert;

export type CareerAssessment = typeof careerAssessments.$inferSelect;
export type InsertCareerAssessment = typeof careerAssessments.$inferInsert;

export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = typeof assessmentResponses.$inferInsert;

// Additional missing type exports
export type ApiCredential = typeof apiCredentials.$inferSelect;
export type InsertApiCredential = typeof apiCredentials.$inferInsert;

export type SyncJob = typeof syncJobs.$inferSelect;
export type InsertSyncJob = typeof syncJobs.$inferInsert;

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = typeof apiLogs.$inferInsert;

export type QiwaCompany = typeof qiwaCompanies.$inferSelect;
export type InsertQiwaCompany = typeof qiwaCompanies.$inferInsert;

export type MhrsdRegulation = typeof mhrsdRegulations.$inferSelect;
export type InsertMhrsdRegulation = typeof mhrsdRegulations.$inferInsert;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = typeof datasets.$inferInsert;

export type TrainingJob = typeof trainingJobs.$inferSelect;
export type InsertTrainingJob = typeof trainingJobs.$inferInsert;

export type ModelInference = typeof modelInferences.$inferSelect;
export type InsertModelInference = typeof modelInferences.$inferInsert;

export type CampaignExecution = typeof campaignExecutions.$inferSelect;
export type InsertCampaignExecution = typeof campaignExecutions.$inferInsert;

export type EmailCampaignVariant = typeof emailCampaignVariants.$inferSelect;
export type InsertEmailCampaignVariant = typeof emailCampaignVariants.$inferInsert;

export type CampaignTrigger = typeof campaignTriggers.$inferSelect;
export type InsertCampaignTrigger = typeof campaignTriggers.$inferInsert;

export type CampaignPerformanceSnapshot = typeof campaignPerformanceSnapshots.$inferSelect;
export type InsertCampaignPerformanceSnapshot = typeof campaignPerformanceSnapshots.$inferInsert;

export type VideoInterview = typeof videoInterviews.$inferSelect;
export type InsertVideoInterview = typeof videoInterviews.$inferInsert;

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = typeof coachingSessions.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;

export type EmployeeSkill = typeof employeeSkills.$inferSelect;
export type InsertEmployeeSkill = typeof employeeSkills.$inferInsert;

export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;

export type AtsIntegration = typeof atsIntegrations.$inferSelect;
export type InsertAtsIntegration = typeof atsIntegrations.$inferInsert;

export type TalentPool = typeof talentPool.$inferSelect;
export type InsertTalentPool = typeof talentPool.$inferInsert;

export type InterviewCalendarInvite = typeof interviewCalendarInvites.$inferSelect;
export type InsertInterviewCalendarInvite = typeof interviewCalendarInvites.$inferInsert;

export type InterviewConflict = typeof interviewConflicts.$inferSelect;
export type InsertInterviewConflict = typeof interviewConflicts.$inferInsert;

export type CandidateAvailability = typeof candidateAvailability.$inferSelect;
export type InsertCandidateAvailability = typeof candidateAvailability.$inferInsert;

export type SchedulingConflictResolution = typeof schedulingConflictResolutions.$inferSelect;
export type InsertSchedulingConflictResolution = typeof schedulingConflictResolutions.$inferInsert;

export type BulkSchedulingOperation = typeof bulkSchedulingOperations.$inferSelect;
export type InsertBulkSchedulingOperation = typeof bulkSchedulingOperations.$inferInsert;

export type CampaignSend = typeof campaignSends.$inferSelect;
export type InsertCampaignSend = typeof campaignSends.$inferInsert;

export type EmailAbTestV2 = typeof emailAbTestsV2.$inferSelect;
export type InsertEmailAbTestV2 = typeof emailAbTestsV2.$inferInsert;

export type AbTestVariantResult = typeof abTestVariantResults.$inferSelect;
export type InsertAbTestVariantResult = typeof abTestVariantResults.$inferInsert;

export type AbTestResultLegacy = typeof abTestResultsLegacy.$inferSelect;
export type InsertAbTestResultLegacy = typeof abTestResultsLegacy.$inferInsert;

export type EmailTemplateV2 = typeof emailTemplatesV2.$inferSelect;
export type InsertEmailTemplateV2 = typeof emailTemplatesV2.$inferInsert;

export type EmailTemplateCategory = typeof emailTemplateCategories.$inferSelect;
export type InsertEmailTemplateCategory = typeof emailTemplateCategories.$inferInsert;

export type EmailTemplateVersion = typeof emailTemplateVersions.$inferSelect;
export type InsertEmailTemplateVersion = typeof emailTemplateVersions.$inferInsert;

export type EmailTemplateLibrary = typeof emailTemplateLibrary.$inferSelect;
export type InsertEmailTemplateLibrary = typeof emailTemplateLibrary.$inferInsert;

export type OptimalSendTime = typeof optimalSendTimes.$inferSelect;
export type InsertOptimalSendTime = typeof optimalSendTimes.$inferInsert;

export type SmsCampaignRecipient = typeof smsCampaignRecipients.$inferSelect;
export type InsertSmsCampaignRecipient = typeof smsCampaignRecipients.$inferInsert;

export type SmsNotificationLog = typeof smsNotificationLog.$inferSelect;
export type InsertSmsNotificationLog = typeof smsNotificationLog.$inferInsert;

export type SmsProviderConfigs = typeof smsProviderConfigs.$inferSelect;
export type InsertSmsProviderConfigs = typeof smsProviderConfigs.$inferInsert;

export type CommunicationEvent = typeof communicationEvents.$inferSelect;
export type InsertCommunicationEvent = typeof communicationEvents.$inferInsert;

export type CommunicationSummary = typeof communicationSummaries.$inferSelect;
export type InsertCommunicationSummary = typeof communicationSummaries.$inferInsert;

export type TestData = typeof testData.$inferSelect;
export type InsertTestData = typeof testData.$inferInsert;

export type TestScenario = typeof testScenarios.$inferSelect;
export type InsertTestScenario = typeof testScenarios.$inferInsert;

export type QiwaWorkPermit = typeof qiwaWorkPermits.$inferSelect;
export type InsertQiwaWorkPermit = typeof qiwaWorkPermits.$inferInsert;

export type MhrsdReport = typeof mhrsdReports.$inferSelect;
export type InsertMhrsdReport = typeof mhrsdReports.$inferInsert;

export type GovernmentSyncLog = typeof governmentSyncLog.$inferSelect;
export type InsertGovernmentSyncLog = typeof governmentSyncLog.$inferInsert;

export type LaborLawCompliance = typeof laborLawCompliance.$inferSelect;
export type InsertLaborLawCompliance = typeof laborLawCompliance.$inferInsert;

export type WorkforceHistory = typeof workforceHistory.$inferSelect;
export type InsertWorkforceHistory = typeof workforceHistory.$inferInsert;

export type WorkforcePlanningScenario = typeof workforcePlanningScenarios.$inferSelect;
export type InsertWorkforcePlanningScenario = typeof workforcePlanningScenarios.$inferInsert;

export type CandidateNationality = typeof candidateNationality.$inferSelect;
export type InsertCandidateNationality = typeof candidateNationality.$inferInsert;

export type CandidateEngagementScore = typeof candidateEngagementScores.$inferSelect;
export type InsertCandidateEngagementScore = typeof candidateEngagementScores.$inferInsert;

export type CandidateValueScore = typeof candidateValueScores.$inferSelect;
export type InsertCandidateValueScore = typeof candidateValueScores.$inferInsert;

export type CandidatePreferences = typeof candidatePreferences.$inferSelect;
export type InsertCandidatePreferences = typeof candidatePreferences.$inferInsert;

export type CandidateCareerGoal = typeof candidateCareerGoals.$inferSelect;
export type InsertCandidateCareerGoal = typeof candidateCareerGoals.$inferInsert;

export type EnrichmentMetric = typeof enrichmentMetrics.$inferSelect;
export type InsertEnrichmentMetric = typeof enrichmentMetrics.$inferInsert;

export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;
export type InsertDailyAnalytics = typeof dailyAnalytics.$inferInsert;

export type PredictiveInsight = typeof predictiveInsights.$inferSelect;
export type InsertPredictiveInsight = typeof predictiveInsights.$inferInsert;

export type RetentionMetric = typeof retentionMetrics.$inferSelect;
export type InsertRetentionMetric = typeof retentionMetrics.$inferInsert;

export type StrategicRoi = typeof strategicRoi.$inferSelect;
export type InsertStrategicRoi = typeof strategicRoi.$inferInsert;

export type CompetitiveMetric = typeof competitiveMetrics.$inferSelect;
export type InsertCompetitiveMetric = typeof competitiveMetrics.$inferInsert;

export type TeamMetric = typeof teamMetrics.$inferSelect;
export type InsertTeamMetric = typeof teamMetrics.$inferInsert;

export type EmployeeSurvey = typeof employeeSurveys.$inferSelect;
export type InsertEmployeeSurvey = typeof employeeSurveys.$inferInsert;

export type SkillGapAnalysis = typeof skillGapAnalysis.$inferSelect;
export type InsertSkillGapAnalysis = typeof skillGapAnalysis.$inferInsert;

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = typeof skillAssessments.$inferInsert;

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

export type ProgramEnrollment = typeof programEnrollments.$inferSelect;
export type InsertProgramEnrollment = typeof programEnrollments.$inferInsert;

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export type ProgramReview = typeof programReviews.$inferSelect;
export type InsertProgramReview = typeof programReviews.$inferInsert;

export type CareerPath = typeof careerPaths.$inferSelect;
export type InsertCareerPath = typeof careerPaths.$inferInsert;

export type KsaCoachingSession = typeof ksaCoachingSessions.$inferSelect;
export type InsertKsaCoachingSession = typeof ksaCoachingSessions.$inferInsert;

export type KsaMarketData = typeof ksaMarketData.$inferSelect;
export type InsertKsaMarketData = typeof ksaMarketData.$inferInsert;

export type MudadContract = typeof mudadContracts.$inferSelect;
export type InsertMudadContract = typeof mudadContracts.$inferInsert;

export type ExternalJob = typeof externalJobs.$inferSelect;
export type InsertExternalJob = typeof externalJobs.$inferInsert;

export type CompanyInsight = typeof companyInsights.$inferSelect;
export type InsertCompanyInsight = typeof companyInsights.$inferInsert;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;

export type QuietHoursSchedule = typeof quietHoursSchedule.$inferSelect;
export type InsertQuietHoursSchedule = typeof quietHoursSchedule.$inferInsert;

export type EngagementAlertV2 = typeof engagementAlertsV2.$inferSelect;
export type InsertEngagementAlertV2 = typeof engagementAlertsV2.$inferInsert;

export type EngagementAlertConfig = typeof engagementAlertConfigs.$inferSelect;
export type InsertEngagementAlertConfig = typeof engagementAlertConfigs.$inferInsert;

export type SavedJobNew = typeof savedJobsNew.$inferSelect;
export type InsertSavedJobNew = typeof savedJobsNew.$inferInsert;

// ============================================================================
// REAL-TIME MATCH NOTIFICATIONS
// ============================================================================

// Match Notification Events - Real-time notifications for high-quality matches
export const matchNotificationEvents = mysqlTable("matchNotificationEvents", {
	id: int().autoincrement().notNull(),
	matchId: int(), // Reference to match result (if stored)
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	recruiterId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	matchScore: int().notNull(), // 0-100
	matchType: mysqlEnum(['candidate_to_job', 'job_to_candidate', 'mutual']).notNull(),
	notificationSent: tinyint().default(0),
	notificationSentAt: timestamp({ mode: 'string' }),
	acknowledged: tinyint().default(0),
	acknowledgedAt: timestamp({ mode: 'string' }),
	actionTaken: mysqlEnum(['viewed', 'contacted', 'scheduled', 'dismissed', 'none']).default('none'),
	actionTakenAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("recruiterId_idx").on(table.recruiterId),
	index("matchScore_idx").on(table.matchScore),
	index("notificationSent_idx").on(table.notificationSent),
	index("acknowledged_idx").on(table.acknowledged),
	index("createdAt_idx").on(table.createdAt),
]);

// ============================================================================
// BULK MATCHING OPERATIONS
// ============================================================================

// Bulk Match Jobs - Batch processing jobs for AI matching
export const bulkMatchJobs = mysqlTable("bulkMatchJobs", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	jobName: varchar({ length: 255 }).notNull(),
	matchType: mysqlEnum(['candidates_to_job', 'jobs_to_candidate', 'all_to_all']).notNull(),
	sourceType: mysqlEnum(['file_upload', 'database_selection', 'api']).notNull(),
	sourceData: json(), // Configuration for source (file paths, IDs, filters)
	totalItems: int().default(0),
	processedItems: int().default(0),
	successfulMatches: int().default(0),
	failedItems: int().default(0),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending').notNull(),
	progress: int().default(0), // 0-100 percentage
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	resultsSummary: json(), // Summary statistics
	resultsFileUrl: varchar({ length: 1000 }), // S3 URL for results export
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
]);

// Bulk Match Results - Individual match results from bulk operations
export const bulkMatchResults = mysqlTable("bulkMatchResults", {
	id: int().autoincrement().notNull(),
	jobId: int().notNull().references(() => bulkMatchJobs.id, { onDelete: "cascade" }),
	candidateId: int().references(() => candidates.id, { onDelete: "set null" }),
	jobPostingId: int().references(() => jobs.id, { onDelete: "set null" }),
	matchScore: int(), // 0-100
	skillMatchScore: int(),
	cultureFitScore: int(),
	wellbeingMatchScore: int(),
	matchBreakdown: json(), // Detailed breakdown
	matchExplanation: text(), // AI-generated explanation
	status: mysqlEnum(['pending', 'completed', 'failed']).default('pending').notNull(),
	errorMessage: text(),
	processedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("jobId_idx").on(table.jobId),
	index("candidateId_idx").on(table.candidateId),
	index("jobPostingId_idx").on(table.jobPostingId),
	index("matchScore_idx").on(table.matchScore),
]);

// ============================================================================
// MATCH OUTCOME FEEDBACK LOOP
// ============================================================================

// Match Feedback - Post-hire feedback for continuous AI improvement
export const matchFeedback = mysqlTable("matchFeedback", {
	id: int().autoincrement().notNull(),
	matchId: int(), // Reference to original match
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	applicationId: int().references(() => applications.id, { onDelete: "set null" }),
	recruiterId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	
	// Original match scores
	originalMatchScore: int(),
	originalSkillScore: int(),
	originalCultureScore: int(),
	originalWellbeingScore: int(),
	
	// Outcome data
	wasHired: tinyint().notNull(),
	hiredDate: timestamp({ mode: 'string' }),
	matchSuccessful: tinyint(), // 1=successful, 0=unsuccessful, null=too early to tell
	
	// Feedback ratings (1-5 scale)
	skillMatchAccuracy: int(), // How accurate was the skill match?
	cultureFitAccuracy: int(), // How accurate was the culture fit?
	wellbeingMatchAccuracy: int(), // How accurate was the wellbeing match?
	overallSatisfaction: int(), // Overall satisfaction with the match
	
	// Qualitative feedback
	whatWorkedWell: text(),
	whatDidntWork: text(),
	unexpectedFactors: text(),
	improvementSuggestions: text(),
	
	// Performance data (if available)
	employeePerformanceRating: int(), // 1-5 scale
	retentionMonths: int(), // How long did they stay?
	stillEmployed: tinyint().default(1),
	
	// Feedback metadata
	feedbackStage: mysqlEnum(['30_days', '90_days', '6_months', '1_year', 'exit']).notNull(),
	feedbackSource: mysqlEnum(['recruiter', 'hiring_manager', 'hr', 'automated']).default('recruiter').notNull(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
	index("recruiterId_idx").on(table.recruiterId),
	index("wasHired_idx").on(table.wasHired),
	index("matchSuccessful_idx").on(table.matchSuccessful),
	index("feedbackStage_idx").on(table.feedbackStage),
	index("createdAt_idx").on(table.createdAt),
]);

// Feedback Analytics - Aggregated insights from match feedback
export const feedbackAnalytics = mysqlTable("feedbackAnalytics", {
	id: int().autoincrement().notNull(),
	analysisDate: timestamp({ mode: 'string' }).notNull(),
	totalFeedbackCount: int().default(0),
	
	// Accuracy metrics
	avgSkillMatchAccuracy: int(), // Average * 100 (e.g., 425 = 4.25/5)
	avgCultureFitAccuracy: int(),
	avgWellbeingMatchAccuracy: int(),
	avgOverallSatisfaction: int(),
	
	// Success rates
	hireRate: int(), // Percentage * 100
	successRate: int(), // Of hires, how many were successful?
	retentionRate: int(), // Still employed after 6+ months
	
	// Score calibration insights
	scoreCalibrationData: json(), // Data for model retraining
	recommendedAdjustments: json(), // Suggested weight adjustments
	
	// Trend data
	improvementTrend: mysqlEnum(['improving', 'stable', 'declining']),
	keyInsights: text(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("analysisDate_idx").on(table.analysisDate),
]);

// Feedback Reminders - Automated reminders to collect match success data
export const feedbackReminders = mysqlTable("feedbackReminders", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull().references(() => applications.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	reminderType: mysqlEnum(['30_day', '90_day', '180_day']).notNull(),
	scheduledFor: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['scheduled', 'sent', 'failed', 'cancelled']).default('scheduled').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	attempts: int().default(0),
	lastError: text(),
	feedbackSubmittedAt: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("applicationId_idx").on(table.applicationId),
	index("scheduledFor_idx").on(table.scheduledFor),
	index("status_idx").on(table.status),
]);

export type FeedbackReminder = typeof feedbackReminders.$inferSelect;
export type InsertFeedbackReminder = typeof feedbackReminders.$inferInsert;

// Type exports
export type MatchNotificationEvent = typeof matchNotificationEvents.$inferSelect;
export type InsertMatchNotificationEvent = typeof matchNotificationEvents.$inferInsert;

export type BulkMatchJob = typeof bulkMatchJobs.$inferSelect;
export type InsertBulkMatchJob = typeof bulkMatchJobs.$inferInsert;

export type BulkMatchResult = typeof bulkMatchResults.$inferSelect;
export type InsertBulkMatchResult = typeof bulkMatchResults.$inferInsert;

export type MatchFeedback = typeof matchFeedback.$inferSelect;
export type InsertMatchFeedback = typeof matchFeedback.$inferInsert;

export type FeedbackAnalytics = typeof feedbackAnalytics.$inferSelect;
export type InsertFeedbackAnalytics = typeof feedbackAnalytics.$inferInsert;

// ============================================================================
// PHASE 26: FINANCIAL MONITORING & OPERATIONAL INTEGRITY
// ============================================================================

// SMS Cost Tracking - Monitor Twilio SMS costs and usage
export const smsLogs = mysqlTable("smsLogs", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	candidateId: int().references(() => candidates.id, { onDelete: "set null" }),
	phoneNumber: varchar({ length: 50 }).notNull(),
	message: text().notNull(),
	provider: mysqlEnum(['twilio','aws_sns','custom']).default('twilio').notNull(),
	messageId: varchar({ length: 255 }),
	status: mysqlEnum(['pending','queued','sent','delivered','failed','undelivered']).default('pending').notNull(),
	deliveredAt: timestamp({ mode: 'string' }),
	failedAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	cost: bigint({ mode: "number" }).default(0), // Cost in cents
	segments: int().default(1), // Number of SMS segments
	direction: mysqlEnum(['outbound','inbound']).default('outbound').notNull(),
	purpose: mysqlEnum(['interview_reminder','status_update','notification','marketing','verification','other']).default('other').notNull(),
	campaignId: int(),
	metadata: json(), // Additional context
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("candidateId_idx").on(table.candidateId),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
	index("provider_idx").on(table.provider),
	index("purpose_idx").on(table.purpose),
]);

// Job Execution History - Track automated job runs and performance
export const jobExecutions = mysqlTable("jobExecutions", {
	id: int().autoincrement().notNull(),
	jobName: varchar({ length: 255 }).notNull(),
	jobType: mysqlEnum(['scheduled','manual','triggered','webhook']).notNull(),
	status: mysqlEnum(['pending','running','completed','failed','cancelled','timeout']).default('pending').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	duration: int(), // Duration in milliseconds
	triggeredBy: int().references(() => users.id, { onDelete: "set null" }),
	triggerType: mysqlEnum(['cron','manual','api','event']).default('cron').notNull(),
	successCount: int().default(0),
	failureCount: int().default(0),
	skippedCount: int().default(0),
	processedRecords: int().default(0),
	errorMessage: text(),
	stackTrace: text(),
	logOutput: text(),
	retryCount: int().default(0),
	maxRetries: int().default(3),
	nextRetryAt: timestamp({ mode: 'string' }),
	metadata: json(), // Job-specific data
	performanceMetrics: json(), // Memory, CPU, etc.
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("jobName_idx").on(table.jobName),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
	index("triggeredBy_idx").on(table.triggeredBy),
	index("jobType_idx").on(table.jobType),
	]);

// Budget Scenarios - What-if analysis for campaign budgets
export const budgetScenarios = mysqlTable("budgetScenarios", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdBy: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	totalCost: int().default(0).notNull(),
	totalRecipients: int().default(0).notNull(),
	expectedConversions: int().default(0).notNull(),
	costPerConversion: int().default(0).notNull(),
	roi: int().default(0).notNull(), // Return on investment percentage
	timeline: json(), // Daily cost timeline
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("createdBy_idx").on(table.createdBy),
	index("createdAt_idx").on(table.createdAt),
]);

// Scenario Campaigns - Campaign inputs for scenarios
export const scenarioCampaigns = mysqlTable("scenarioCampaigns", {
	id: int().autoincrement().notNull(),
	scenarioId: int().notNull().references(() => budgetScenarios.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }).notNull(),
	estimatedRecipients: int().notNull(),
	costPerRecipient: int().notNull(),
	expectedResponseRate: int().default(5).notNull(), // Percentage * 100
	expectedConversionRate: int().default(20).notNull(), // Percentage * 100
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("scenarioId_idx").on(table.scenarioId),
]);

// Job Failure Alerts - Alert rules and configuration
export const jobFailureAlerts = mysqlTable("jobFailureAlerts", {
	id: int().autoincrement().notNull(),
	jobName: varchar({ length: 255 }).notNull(),
	enabled: tinyint().default(1).notNull(),
	failureThreshold: int().default(3).notNull(), // Consecutive failures before alert
	alertCooldown: int().default(30).notNull(), // Minutes between alerts
	retryEnabled: tinyint().default(1).notNull(),
	maxRetries: int().default(3).notNull(),
	retryBackoffMultiplier: int().default(2).notNull(),
	escalationEnabled: tinyint().default(0).notNull(),
	escalationThreshold: int().default(5).notNull(),
	lastAlertAt: timestamp({ mode: 'string' }),
	totalAlerts: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("jobName_idx").on(table.jobName),
	index("enabled_idx").on(table.enabled),
]);

// Job Retry Attempts - Track retry execution history
export const jobRetryAttempts = mysqlTable("jobRetryAttempts", {
	id: int().autoincrement().notNull(),
	jobExecutionId: int().notNull().references(() => jobExecutions.id, { onDelete: "cascade" }),
	attemptNumber: int().notNull(),
	status: mysqlEnum(['pending','running','completed','failed']).default('pending').notNull(),
	scheduledAt: timestamp({ mode: 'string' }).notNull(),
	executedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("jobExecutionId_idx").on(table.jobExecutionId),
	index("status_idx").on(table.status),
	index("scheduledAt_idx").on(table.scheduledAt),
]);

	// Export History - Audit trail for data exports
	export const exportHistory = mysqlTable("exportHistory", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	exportType: mysqlEnum(['csv','pdf','excel','json']).notNull(),
	dataType: mysqlEnum(['candidates','interviews','feedback','analytics','campaigns','jobs','applications','other']).notNull(),
	fileName: varchar({ length: 500 }).notNull(),
	fileUrl: text(),
	fileKey: text(), // S3 key
	fileSize: bigint({ mode: "number" }), // Size in bytes
	recordCount: int().default(0),
	filters: json(), // Applied filters
	columns: json(), // Exported columns
	status: mysqlEnum(['pending','processing','completed','failed','expired']).default('pending').notNull(),
	downloadCount: int().default(0),
	lastDownloadedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }), // Auto-delete after 7 days
	processingTime: int(), // Time in milliseconds
	errorMessage: text(),
	ipAddress: varchar({ length: 50 }),
	userAgent: text(),
	metadata: json(), // Additional context
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("exportType_idx").on(table.exportType),
	index("dataType_idx").on(table.dataType),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
	index("expiresAt_idx").on(table.expiresAt),
]);

// Type exports for Phase 26 tables
export type SmsLog = typeof smsLogs.$inferSelect;
export type InsertSmsLog = typeof smsLogs.$inferInsert;

export type JobExecution = typeof jobExecutions.$inferSelect;
export type InsertJobExecution = typeof jobExecutions.$inferInsert;

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;


// ==========================================
// PHASE 17: STRATEGIC ENHANCEMENTS SCHEMA
// ==========================================

// Budget Thresholds - Configurable SMS cost limits
export const budgetThresholds = mysqlTable("budgetThresholds", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(), // e.g., "Monthly SMS Budget", "Campaign Budget"
	thresholdType: mysqlEnum(['monthly','weekly','daily','per_campaign','total']).default('monthly').notNull(),
	thresholdAmount: int().notNull(), // Amount in smallest currency unit (e.g., cents)
	currency: varchar({ length: 3 }).default('SAR').notNull(),
	warningPercentage: int().default(80), // Alert at 80% of threshold
	criticalPercentage: int().default(95), // Critical alert at 95%
	alertChannels: json(), // ['email', 'push', 'sms']
	alertRecipients: json(), // Array of user IDs or email addresses
	isActive: tinyint().default(1).notNull(),
	createdBy: int().references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("thresholdType_idx").on(table.thresholdType),
	index("isActive_idx").on(table.isActive),
]);

// Budget Alerts - Triggered alerts when thresholds are exceeded
export const budgetAlerts = mysqlTable("budgetAlerts", {
	id: int().autoincrement().notNull(),
	thresholdId: int().notNull().references(() => budgetThresholds.id, { onDelete: "cascade" }),
	alertLevel: mysqlEnum(['warning','critical','exceeded']).notNull(),
	currentSpending: int().notNull(), // Current spending amount
	thresholdAmount: int().notNull(), // Threshold that was crossed
	percentageUsed: int().notNull(), // Percentage of threshold used
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	smsCount: int().default(0), // Number of SMS sent in period
	message: text(),
	notificationsSent: json(), // Array of notification delivery records
	acknowledged: tinyint().default(0),
	acknowledgedBy: int().references(() => users.id, { onDelete: "set null" }),
	acknowledgedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("thresholdId_idx").on(table.thresholdId),
	index("alertLevel_idx").on(table.alertLevel),
	index("acknowledged_idx").on(table.acknowledged),
	index("createdAt_idx").on(table.createdAt),
]);

// Scheduled Exports - Recurring automated report exports
export const scheduledExports = mysqlTable("scheduledExports", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(), // e.g., "Weekly Candidate Report"
	description: text(),
	exportTemplate: mysqlEnum(['candidates','interviews','feedback','analytics','campaigns','jobs','applications','custom']).notNull(),
	exportFormat: mysqlEnum(['csv','pdf','excel']).default('csv').notNull(),
	schedule: mysqlEnum(['daily','weekly','monthly','custom']).default('weekly').notNull(),
	cronExpression: varchar({ length: 100 }), // For custom schedules (e.g., "0 9 * * 1" for Monday 9am)
	timezone: varchar({ length: 50 }).default('Asia/Riyadh'),
	filters: json(), // Applied filters for data export
	columns: json(), // Columns to include in export
	emailRecipients: json(), // Array of email addresses
	emailSubject: varchar({ length: 500 }),
	emailBody: text(),
	includeAttachment: tinyint().default(1).notNull(),
	lastRunAt: timestamp({ mode: 'string' }),
	nextRunAt: timestamp({ mode: 'string' }),
	lastRunStatus: mysqlEnum(['success','failed','skipped']),
	lastRunError: text(),
	runCount: int().default(0),
	successCount: int().default(0),
	failureCount: int().default(0),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("schedule_idx").on(table.schedule),
	index("isActive_idx").on(table.isActive),
	index("nextRunAt_idx").on(table.nextRunAt),
	index("createdBy_idx").on(table.createdBy),
]);

// Scheduled Export Runs - History of scheduled export executions
export const scheduledExportRuns = mysqlTable("scheduledExportRuns", {
	id: int().autoincrement().notNull(),
	scheduledExportId: int().notNull().references(() => scheduledExports.id, { onDelete: "cascade" }),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	processingTime: int(), // Milliseconds
	recordCount: int().default(0),
	fileUrl: text(),
	fileKey: text(), // S3 key
	fileSize: bigint({ mode: "number" }),
	emailsSent: int().default(0),
	emailDeliveryStatus: json(), // Array of delivery statuses per recipient
	errorMessage: text(),
	stackTrace: text(),
	triggeredBy: mysqlEnum(['schedule','manual']).default('schedule').notNull(),
	triggeredByUserId: int().references(() => users.id, { onDelete: "set null" }),
	metadata: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("scheduledExportId_idx").on(table.scheduledExportId),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
	index("triggeredBy_idx").on(table.triggeredBy),
]);

// Type exports for Phase 17 tables
export type BudgetThreshold = typeof budgetThresholds.$inferSelect;
export type InsertBudgetThreshold = typeof budgetThresholds.$inferInsert;

export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = typeof budgetAlerts.$inferInsert;

export type ScheduledExport = typeof scheduledExports.$inferSelect;
export type InsertScheduledExport = typeof scheduledExports.$inferInsert;

export type ScheduledExportRun = typeof scheduledExportRuns.$inferSelect;
export type InsertScheduledExportRun = typeof scheduledExportRuns.$inferInsert;


// ============================================
// VISA COMPLIANCE TRACKING TABLES (Phase 17)
// ============================================

export const employees = mysqlTable("employees", {
  id: int().autoincrement().notNull(),
  employerId: int("employer_id").notNull().references(() => employers.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar({ length: 320 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  nationality: varchar({ length: 100 }),
  jobTitle: varchar("job_title", { length: 255 }),
  department: varchar({ length: 255 }),
  employmentStatus: mysqlEnum("employment_status", ['active', 'on_leave', 'terminated', 'suspended']).default('active').notNull(),
  hireDate: timestamp("hire_date", { mode: 'string' }),
  terminationDate: timestamp("termination_date", { mode: 'string' }),
  isSaudiNational: tinyint("is_saudi_national").default(0),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("employerId_idx").on(table.employerId),
  index("employmentStatus_idx").on(table.employmentStatus),
  index("nationality_idx").on(table.nationality),
]);

export const visaCompliance = mysqlTable("visa_compliance", {
  id: int().autoincrement().notNull(),
  employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  documentType: mysqlEnum("document_type", ['visa', 'work_permit', 'iqama', 'passport']).notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  issueDate: timestamp("issue_date", { mode: 'string' }),
  expiryDate: timestamp("expiry_date", { mode: 'string' }).notNull(),
  status: mysqlEnum(['valid', 'expiring_soon', 'expired', 'pending_renewal']).default('valid').notNull(),
  daysUntilExpiry: int("days_until_expiry"),
  reminderSent: tinyint("reminder_sent").default(0),
  lastReminderDate: timestamp("last_reminder_date", { mode: 'string' }),
  renewalStatus: mysqlEnum("renewal_status", ['not_started', 'in_progress', 'completed', 'rejected']),
  notes: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("employeeId_idx").on(table.employeeId),
  index("status_idx").on(table.status),
  index("expiryDate_idx").on(table.expiryDate),
]);

export const visaComplianceAlerts = mysqlTable("visa_compliance_alerts", {
  id: int().autoincrement().notNull(),
  visaComplianceId: int("visa_compliance_id").notNull().references(() => visaCompliance.id, { onDelete: "cascade" }),
  alertType: mysqlEnum("alert_type", ['expiring_30_days', 'expiring_15_days', 'expiring_7_days', 'expired', 'renewal_overdue']).notNull(),
  severity: mysqlEnum(['info', 'warning', 'critical']).default('warning').notNull(),
  message: text().notNull(),
  acknowledged: tinyint().default(0),
  acknowledgedBy: int("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
  dismissed: tinyint().default(0),
  dismissedBy: int("dismissed_by").references(() => users.id, { onDelete: "set null" }),
  dismissedAt: timestamp("dismissed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
  index("visaComplianceId_idx").on(table.visaComplianceId),
  index("severity_idx").on(table.severity),
  index("acknowledged_idx").on(table.acknowledged),
]);

export const whatsappSettings = mysqlTable("whatsapp_settings", {
  id: int().autoincrement().notNull(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  countryCode: varchar("country_code", { length: 5 }).default('+966'),
  enableDailySummary: tinyint("enable_daily_summary").default(1),
  enableCriticalAlerts: tinyint("enable_critical_alerts").default(1),
  enableWeeklyReports: tinyint("enable_weekly_reports").default(0),
  dailySummaryTime: varchar("daily_summary_time", { length: 5 }).default('09:00'),
  weeklyReportDay: mysqlEnum("weekly_report_day", ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).default('monday'),
  isActive: tinyint("is_active").default(1),
  lastTestMessageSent: timestamp("last_test_message_sent", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("userId_idx").on(table.userId),
]);

export const whatsappNotificationLogs = mysqlTable("whatsapp_notification_logs", {
  id: int().autoincrement().notNull(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  messageType: mysqlEnum("message_type", ['daily_summary', 'critical_alert', 'weekly_report', 'test_message', 'compliance_reminder']).notNull(),
  messageContent: text().notNull(),
  status: mysqlEnum(['pending', 'sent', 'failed', 'delivered']).default('pending').notNull(),
  twilioMessageSid: varchar("twilio_message_sid", { length: 100 }),
  errorMessage: text(),
  sentAt: timestamp("sent_at", { mode: 'string' }),
  deliveredAt: timestamp("delivered_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
  index("userId_idx").on(table.userId),
  index("status_idx").on(table.status),
  index("messageType_idx").on(table.messageType),
]);

export type VisaCompliance = typeof visaCompliance.$inferSelect;
export type InsertVisaCompliance = typeof visaCompliance.$inferInsert;
export type VisaComplianceAlert = typeof visaComplianceAlerts.$inferSelect;
export type InsertVisaComplianceAlert = typeof visaComplianceAlerts.$inferInsert;
export type WhatsappSettings = typeof whatsappSettings.$inferSelect;
export type InsertWhatsappSettings = typeof whatsappSettings.$inferInsert;
export type WhatsappNotificationLog = typeof whatsappNotificationLogs.$inferSelect;
export type InsertWhatsappNotificationLog = typeof whatsappNotificationLogs.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ===== Import History & Management =====

export const importHistory = mysqlTable("import_history", {
  id: int().autoincrement().notNull(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  importType: mysqlEnum("import_type", ['candidates', 'jobs', 'employees', 'compliance_data', 'feedback', 'other']).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileSize: int("file_size"), // in bytes
  recordsTotal: int("records_total").default(0),
  recordsSuccess: int("records_success").default(0),
  recordsError: int("records_error").default(0),
  status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'rolled_back']).default('pending').notNull(),
  errorLog: json("error_log"), // Array of error messages with row numbers
  importData: json("import_data"), // Store imported data for rollback capability
  rolledBackAt: timestamp("rolled_back_at", { mode: 'string' }),
  rolledBackBy: int("rolled_back_by").references(() => users.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at", { mode: 'string' }),
  completedAt: timestamp("completed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("userId_idx").on(table.userId),
  index("importType_idx").on(table.importType),
  index("status_idx").on(table.status),
  index("createdAt_idx").on(table.createdAt),
]);

// ===== Scheduled Reports =====

export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int().autoincrement().notNull(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportName: varchar("report_name", { length: 255 }).notNull(),
  reportType: mysqlEnum("report_type", [
    'compliance_summary',
    'analytics_dashboard',
    'ksa_labor_law',
    'nitaqat_status',
    'candidate_pipeline',
    'interview_feedback',
    'engagement_metrics',
    'custom'
  ]).notNull(),
  schedule: mysqlEnum(['daily', 'weekly', 'monthly', 'quarterly']).notNull(),
  scheduleDay: int("schedule_day"), // Day of week (1-7) for weekly, day of month (1-31) for monthly
  scheduleTime: varchar("schedule_time", { length: 5 }).default('09:00'), // HH:MM format
  recipients: json(), // Array of email addresses
  reportConfig: json("report_config"), // Custom configuration for report generation
  isActive: tinyint("is_active").default(1).notNull(),
  lastRunAt: timestamp("last_run_at", { mode: 'string' }),
  nextRunAt: timestamp("next_run_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("userId_idx").on(table.userId),
  index("reportType_idx").on(table.reportType),
  index("isActive_idx").on(table.isActive),
  index("nextRunAt_idx").on(table.nextRunAt),
]);

export const reportDeliveryLogs = mysqlTable("report_delivery_logs", {
  id: int().autoincrement().notNull(),
  scheduledReportId: int("scheduled_report_id").notNull().references(() => scheduledReports.id, { onDelete: "cascade" }),
  reportPeriodStart: timestamp("report_period_start", { mode: 'string' }),
  reportPeriodEnd: timestamp("report_period_end", { mode: 'string' }),
  recipients: json(), // Array of email addresses
  deliveryStatus: mysqlEnum("delivery_status", ['pending', 'sent', 'failed']).default('pending').notNull(),
  reportFileUrl: varchar("report_file_url", { length: 500 }), // S3 URL for generated report
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
  index("scheduledReportId_idx").on(table.scheduledReportId),
  index("deliveryStatus_idx").on(table.deliveryStatus),
  index("createdAt_idx").on(table.createdAt),
]);

// ===== Compliance Audit Trail =====

export const complianceAuditLog = mysqlTable("compliance_audit_log", {
  id: int().autoincrement().notNull(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityType: mysqlEnum("entity_type", [
    'employee',
    'visa_compliance',
    'nitaqat_status',
    'work_permit',
    'labor_law_config',
    'compliance_alert',
    'scheduled_report',
    'import_history',
    'other'
  ]).notNull(),
  entityId: int("entity_id"), // ID of the affected record
  action: mysqlEnum(['create', 'update', 'delete', 'rollback', 'approve', 'reject']).notNull(),
  fieldChanged: varchar("field_changed", { length: 255 }), // Specific field that was modified
  valueBefore: text("value_before"), // JSON string of previous value
  valueAfter: text("value_after"), // JSON string of new value
  changeReason: text("change_reason"), // Optional reason for the change
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
  index("userId_idx").on(table.userId),
  index("entityType_idx").on(table.entityType),
  index("entityId_idx").on(table.entityId),
  index("action_idx").on(table.action),
  index("createdAt_idx").on(table.createdAt),
]);

// ============================================================================
// PHASE 27: COMPARISON VIEW & MATCH MANAGEMENT ENHANCEMENTS
// ============================================================================

// Match Notification Preferences - Per-job notification settings for recruiters
export const matchNotificationPreferences = mysqlTable("matchNotificationPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	jobId: int().references(() => jobs.id, { onDelete: "cascade" }), // null = global default
	// Threshold settings
	minMatchScore: int().default(70).notNull(), // Minimum score to trigger notification
	highScoreThreshold: int().default(85).notNull(), // "High quality" match threshold
	exceptionalScoreThreshold: int().default(90).notNull(), // "Exceptional" match threshold
	// Channel preferences
	notifyViaEmail: tinyint().default(1).notNull(),
	notifyViaPush: tinyint().default(1).notNull(),
	notifyViaSms: tinyint().default(0).notNull(),
	// Frequency controls
	instantNotifications: tinyint().default(1).notNull(), // Send immediately
	digestMode: tinyint().default(0).notNull(), // Batch into digest
	digestFrequency: mysqlEnum(['hourly', 'daily', 'weekly']).default('daily'),
	// Filters
	notifyOnlyNewCandidates: tinyint().default(0).notNull(),
	notifyOnScoreImprovement: tinyint().default(1).notNull(),
	minScoreImprovement: int().default(5), // Minimum score increase to notify
	// Quiet hours
	quietHoursEnabled: tinyint().default(0).notNull(),
	quietHoursStart: varchar({ length: 10 }).default('22:00'),
	quietHoursEnd: varchar({ length: 10 }).default('08:00'),
	timezone: varchar({ length: 100 }).default('Asia/Riyadh'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("jobId_idx").on(table.jobId),
]);

// Match Timeline Events - Track the lifecycle of match evaluations
export const matchTimelineEvents = mysqlTable("matchTimelineEvents", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	jobId: int().notNull().references(() => jobs.id, { onDelete: "cascade" }),
	userId: int().references(() => users.id, { onDelete: "set null" }), // Who performed the action
	eventType: mysqlEnum([
		'match_created',
		'match_viewed',
		'match_compared',
		'match_favorited',
		'match_unfavorited',
		'interview_scheduled',
		'message_sent',
		'status_changed',
		'feedback_submitted',
		'match_dismissed',
		'match_archived'
	]).notNull(),
	eventDescription: text(),
	metadata: json(), // Additional context (e.g., comparison group, message content, status change)
	matchScore: int(), // Score at time of event
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("jobId_idx").on(table.jobId),
	index("userId_idx").on(table.userId),
	index("eventType_idx").on(table.eventType),
	index("createdAt_idx").on(table.createdAt),
]);

// Bulk Comparison Actions - Track bulk operations from comparison view
export const bulkComparisonActions = mysqlTable("bulkComparisonActions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	jobId: int().references(() => jobs.id, { onDelete: "set null" }),
	actionType: mysqlEnum([
		'bulk_schedule_interviews',
		'bulk_send_messages',
		'bulk_change_status',
		'bulk_add_to_pipeline',
		'bulk_export'
	]).notNull(),
	candidateIds: json().notNull(), // Array of candidate IDs
	totalCandidates: int().notNull(),
	successfulActions: int().default(0).notNull(),
	failedActions: int().default(0).notNull(),
	// Action-specific data
	interviewTemplateId: int().references(() => feedbackTemplates.id, { onDelete: "set null" }),
	scheduledDateTime: timestamp({ mode: 'string' }),
	messageContent: text(),
	newStatus: varchar({ length: 100 }),
	// Execution tracking
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed', 'partially_completed']).default('pending').notNull(),
	progress: int().default(0), // 0-100 percentage
	errorMessages: json(), // Array of error details
	resultsSummary: json(), // Summary of what was done
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("jobId_idx").on(table.jobId),
	index("actionType_idx").on(table.actionType),
	index("status_idx").on(table.status),
	index("createdAt_idx").on(table.createdAt),
	]);

// Unified Message Template Library - For bulk email/SMS messaging
export const messageTemplates = mysqlTable("messageTemplates", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: mysqlEnum(['interview_invitation', 'status_update', 'follow_up', 'rejection', 'offer', 'reminder', 'general']).notNull(),
	channelType: mysqlEnum(['email', 'sms', 'both']).notNull(), // Which channels this template supports
	// Email content
	emailSubject: varchar({ length: 500 }),
	emailBody: text(),
	emailHtml: text(), // Rich HTML version
	// SMS content
	smsBody: text(),
	// Template variables
	variables: json(), // Array of variable names like ['candidateName', 'jobTitle', 'interviewDate']
	// Usage tracking
	usageCount: int().default(0).notNull(),
	lastUsedAt: timestamp({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	isDefault: tinyint().default(0).notNull(), // System default templates
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("category_idx").on(table.category),
	index("channelType_idx").on(table.channelType),
	index("isActive_idx").on(table.isActive),
]);

// Message Template Usage Log - Track when templates are used
export const messageTemplateUsage = mysqlTable("messageTemplateUsage", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull().references(() => messageTemplates.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	channel: mysqlEnum(['email', 'sms']).notNull(),
	recipientCount: int().notNull(),
	bulkActionId: int().references(() => bulkComparisonActions.id, { onDelete: "set null" }),
	campaignId: int(), // Reference to email or SMS campaign if applicable
	successCount: int().default(0).notNull(),
	failureCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("templateId_idx").on(table.templateId),
	index("userId_idx").on(table.userId),
	index("channel_idx").on(table.channel),
	index("createdAt_idx").on(table.createdAt),
]);

// Enhanced Notification Analytics - Extended metrics for notification performance
export const notificationEngagementMetrics = mysqlTable("notificationEngagementMetrics", {
	id: int().autoincrement().notNull(),
	notificationId: int().notNull().references(() => notificationHistory.id, { onDelete: "cascade" }),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" }),
	// Delivery metrics
	deliveredAt: timestamp({ mode: 'string' }),
	deliveryDuration: int(), // Time from creation to delivery (ms)
	// Engagement metrics
	viewedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	actionTakenAt: timestamp({ mode: 'string' }),
	actionType: varchar({ length: 100 }), // e.g., 'view_candidate', 'schedule_interview'
	dismissedAt: timestamp({ mode: 'string' }),
	// Time-to-action metrics
	timeToView: int(), // Seconds from delivery to view
	timeToClick: int(), // Seconds from delivery to click
	timeToAction: int(), // Seconds from delivery to action
	// Context
	deviceType: varchar({ length: 50 }), // 'mobile', 'desktop', 'tablet'
	browserType: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("notificationId_idx").on(table.notificationId),
	index("userId_idx").on(table.userId),
	index("viewedAt_idx").on(table.viewedAt),
	index("clickedAt_idx").on(table.clickedAt),
	index("actionTakenAt_idx").on(table.actionTakenAt),
]);

// Notification Performance Summary - Aggregated metrics by notification type
export const notificationPerformanceSummary = mysqlTable("notificationPerformanceSummary", {
	id: int().autoincrement().notNull(),
	notificationType: varchar({ length: 100 }).notNull(), // e.g., 'new_candidate', 'interview_response'
	channel: mysqlEnum(['push', 'email', 'sms']).notNull(),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	// Volume metrics
	totalSent: int().default(0).notNull(),
	totalDelivered: int().default(0).notNull(),
	totalViewed: int().default(0).notNull(),
	totalClicked: int().default(0).notNull(),
	totalActioned: int().default(0).notNull(),
	totalDismissed: int().default(0).notNull(),
	// Rate metrics (stored as percentages * 100 for precision)
	deliveryRate: int().default(0).notNull(), // (delivered/sent) * 10000
	viewRate: int().default(0).notNull(), // (viewed/delivered) * 10000
	clickRate: int().default(0).notNull(), // (clicked/delivered) * 10000
	actionRate: int().default(0).notNull(), // (actioned/delivered) * 10000
	// Timing metrics (averages in seconds)
	avgTimeToView: int(),
	avgTimeToClick: int(),
	avgTimeToAction: int(),
	// Effectiveness score (0-100)
	effectivenessScore: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("notificationType_idx").on(table.notificationType),
	index("channel_idx").on(table.channel),
	index("periodStart_idx").on(table.periodStart),
	index("periodEnd_idx").on(table.periodEnd),
]);

// ===== Type Exports =====

export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;
export type ReportDeliveryLog = typeof reportDeliveryLogs.$inferSelect;
export type InsertReportDeliveryLog = typeof reportDeliveryLogs.$inferInsert;
export type ComplianceAuditLog = typeof complianceAuditLog.$inferSelect;
export type InsertComplianceAuditLog = typeof complianceAuditLog.$inferInsert;

export type MatchNotificationPreference = typeof matchNotificationPreferences.$inferSelect;
export type InsertMatchNotificationPreference = typeof matchNotificationPreferences.$inferInsert;
export type MatchTimelineEvent = typeof matchTimelineEvents.$inferSelect;
export type InsertMatchTimelineEvent = typeof matchTimelineEvents.$inferInsert;
export type BulkComparisonAction = typeof bulkComparisonActions.$inferSelect;
export type InsertBulkComparisonAction = typeof bulkComparisonActions.$inferInsert;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
export type MessageTemplateUsage = typeof messageTemplateUsage.$inferSelect;
export type InsertMessageTemplateUsage = typeof messageTemplateUsage.$inferInsert;

export type NotificationEngagementMetric = typeof notificationEngagementMetrics.$inferSelect;
export type InsertNotificationEngagementMetric = typeof notificationEngagementMetrics.$inferInsert;
export type NotificationPerformanceSummary = typeof notificationPerformanceSummary.$inferSelect;
export type InsertNotificationPerformanceSummary = typeof notificationPerformanceSummary.$inferInsert;

// ===== Communication Features: Bulk Broadcast, Email Automation, A/B Testing =====

export const bulkBroadcastCampaigns = mysqlTable("bulk_broadcast_campaigns", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	body: text().notNull(),
	senderName: varchar({ length: 255 }),
	senderEmail: varchar({ length: 320 }),
	segmentType: mysqlEnum(['all', 'filtered', 'custom']).default('all').notNull(),
	segmentFilter: json(), // Store filter criteria as JSON
	status: mysqlEnum(['draft', 'scheduled', 'sending', 'sent', 'failed']).default('draft').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	totalRecipients: int().default(0),
	sentCount: int().default(0),
	deliveredCount: int().default(0),
	openedCount: int().default(0),
	clickedCount: int().default(0),
	failedCount: int().default(0),
	createdBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("status_idx").on(table.status),
	index("createdBy_idx").on(table.createdBy),
]);

export const emailWorkflows = mysqlTable("email_workflows", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	triggerEvent: mysqlEnum(['candidate_applied', 'interview_scheduled', 'interview_completed', 'offer_sent', 'candidate_rejected', 'manual']).notNull(),
	triggerConditions: json(), // Additional conditions for triggering
	emailSubject: varchar({ length: 500 }).notNull(),
	emailBody: text().notNull(),
	delayMinutes: int().default(0).notNull(), // Delay before sending email
	isActive: tinyint().default(1).notNull(),
	createdBy: int().notNull().references(() => users.id),
	executionCount: int().default(0),
	lastExecutedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("triggerEvent_idx").on(table.triggerEvent),
	index("isActive_idx").on(table.isActive),
]);

export const workflowExecutions = mysqlTable("workflow_executions", {
	id: int().autoincrement().notNull(),
	workflowId: int().notNull().references(() => emailWorkflows.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	triggerData: json(), // Context data when workflow was triggered
	status: mysqlEnum(['pending', 'sent', 'failed', 'skipped']).default('pending').notNull(),
	scheduledFor: timestamp({ mode: 'string' }).notNull(),
	executedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	emailDelivered: tinyint().default(0),
	emailOpened: tinyint().default(0),
	emailClicked: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("workflowId_idx").on(table.workflowId),
	index("candidateId_idx").on(table.candidateId),
	index("status_idx").on(table.status),
	index("scheduledFor_idx").on(table.scheduledFor),
]);

export const abTestsNew = mysqlTable("ab_tests_new", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	testType: mysqlEnum(['email_subject', 'email_body', 'send_time', 'sender_name']).notNull(),
	status: mysqlEnum(['draft', 'running', 'completed', 'cancelled']).default('draft').notNull(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	targetAudience: json(), // Segment criteria
	sampleSize: int().notNull(),
	confidenceLevel: int().default(95),
	createdBy: int().notNull().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("status_idx").on(table.status),
	index("createdBy_idx").on(table.createdBy),
]);

export const abTestVariants = mysqlTable("ab_test_variants", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => abTestsNew.id, { onDelete: "cascade" }),
	variantName: varchar({ length: 100 }).notNull(), // e.g., "A", "B", "Control"
	emailSubject: varchar({ length: 500 }),
	emailBody: text(),
	senderName: varchar({ length: 255 }),
	sendTime: varchar({ length: 50 }), // e.g., "09:00", "14:00"
	recipientCount: int().default(0),
	sentCount: int().default(0),
	deliveredCount: int().default(0),
	openedCount: int().default(0),
	clickedCount: int().default(0),
	conversionCount: int().default(0),
	openRate: int().default(0), // Stored as percentage * 100
	clickRate: int().default(0),
	conversionRate: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
]);

export const abTestResults = mysqlTable("ab_test_results", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => abTestsNew.id, { onDelete: "cascade" }),
	winnerVariantId: int().references(() => abTestVariants.id),
	statisticalSignificance: tinyint().default(0), // Boolean: 1 = significant, 0 = not significant
	pValue: int().default(0), // Stored as percentage * 10000 for precision
	confidenceLevel: int().default(95),
	recommendation: text(),
	relativeImprovement: int().default(0), // Percentage * 100
	absoluteImprovement: int().default(0), // Percentage * 100
	analysisCompletedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
]);

// Type Exports
export type BulkBroadcastCampaign = typeof bulkBroadcastCampaigns.$inferSelect;
export type InsertBulkBroadcastCampaign = typeof bulkBroadcastCampaigns.$inferInsert;
export type EmailWorkflow = typeof emailWorkflows.$inferSelect;
export type InsertEmailWorkflow = typeof emailWorkflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type ABTestNew = typeof abTestsNew.$inferSelect;
export type InsertABTestNew = typeof abTestsNew.$inferInsert;
export type ABTestVariant = typeof abTestVariants.$inferSelect;
export type InsertABTestVariant = typeof abTestVariants.$inferInsert;
export type ABTestResult = typeof abTestResults.$inferSelect;
export type InsertABTestResult = typeof abTestResults.$inferInsert;

// ============================================
// CONVERSION TRACKING & ANALYTICS SCHEMA
// ============================================

export const conversionEvents = mysqlTable("conversionEvents", {
	id: int().autoincrement().notNull(),
	campaignId: int().references(() => bulkBroadcastCampaigns.id, { onDelete: "cascade" }),
	workflowId: int().references(() => emailWorkflows.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	eventType: mysqlEnum(['email_sent', 'email_opened', 'email_clicked', 'link_clicked', 'application_submitted', 'interview_accepted', 'interview_completed', 'offer_accepted']).notNull(),
	eventData: json(),
	trackingToken: varchar({ length: 255 }),
	linkUrl: text(),
	userAgent: text(),
	ipAddress: varchar({ length: 45 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("campaignId_idx").on(table.campaignId),
	index("workflowId_idx").on(table.workflowId),
	index("candidateId_idx").on(table.candidateId),
	index("eventType_idx").on(table.eventType),
	index("trackingToken_idx").on(table.trackingToken),
	index("createdAt_idx").on(table.createdAt),
]);

export const workflowAnalytics = mysqlTable("workflowAnalytics", {
	id: int().autoincrement().notNull(),
	workflowId: int().notNull().references(() => emailWorkflows.id, { onDelete: "cascade" }),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	totalExecutions: int().default(0).notNull(),
	successfulExecutions: int().default(0).notNull(),
	failedExecutions: int().default(0).notNull(),
	emailsSent: int().default(0).notNull(),
	emailsDelivered: int().default(0).notNull(),
	emailsBounced: int().default(0).notNull(),
	emailsFailed: int().default(0).notNull(),
	emailsOpened: int().default(0).notNull(),
	emailsClicked: int().default(0).notNull(),
	conversions: int().default(0).notNull(),
	openRate: decimal({ precision: 5, scale: 2 }).default('0.00'),
	clickRate: decimal({ precision: 5, scale: 2 }).default('0.00'),
	conversionRate: decimal({ precision: 5, scale: 2 }).default('0.00'),
	averageTimeToConversion: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("workflowId_idx").on(table.workflowId),
	index("periodStart_idx").on(table.periodStart),
]);

export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = typeof conversionEvents.$inferInsert;
export type WorkflowAnalytics = typeof workflowAnalytics.$inferSelect;
export type InsertWorkflowAnalytics = typeof workflowAnalytics.$inferInsert;

// ============================================
// ADVANCED ANALYTICS & AUTOMATION SCHEMA
// ============================================

// A/B Test Insights - Historical performance tracking
export const abTestInsights = mysqlTable("ab_test_insights", {
	id: int().autoincrement().notNull(),
	testId: int().notNull().references(() => abTestsNew.id, { onDelete: "cascade" }),
	segmentType: mysqlEnum(['all', 'industry', 'experience_level', 'location', 'skill_category']).default('all').notNull(),
	segmentValue: varchar({ length: 255 }), // e.g., "Technology", "Senior", "Riyadh"
	winnerVariantId: int().references(() => abTestVariants.id),
	openRateImprovement: int().default(0), // Percentage * 100
	clickRateImprovement: int().default(0), // Percentage * 100
	conversionRateImprovement: int().default(0), // Percentage * 100
	roi: int().default(0), // ROI percentage * 100
	costSavings: int().default(0), // In smallest currency unit (e.g., halalas)
	revenueImpact: int().default(0), // In smallest currency unit
	sampleSize: int().notNull(),
	confidenceLevel: int().default(95),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("testId_idx").on(table.testId),
	index("segmentType_idx").on(table.segmentType),
	index("createdAt_idx").on(table.createdAt),
]);

// Template Performance Metrics - Track template effectiveness over time
export const templatePerformanceMetrics = mysqlTable("template_performance_metrics", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	emailsSent: int().default(0).notNull(),
	emailsDelivered: int().default(0).notNull(),
	emailsOpened: int().default(0).notNull(),
	emailsClicked: int().default(0).notNull(),
	conversions: int().default(0).notNull(),
	openRate: int().default(0), // Percentage * 100
	clickRate: int().default(0), // Percentage * 100
	conversionRate: int().default(0), // Percentage * 100
	bounceRate: int().default(0), // Percentage * 100
	unsubscribeRate: int().default(0), // Percentage * 100
	averageOpenRate: int().default(0), // Historical average for comparison
	averageClickRate: int().default(0), // Historical average for comparison
	averageConversionRate: int().default(0), // Historical average for comparison
	performanceScore: int().default(0), // Composite score 0-100
	trendDirection: mysqlEnum(['improving', 'stable', 'declining']).default('stable'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("templateId_idx").on(table.templateId),
	index("periodStart_idx").on(table.periodStart),
	index("performanceScore_idx").on(table.performanceScore),
]);

// Template Performance Alerts Configuration
export const templatePerformanceAlertConfig = mysqlTable("template_performance_alert_config", {
	id: int().autoincrement().notNull(),
	templateId: int().notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
	alertType: mysqlEnum(['open_rate_drop', 'click_rate_drop', 'conversion_drop', 'bounce_spike', 'unsubscribe_spike']).notNull(),
	thresholdPercentage: int().default(20), // Alert when metric drops by this percentage
	comparisonPeriodDays: int().default(30), // Compare against last N days
	isEnabled: tinyint().default(1).notNull(),
	notifyOwner: tinyint().default(1).notNull(),
	notifyUsers: json(), // Array of user IDs to notify
	lastTriggeredAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("templateId_idx").on(table.templateId),
	index("isEnabled_idx").on(table.isEnabled),
]);

// Template Performance Alert History
export const templatePerformanceAlertHistory = mysqlTable("template_performance_alert_history", {
	id: int().autoincrement().notNull(),
	configId: int().notNull().references(() => templatePerformanceAlertConfig.id, { onDelete: "cascade" }),
	templateId: int().notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
	alertType: mysqlEnum(['open_rate_drop', 'click_rate_drop', 'conversion_drop', 'bounce_spike', 'unsubscribe_spike']).notNull(),
	currentValue: int().notNull(), // Current metric value (percentage * 100)
	historicalAverage: int().notNull(), // Historical average (percentage * 100)
	percentageChange: int().notNull(), // Percentage change * 100
	severity: mysqlEnum(['info', 'warning', 'critical']).default('warning').notNull(),
	message: text().notNull(),
	recommendation: text(),
	acknowledged: tinyint().default(0).notNull(),
	acknowledgedBy: int().references(() => users.id),
	acknowledgedAt: timestamp({ mode: 'string' }),
	actionTaken: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("configId_idx").on(table.configId),
	index("templateId_idx").on(table.templateId),
	index("acknowledged_idx").on(table.acknowledged),
	index("createdAt_idx").on(table.createdAt),
]);

// Smart Campaign Scheduling - ML-predicted optimal send times
export const campaignSchedulePredictions = mysqlTable("campaign_schedule_predictions", {
	id: int().autoincrement().notNull(),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	timezone: varchar({ length: 100 }).notNull(), // e.g., "Asia/Riyadh"
	optimalSendTime: varchar({ length: 50 }).notNull(), // e.g., "09:00" in candidate's timezone
	optimalDayOfWeek: int().notNull(), // 0-6 (Sunday-Saturday)
	predictionConfidence: int().default(0), // Confidence score 0-100
	basedOnHistoricalData: tinyint().default(1).notNull(),
	historicalOpenRate: int().default(0), // Percentage * 100
	historicalClickRate: int().default(0), // Percentage * 100
	lastEngagementTime: timestamp({ mode: 'string' }),
	engagementPattern: json(), // Detailed engagement patterns by hour/day
	modelVersion: varchar({ length: 50 }).default('v1.0'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("candidateId_idx").on(table.candidateId),
	index("timezone_idx").on(table.timezone),
	index("updatedAt_idx").on(table.updatedAt),
]);

// Scheduled Campaign Queue - Campaigns queued for optimal send times
export const scheduledCampaignQueue = mysqlTable("scheduled_campaign_queue", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull().references(() => bulkBroadcastCampaigns.id, { onDelete: "cascade" }),
	candidateId: int().notNull().references(() => candidates.id, { onDelete: "cascade" }),
	scheduledSendTime: timestamp({ mode: 'string' }).notNull(), // UTC timestamp
	candidateLocalTime: varchar({ length: 50 }).notNull(), // e.g., "09:00 Asia/Riyadh"
	timezone: varchar({ length: 100 }).notNull(),
	predictionId: int().references(() => campaignSchedulePredictions.id),
	status: mysqlEnum(['queued', 'sent', 'failed', 'cancelled']).default('queued').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	retryCount: int().default(0).notNull(),
	priority: int().default(5), // 1-10, higher = more urgent
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("campaignId_idx").on(table.campaignId),
	index("candidateId_idx").on(table.candidateId),
	index("scheduledSendTime_idx").on(table.scheduledSendTime),
	index("status_idx").on(table.status),
	index("priority_idx").on(table.priority),
]);

// Campaign Send Time Analytics - Track actual performance by send time
export const campaignSendTimeAnalytics = mysqlTable("campaign_send_time_analytics", {
	id: int().autoincrement().notNull(),
	campaignId: int().references(() => bulkBroadcastCampaigns.id, { onDelete: "cascade" }),
	hourOfDay: int().notNull(), // 0-23
	dayOfWeek: int().notNull(), // 0-6
	timezone: varchar({ length: 100 }).notNull(),
	emailsSent: int().default(0).notNull(),
	emailsOpened: int().default(0).notNull(),
	emailsClicked: int().default(0).notNull(),
	conversions: int().default(0).notNull(),
	openRate: int().default(0), // Percentage * 100
	clickRate: int().default(0), // Percentage * 100
	conversionRate: int().default(0), // Percentage * 100
	averageTimeToOpen: int(), // Minutes
	averageTimeToClick: int(), // Minutes
	periodStart: timestamp({ mode: 'string' }).notNull(),
	periodEnd: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("campaignId_idx").on(table.campaignId),
	index("hourOfDay_idx").on(table.hourOfDay),
	index("dayOfWeek_idx").on(table.dayOfWeek),
	index("timezone_idx").on(table.timezone),
	index("periodStart_idx").on(table.periodStart),
]);

// Type Exports
export type ABTestInsight = typeof abTestInsights.$inferSelect;
export type InsertABTestInsight = typeof abTestInsights.$inferInsert;

export type TemplatePerformanceMetric = typeof templatePerformanceMetrics.$inferSelect;
export type InsertTemplatePerformanceMetric = typeof templatePerformanceMetrics.$inferInsert;

export type TemplatePerformanceAlertConfig = typeof templatePerformanceAlertConfig.$inferSelect;
export type InsertTemplatePerformanceAlertConfig = typeof templatePerformanceAlertConfig.$inferInsert;

export type TemplatePerformanceAlertHistory = typeof templatePerformanceAlertHistory.$inferSelect;
export type InsertTemplatePerformanceAlertHistory = typeof templatePerformanceAlertHistory.$inferInsert;

export type CampaignSchedulePrediction = typeof campaignSchedulePredictions.$inferSelect;
export type InsertCampaignSchedulePrediction = typeof campaignSchedulePredictions.$inferInsert;

export type ScheduledCampaignQueue = typeof scheduledCampaignQueue.$inferSelect;
export type InsertScheduledCampaignQueue = typeof scheduledCampaignQueue.$inferInsert;

export type CampaignSendTimeAnalytic = typeof campaignSendTimeAnalytics.$inferSelect;
export type InsertCampaignSendTimeAnalytic = typeof campaignSendTimeAnalytics.$inferInsert;
