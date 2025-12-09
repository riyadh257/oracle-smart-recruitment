import { eq, desc, and, gte, lte, or } from "drizzle-orm";
import { getDb } from "./db";
import {
  complianceAuditLog,
  type InsertComplianceAuditLog,
  type ComplianceAuditLog,
} from "../drizzle/schema";

/**
 * Compliance Audit Log Service
 * Tracks all changes to compliance-related data for regulatory requirements
 */

export async function logAuditEntry(
  data: InsertComplianceAuditLog
): Promise<ComplianceAuditLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(complianceAuditLog).values(data);
  const insertedId = Number(result[0].insertId);

  const record = await db
    .select()
    .from(complianceAuditLog)
    .where(eq(complianceAuditLog.id, insertedId))
    .limit(1);

  if (!record[0]) throw new Error("Failed to create audit log entry");
  return record[0];
}

export async function getAuditLogs(filters: {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(complianceAuditLog.userId, filters.userId));
  }
  if (filters.entityType) {
    conditions.push(eq(complianceAuditLog.entityType, filters.entityType as any));
  }
  if (filters.entityId) {
    conditions.push(eq(complianceAuditLog.entityId, filters.entityId));
  }
  if (filters.action) {
    conditions.push(eq(complianceAuditLog.action, filters.action as any));
  }
  if (filters.startDate) {
    conditions.push(gte(complianceAuditLog.createdAt, filters.startDate.toISOString()));
  }
  if (filters.endDate) {
    conditions.push(lte(complianceAuditLog.createdAt, filters.endDate.toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select()
    .from(complianceAuditLog)
    .where(whereClause)
    .orderBy(desc(complianceAuditLog.createdAt))
    .limit(filters.limit || 100)
    .offset(filters.offset || 0);

  return records;
}

export async function getAuditLogById(id: number): Promise<ComplianceAuditLog | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const record = await db
    .select()
    .from(complianceAuditLog)
    .where(eq(complianceAuditLog.id, id))
    .limit(1);

  return record[0];
}

export async function getEntityHistory(
  entityType: string,
  entityId: number
): Promise<ComplianceAuditLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await db
    .select()
    .from(complianceAuditLog)
    .where(
      and(
        eq(complianceAuditLog.entityType, entityType as any),
        eq(complianceAuditLog.entityId, entityId)
      )
    )
    .orderBy(desc(complianceAuditLog.createdAt));

  return records;
}

/**
 * Helper function to create audit log for data changes
 * Call this from tRPC procedures when modifying compliance data
 */
export async function auditDataChange(params: {
  userId: number;
  entityType: string;
  entityId: number;
  action: "create" | "update" | "delete" | "rollback" | "approve" | "reject";
  fieldChanged?: string;
  valueBefore?: any;
  valueAfter?: any;
  changeReason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ComplianceAuditLog> {
  return logAuditEntry({
    userId: params.userId,
    entityType: params.entityType as any,
    entityId: params.entityId,
    action: params.action,
    fieldChanged: params.fieldChanged,
    valueBefore: params.valueBefore ? JSON.stringify(params.valueBefore) : null,
    valueAfter: params.valueAfter ? JSON.stringify(params.valueAfter) : null,
    changeReason: params.changeReason,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });
}

/**
 * Export audit logs to CSV format for regulatory compliance
 */
export function exportAuditLogsToCSV(logs: ComplianceAuditLog[]): string {
  const headers = [
    "ID",
    "Timestamp",
    "User ID",
    "Entity Type",
    "Entity ID",
    "Action",
    "Field Changed",
    "Value Before",
    "Value After",
    "Change Reason",
    "IP Address",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt,
    log.userId,
    log.entityType,
    log.entityId || "",
    log.action,
    log.fieldChanged || "",
    log.valueBefore || "",
    log.valueAfter || "",
    log.changeReason || "",
    log.ipAddress || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
