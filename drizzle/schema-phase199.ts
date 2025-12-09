import { int, mysqlTable, text, timestamp, varchar, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

/**
 * Phase 199: Advanced Job Alerts Features
 * 
 * Tables:
 * 1. alert_email_templates - قوالب البريد الإلكتروني المخصصة
 * 2. alert_template_ab_tests - A/B Testing للقوالب
 * 3. alert_analytics - إحصائيات الأداء للتنبيهات
 * 4. alert_tracking_events - تتبع الأحداث (فتح، نقر، تحويل)
 */

// ==================== Email Templates ====================

export const alertEmailTemplates = mysqlTable("alert_email_templates", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"), // نسخة نصية للـ email
  variables: text("variables"), // JSON array of available variables
  category: mysqlEnum("category", ["instant", "daily", "weekly"]).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AlertEmailTemplate = typeof alertEmailTemplates.$inferSelect;
export type InsertAlertEmailTemplate = typeof alertEmailTemplates.$inferInsert;

// ==================== A/B Testing ====================

export const alertTemplateAbTests = mysqlTable("alert_template_ab_tests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  testName: varchar("test_name", { length: 255 }).notNull(),
  templateAId: int("template_a_id").notNull(), // FK to alert_email_templates
  templateBId: int("template_b_id").notNull(), // FK to alert_email_templates
  trafficSplit: int("traffic_split").default(50).notNull(), // 0-100 (% for template A)
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).default("draft").notNull(),
  winnerId: int("winner_id"), // FK to alert_email_templates (null until test completes)
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AlertTemplateAbTest = typeof alertTemplateAbTests.$inferSelect;
export type InsertAlertTemplateAbTest = typeof alertTemplateAbTests.$inferInsert;

// ==================== Analytics ====================

export const alertAnalytics = mysqlTable("alert_analytics", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alert_id").notNull(), // FK to job_alerts
  templateId: int("template_id"), // FK to alert_email_templates (nullable for legacy alerts)
  abTestId: int("ab_test_id"), // FK to alert_template_ab_tests (nullable)
  sentCount: int("sent_count").default(0).notNull(),
  deliveredCount: int("delivered_count").default(0).notNull(),
  openedCount: int("opened_count").default(0).notNull(),
  clickedCount: int("clicked_count").default(0).notNull(),
  convertedCount: int("converted_count").default(0).notNull(), // applied to job
  bouncedCount: int("bounced_count").default(0).notNull(),
  unsubscribedCount: int("unsubscribed_count").default(0).notNull(),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AlertAnalytics = typeof alertAnalytics.$inferSelect;
export type InsertAlertAnalytics = typeof alertAnalytics.$inferInsert;

// ==================== Tracking Events ====================

export const alertTrackingEvents = mysqlTable("alert_tracking_events", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alert_id").notNull(), // FK to job_alerts
  candidateId: int("candidate_id").notNull(), // FK to candidates
  templateId: int("template_id"), // FK to alert_email_templates
  abTestId: int("ab_test_id"), // FK to alert_template_ab_tests
  eventType: mysqlEnum("event_type", [
    "sent",
    "delivered",
    "opened",
    "clicked",
    "converted",
    "bounced",
    "unsubscribed"
  ]).notNull(),
  metadata: text("metadata"), // JSON: { link_clicked, user_agent, ip_address, etc. }
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AlertTrackingEvent = typeof alertTrackingEvents.$inferSelect;
export type InsertAlertTrackingEvent = typeof alertTrackingEvents.$inferInsert;
