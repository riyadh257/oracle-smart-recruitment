import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { importHistory, type InsertImportHistory, type ImportHistory } from "../drizzle/schema";

/**
 * Import History Database Operations
 * Handles tracking of all import operations with rollback capability
 */

export async function createImportRecord(data: InsertImportHistory): Promise<ImportHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(importHistory).values(data);
  const insertedId = Number(result[0].insertId);

  const record = await db
    .select()
    .from(importHistory)
    .where(eq(importHistory.id, insertedId))
    .limit(1);

  if (!record[0]) throw new Error("Failed to create import record");
  return record[0];
}

export async function updateImportRecord(
  id: number,
  data: Partial<InsertImportHistory>
): Promise<ImportHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(importHistory).set(data).where(eq(importHistory.id, id));

  const record = await db
    .select()
    .from(importHistory)
    .where(eq(importHistory.id, id))
    .limit(1);

  if (!record[0]) throw new Error("Import record not found");
  return record[0];
}

export async function getImportHistory(filters: {
  userId?: number;
  importType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(importHistory.userId, filters.userId));
  }
  if (filters.importType) {
    conditions.push(eq(importHistory.importType, filters.importType as any));
  }
  if (filters.status) {
    conditions.push(eq(importHistory.status, filters.status as any));
  }
  if (filters.startDate) {
    conditions.push(gte(importHistory.createdAt, filters.startDate.toISOString()));
  }
  if (filters.endDate) {
    conditions.push(lte(importHistory.createdAt, filters.endDate.toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(importHistory)
    .where(whereClause)
    .orderBy(desc(importHistory.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  return records;
}

export async function getImportById(id: number): Promise<ImportHistory | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const record = await db
    .select()
    .from(importHistory)
    .where(eq(importHistory.id, id))
    .limit(1);

  return record[0];
}

export async function getImportStatistics(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const whereClause = userId ? eq(importHistory.userId, userId) : undefined;

  const stats = await db
    .select({
      totalImports: sql<number>`COUNT(*)`,
      completedImports: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      failedImports: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
      rolledBackImports: sql<number>`SUM(CASE WHEN status = 'rolled_back' THEN 1 ELSE 0 END)`,
      totalRecordsProcessed: sql<number>`SUM(records_total)`,
      totalRecordsSuccess: sql<number>`SUM(records_success)`,
      totalRecordsError: sql<number>`SUM(records_error)`,
    })
    .from(importHistory)
    .where(whereClause);

  return stats[0] || {
    totalImports: 0,
    completedImports: 0,
    failedImports: 0,
    rolledBackImports: 0,
    totalRecordsProcessed: 0,
    totalRecordsSuccess: 0,
    totalRecordsError: 0,
  };
}

export async function rollbackImport(id: number, userId: number): Promise<ImportHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the import record
  const record = await getImportById(id);
  if (!record) throw new Error("Import record not found");

  if (record.status === "rolled_back") {
    throw new Error("Import has already been rolled back");
  }

  if (record.status !== "completed" && record.status !== "failed") {
    throw new Error("Only completed or failed imports can be rolled back");
  }

  // Update the record to mark as rolled back
  const updated = await updateImportRecord(id, {
    status: "rolled_back",
    rolledBackAt: new Date().toISOString() as any,
    rolledBackBy: userId,
  });

  return updated;
}
