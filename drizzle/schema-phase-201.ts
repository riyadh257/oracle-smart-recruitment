import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Phase 201: Advanced AI Features
 * 
 * This file contains database schemas for:
 * 1. Advanced AI Video Interviewing (facial analysis, psychological profiles, tone analysis)
 * 2. Agentic AI System (9 specialized agents)
 * 3. Advanced Arabic NLP Support
 */

// ==================== 1. Advanced AI Video Interviewing ====================

export const videoInterviewsAdvanced = mysqlTable("video_interviews_advanced", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  jobId: int("job_id").notNull(),
  videoUrl: varchar("video_url", { length: 500 }).notNull(),
  duration: int("duration"), // in seconds
  recordedAt: timestamp("recorded_at").notNull(),
  analysisStatus: mysqlEnum("analysis_status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  overallScore: int("overall_score"), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type VideoInterviewAdvanced = typeof videoInterviewsAdvanced.$inferSelect;
export type InsertVideoInterviewAdvanced = typeof videoInterviewsAdvanced.$inferInsert;

export const facialAnalysisResults = mysqlTable("facial_analysis_results", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interview_id").notNull(),
  happinessScore: int("happiness_score"), // 0-100
  sadnessScore: int("sadness_score"), // 0-100
  angerScore: int("anger_score"), // 0-100
  surpriseScore: int("surprise_score"), // 0-100
  neutralScore: int("neutral_score"), // 0-100
  overallEmotion: varchar("overall_emotion", { length: 50 }),
  confidenceLevel: int("confidence_level"), // 0-100
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export type FacialAnalysisResult = typeof facialAnalysisResults.$inferSelect;
export type InsertFacialAnalysisResult = typeof facialAnalysisResults.$inferInsert;

export const psychologicalProfiles = mysqlTable("psychological_profiles", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  interviewId: int("interview_id"),
  // Five-Factor Model (Big Five)
  openness: int("openness"), // 0-100
  conscientiousness: int("conscientiousness"), // 0-100
  extraversion: int("extraversion"), // 0-100
  agreeableness: int("agreeableness"), // 0-100
  neuroticism: int("neuroticism"), // 0-100
  overallFit: int("overall_fit"), // 0-100
  insights: text("insights"), // JSON array of insights
  profileDate: timestamp("profile_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PsychologicalProfile = typeof psychologicalProfiles.$inferSelect;
export type InsertPsychologicalProfile = typeof psychologicalProfiles.$inferInsert;

export const aiModelAnswers = mysqlTable("ai_model_answers", {
  id: int("id").autoincrement().primaryKey(),
  questionId: int("question_id").notNull(),
  questionText: text("question_text").notNull(),
  modelAnswer: text("model_answer").notNull(),
  keywords: text("keywords"), // JSON array
  evaluationCriteria: text("evaluation_criteria"), // JSON array
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AiModelAnswer = typeof aiModelAnswers.$inferSelect;
export type InsertAiModelAnswer = typeof aiModelAnswers.$inferInsert;

export const toneAnalysisResults = mysqlTable("tone_analysis_results", {
  id: int("id").autoincrement().primaryKey(),
  interviewId: int("interview_id").notNull(),
  confidentScore: int("confident_score"), // 0-100
  nervousScore: int("nervous_score"), // 0-100
  enthusiasticScore: int("enthusiastic_score"), // 0-100
  monotoneScore: int("monotone_score"), // 0-100
  overallTone: varchar("overall_tone", { length: 50 }),
  speakingPace: varchar("speaking_pace", { length: 50 }), // slow, normal, fast
  clarity: int("clarity"), // 0-100
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export type ToneAnalysisResult = typeof toneAnalysisResults.$inferSelect;
export type InsertToneAnalysisResult = typeof toneAnalysisResults.$inferInsert;

// ==================== 2. Agentic AI System ====================

export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  agentType: mysqlEnum("agent_type", [
    "crm_update",
    "job_change_alert",
    "research",
    "outreach",
    "notetaker",
    "submission",
    "phone_finder",
    "summarization",
    "task"
  ]).notNull(),
  status: mysqlEnum("status", ["active", "paused", "stopped"]).default("active").notNull(),
  capabilities: text("capabilities"), // JSON array
  configuration: text("configuration"), // JSON object
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = typeof aiAgents.$inferInsert;

export const agentTasks = mysqlTable("agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  inputData: text("input_data"), // JSON object
  outputData: text("output_data"), // JSON object
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  errorMessage: text("error_message"),
  retryCount: int("retry_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = typeof agentTasks.$inferInsert;

export const agentExecutionLogs = mysqlTable("agent_execution_logs", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(),
  taskId: int("task_id"),
  action: varchar("action", { length: 200 }).notNull(),
  result: text("result"), // JSON object
  executionTime: int("execution_time"), // in milliseconds
  success: int("success").default(1).notNull(), // 1 = success, 0 = failure
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgentExecutionLog = typeof agentExecutionLogs.$inferSelect;
export type InsertAgentExecutionLog = typeof agentExecutionLogs.$inferInsert;

// ==================== 3. Advanced Arabic NLP Support ====================

export const arabicNlpModels = mysqlTable("arabic_nlp_models", {
  id: int("id").autoincrement().primaryKey(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  modelType: mysqlEnum("model_type", [
    "resume_parser",
    "job_analyzer",
    "sentiment_analysis",
    "entity_extraction",
    "text_normalization"
  ]).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  accuracy: int("accuracy"), // 0-100
  trainedOn: int("trained_on"), // number of samples
  modelPath: varchar("model_path", { length: 500 }),
  status: mysqlEnum("status", ["training", "active", "deprecated"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ArabicNlpModel = typeof arabicNlpModels.$inferSelect;
export type InsertArabicNlpModel = typeof arabicNlpModels.$inferInsert;

export const arabicResumeTrainingData = mysqlTable("arabic_resume_training_data", {
  id: int("id").autoincrement().primaryKey(),
  resumeText: text("resume_text").notNull(),
  extractedSkills: text("extracted_skills"), // JSON array
  extractedEducation: text("extracted_education"), // JSON array
  extractedExperience: text("extracted_experience"), // JSON array
  extractedCertifications: text("extracted_certifications"), // JSON array
  extractedLanguages: text("extracted_languages"), // JSON array
  qualityScore: int("quality_score"), // 0-100
  verified: int("verified").default(0).notNull(), // 1 = verified, 0 = not verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ArabicResumeTrainingData = typeof arabicResumeTrainingData.$inferSelect;
export type InsertArabicResumeTrainingData = typeof arabicResumeTrainingData.$inferInsert;

export const arabicEntityExtractionResults = mysqlTable("arabic_entity_extraction_results", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidate_id").notNull(),
  resumeId: int("resume_id"),
  skills: text("skills"), // JSON array
  education: text("education"), // JSON array
  experience: text("experience"), // JSON array
  certifications: text("certifications"), // JSON array
  languages: text("languages"), // JSON array
  contactInfo: text("contact_info"), // JSON object
  extractionAccuracy: int("extraction_accuracy"), // 0-100
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export type ArabicEntityExtractionResult = typeof arabicEntityExtractionResults.$inferSelect;
export type InsertArabicEntityExtractionResult = typeof arabicEntityExtractionResults.$inferInsert;
