import { boolean, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

/**
 * Pricing plans table for subscription tiers
 */
export const pricingPlans = mysqlTable("pricingPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }).notNull(),
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr").notNull(),
  price: int("price").notNull(), // Monthly price in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  billingPeriod: varchar("billingPeriod", { length: 20 }).default("monthly").notNull(), // monthly, yearly
  features: text("features").notNull(), // JSON array of features
  featuresAr: text("featuresAr").notNull(), // JSON array of features in Arabic
  isPopular: boolean("isPopular").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  maxJobs: int("maxJobs"), // null = unlimited
  maxCandidates: int("maxCandidates"), // null = unlimited
  maxUsers: int("maxUsers"), // null = unlimited
  ctaText: varchar("ctaText", { length: 100 }).default("Get Started").notNull(),
  ctaTextAr: varchar("ctaTextAr", { length: 100 }).default("ابدأ الآن").notNull(),
  ctaUrl: varchar("ctaUrl", { length: 255 }),
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = typeof pricingPlans.$inferInsert;
