import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Phase 202: Real-time Notifications System
 * Table for storing real-time notifications for video analysis and agent tasks
 */
export const realTimeNotifications = mysqlTable("real_time_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["video_analysis", "agent_task", "interview_question", "matching", "general"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["unread", "read", "archived"]).default("unread").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  relatedEntityId: int("related_entity_id"), // ID of video, task, etc.
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // "video_screening", "agent_task", etc.
  actionUrl: varchar("action_url", { length: 500 }), // URL to navigate when clicked
  metadata: text("metadata"), // JSON string for additional data
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  videoAnalysisEnabled: boolean("video_analysis_enabled").default(true).notNull(),
  agentTaskEnabled: boolean("agent_task_enabled").default(true).notNull(),
  interviewQuestionEnabled: boolean("interview_question_enabled").default(true).notNull(),
  matchingEnabled: boolean("matching_enabled").default(true).notNull(),
  emailNotifications: boolean("email_notifications").default(false).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Phase 202: AI Features Analytics Dashboard
 * Unified metrics for all AI features
 */
export const aiFeaturesMetrics = mysqlTable("ai_features_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: mysqlEnum("metric_type", ["video_analysis", "agent_task", "interview_question", "matching", "offer_negotiation"]).notNull(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  metricValue: int("metric_value").notNull(),
  metricUnit: varchar("metric_unit", { length: 50 }), // "count", "percentage", "milliseconds", etc.
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metadata: text("metadata"), // JSON string for additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiFeatureUsageStats = mysqlTable("ai_feature_usage_stats", {
  id: int("id").autoincrement().primaryKey(),
  featureType: mysqlEnum("feature_type", ["video_analysis", "agent_task", "interview_question", "matching", "offer_negotiation"]).notNull(),
  totalRequests: int("total_requests").default(0).notNull(),
  successfulRequests: int("successful_requests").default(0).notNull(),
  failedRequests: int("failed_requests").default(0).notNull(),
  avgProcessingTime: int("avg_processing_time").default(0).notNull(), // milliseconds
  totalProcessingTime: int("total_processing_time").default(0).notNull(), // milliseconds
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RealTimeNotification = typeof realTimeNotifications.$inferSelect;
export type InsertRealTimeNotification = typeof realTimeNotifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
export type AIFeaturesMetric = typeof aiFeaturesMetrics.$inferSelect;
export type InsertAIFeaturesMetric = typeof aiFeaturesMetrics.$inferInsert;
export type AIFeatureUsageStat = typeof aiFeatureUsageStats.$inferSelect;
export type InsertAIFeatureUsageStat = typeof aiFeatureUsageStats.$inferInsert;
