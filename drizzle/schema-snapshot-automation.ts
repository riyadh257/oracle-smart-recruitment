import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Snapshot automation schedules
 * Defines automated snapshot capture configurations
 */
export const snapshotSchedules = mysqlTable("snapshot_schedules", {
  id: int("id").autoincrement().primaryKey(),
  scheduleName: varchar("scheduleName", { length: 255 }).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).notNull(),
  timeOfDay: varchar("timeOfDay", { length: 5 }).notNull(), // HH:MM format (24-hour)
  dayOfWeek: int("dayOfWeek"), // 0-6 for weekly schedules (0 = Sunday)
  dayOfMonth: int("dayOfMonth"), // 1-31 for monthly schedules
  targetType: mysqlEnum("targetType", ["all_templates", "specific_templates", "active_templates"]).notNull(),
  targetTemplateIds: text("targetTemplateIds"), // JSON array of template IDs for specific_templates
  isActive: boolean("isActive").default(true).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  nextExecutionAt: timestamp("nextExecutionAt").notNull(),
  executionCount: int("executionCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SnapshotSchedule = typeof snapshotSchedules.$inferSelect;
export type InsertSnapshotSchedule = typeof snapshotSchedules.$inferInsert;

/**
 * Snapshot execution logs
 * Tracks each automated snapshot execution
 */
export const snapshotExecutionLogs = mysqlTable("snapshot_execution_logs", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["success", "partial_success", "failed"]).notNull(),
  templatesProcessed: int("templatesProcessed").default(0).notNull(),
  snapshotsCreated: int("snapshotsCreated").default(0).notNull(),
  errorMessage: text("errorMessage"),
  executionDurationMs: int("executionDurationMs").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnapshotExecutionLog = typeof snapshotExecutionLogs.$inferSelect;
export type InsertSnapshotExecutionLog = typeof snapshotExecutionLogs.$inferInsert;

/**
 * Alert notification channels
 * Defines external notification endpoints for alerts
 */
export const alertNotificationChannels = mysqlTable("alert_notification_channels", {
  id: int("id").autoincrement().primaryKey(),
  channelName: varchar("channelName", { length: 255 }).notNull(),
  channelType: mysqlEnum("channelType", ["email", "slack", "webhook", "sms"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  // Configuration stored as JSON based on channel type
  // Email: { recipients: string[], subject_template: string }
  // Slack: { webhook_url: string, channel: string }
  // Webhook: { url: string, method: string, headers: object }
  // SMS: { provider: string, recipients: string[] }
  configuration: text("configuration").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertNotificationChannel = typeof alertNotificationChannels.$inferSelect;
export type InsertAlertNotificationChannel = typeof alertNotificationChannels.$inferInsert;

/**
 * Alert notification logs
 * Tracks each notification sent through external channels
 */
export const alertNotificationLogs = mysqlTable("alert_notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  alertHistoryId: int("alertHistoryId").notNull(), // Links to performanceAlertHistory
  channelId: int("channelId").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed", "retrying"]).notNull(),
  responseCode: int("responseCode"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertNotificationLog = typeof alertNotificationLogs.$inferSelect;
export type InsertAlertNotificationLog = typeof alertNotificationLogs.$inferInsert;
