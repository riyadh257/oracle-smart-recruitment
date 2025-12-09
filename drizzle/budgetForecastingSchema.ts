import { int, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * SMS Usage Tracking
 * Tracks all SMS sends for budget forecasting and analytics
 */
export const smsUsage = mysqlTable("smsUsage", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"), // nullable - can be ad-hoc SMS
  candidateId: int("candidateId"),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  messageLength: int("messageLength").notNull(), // character count
  segmentCount: int("segmentCount").notNull().default(1), // SMS segments (160 chars each)
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(), // cost in SAR
  status: varchar("status", { length: 20 }).notNull().default("sent"), // sent, failed, pending
  provider: varchar("provider", { length: 50 }).notNull().default("twilio"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Budget Forecasts
 * Stores predictive analytics results for SMS spending
 */
export const budgetForecasts = mysqlTable("budgetForecasts", {
  id: int("id").autoincrement().primaryKey(),
  forecastDate: timestamp("forecastDate").notNull(), // date this forecast was generated
  periodStart: timestamp("periodStart").notNull(), // forecast period start
  periodEnd: timestamp("periodEnd").notNull(), // forecast period end
  predictedSpend: decimal("predictedSpend", { precision: 12, scale: 2 }).notNull(), // SAR
  confidenceLevel: decimal("confidenceLevel", { precision: 5, scale: 2 }).notNull(), // 0-100%
  baselineSpend: decimal("baselineSpend", { precision: 12, scale: 2 }).notNull(), // historical average
  trendFactor: decimal("trendFactor", { precision: 5, scale: 2 }).notNull(), // growth/decline rate
  seasonalityFactor: decimal("seasonalityFactor", { precision: 5, scale: 2 }).notNull(), // seasonal adjustment
  scheduledCampaignsCount: int("scheduledCampaignsCount").notNull().default(0),
  scheduledCampaignsSpend: decimal("scheduledCampaignsSpend", { precision: 12, scale: 2 }).notNull().default("0"),
  methodology: text("methodology"), // JSON: algorithm details
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Budget Alerts
 * Configurable thresholds and alert history
 */
export const budgetAlerts = mysqlTable("budgetAlerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: varchar("alertType", { length: 50 }).notNull(), // threshold_warning, threshold_critical, forecast_exceeded
  threshold: decimal("threshold", { precision: 12, scale: 2 }).notNull(), // SAR amount
  currentSpend: decimal("currentSpend", { precision: 12, scale: 2 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // info, warning, critical
  message: text("message").notNull(),
  acknowledged: int("acknowledged").notNull().default(0), // boolean
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy"), // user id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Campaign Schedule
 * Future scheduled campaigns for forecast calculation
 */
export const campaignSchedule = mysqlTable("campaignSchedule", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  estimatedRecipients: int("estimatedRecipients").notNull(),
  estimatedMessageLength: int("estimatedMessageLength").notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, sent, cancelled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmsUsage = typeof smsUsage.$inferSelect;
export type InsertSmsUsage = typeof smsUsage.$inferInsert;
export type BudgetForecast = typeof budgetForecasts.$inferSelect;
export type InsertBudgetForecast = typeof budgetForecasts.$inferInsert;
export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = typeof budgetAlerts.$inferInsert;
export type CampaignSchedule = typeof campaignSchedule.$inferSelect;
export type InsertCampaignSchedule = typeof campaignSchedule.$inferInsert;
