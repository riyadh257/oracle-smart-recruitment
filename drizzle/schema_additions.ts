import { int, mysqlTable, varchar, tinyint, timestamp, index } from "drizzle-orm/mysql-core";
import { candidates } from "./schema";

/**
 * Candidate Nationality and Work Permit Information
 * For KSA Compliance tracking
 */
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
