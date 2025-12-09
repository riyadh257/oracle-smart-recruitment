import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  employees,
  visaCompliance,
  visaComplianceAlerts,
  whatsappSettings,
  whatsappNotificationLogs,
  type InsertEmployee,
  type InsertVisaCompliance,
  type InsertVisaComplianceAlert,
  type InsertWhatsappSettings,
  type InsertWhatsappNotificationLog,
} from "../drizzle/schema";

// ============================================
// EMPLOYEE OPERATIONS
// ============================================

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [employee] = await db.insert(employees).values(data).$returningId();
  return employee;
}

export async function getEmployeesByEmployer(employerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(employees).where(eq(employees.employerId, employerId));
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [employee] = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return employee || null;
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(employees).where(eq(employees.id, id));
}

// ============================================
// VISA COMPLIANCE OPERATIONS
// ============================================

export async function createVisaCompliance(data: InsertVisaCompliance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [record] = await db.insert(visaCompliance).values(data).$returningId();
  return record;
}

export async function getVisaComplianceByEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(visaCompliance).where(eq(visaCompliance.employeeId, employeeId));
}

export async function getExpiringDocuments(daysThreshold: number) {
  const db = await getDb();
  if (!db) return [];
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return await db
    .select({
      compliance: visaCompliance,
      employee: employees,
    })
    .from(visaCompliance)
    .leftJoin(employees, eq(visaCompliance.employeeId, employees.id))
    .where(
      and(
        lte(visaCompliance.expiryDate, thresholdDate.toISOString()),
        gte(visaCompliance.expiryDate, new Date().toISOString())
      )
    )
    .orderBy(visaCompliance.expiryDate);
}

export async function updateVisaComplianceStatus(id: number, data: Partial<InsertVisaCompliance>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(visaCompliance).set(data).where(eq(visaCompliance.id, id));
}

export async function calculateDaysUntilExpiry(expiryDate: string): Promise<number> {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function updateComplianceStatuses() {
  const db = await getDb();
  if (!db) return;
  
  const allRecords = await db.select().from(visaCompliance);
  
  for (const record of allRecords) {
    const daysUntilExpiry = await calculateDaysUntilExpiry(record.expiryDate);
    let status: 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal' = 'valid';
    
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'expiring_soon';
    }
    
    await db.update(visaCompliance).set({
      daysUntilExpiry,
      status,
    }).where(eq(visaCompliance.id, record.id));
  }
}

// ============================================
// COMPLIANCE ALERTS OPERATIONS
// ============================================

export async function createComplianceAlert(data: InsertVisaComplianceAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [alert] = await db.insert(visaComplianceAlerts).values(data).$returningId();
  return alert;
}

export async function getActiveAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      alert: visaComplianceAlerts,
      compliance: visaCompliance,
      employee: employees,
    })
    .from(visaComplianceAlerts)
    .leftJoin(visaCompliance, eq(visaComplianceAlerts.visaComplianceId, visaCompliance.id))
    .leftJoin(employees, eq(visaCompliance.employeeId, employees.id))
    .where(
      and(
        eq(visaComplianceAlerts.acknowledged, 0),
        eq(visaComplianceAlerts.dismissed, 0)
      )
    )
    .orderBy(desc(visaComplianceAlerts.severity), desc(visaComplianceAlerts.createdAt));
}

export async function acknowledgeAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(visaComplianceAlerts).set({
    acknowledged: 1,
    acknowledgedBy: userId,
    acknowledgedAt: new Date().toISOString(),
  }).where(eq(visaComplianceAlerts.id, alertId));
}

export async function dismissAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(visaComplianceAlerts).set({
    dismissed: 1,
    dismissedBy: userId,
    dismissedAt: new Date().toISOString(),
  }).where(eq(visaComplianceAlerts.id, alertId));
}

// ============================================
// WHATSAPP SETTINGS OPERATIONS
// ============================================

export async function getWhatsappSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const [settings] = await db.select().from(whatsappSettings).where(eq(whatsappSettings.userId, userId)).limit(1);
  return settings || null;
}

export async function upsertWhatsappSettings(userId: number, data: Partial<InsertWhatsappSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getWhatsappSettings(userId);
  
  if (existing) {
    await db.update(whatsappSettings).set(data).where(eq(whatsappSettings.userId, userId));
  } else {
    await db.insert(whatsappSettings).values({
      userId,
      phoneNumber: data.phoneNumber || '',
      ...data,
    });
  }
}

// ============================================
// WHATSAPP NOTIFICATION LOGS OPERATIONS
// ============================================

export async function createWhatsappLog(data: InsertWhatsappNotificationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [log] = await db.insert(whatsappNotificationLogs).values(data).$returningId();
  return log;
}

export async function getWhatsappLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(whatsappNotificationLogs)
    .where(eq(whatsappNotificationLogs.userId, userId))
    .orderBy(desc(whatsappNotificationLogs.createdAt))
    .limit(limit);
}

export async function updateWhatsappLogStatus(
  id: number,
  status: 'pending' | 'sent' | 'failed' | 'delivered',
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  
  if (status === 'sent') {
    updateData.sentAt = new Date().toISOString();
  } else if (status === 'delivered') {
    updateData.deliveredAt = new Date().toISOString();
  } else if (status === 'failed' && errorMessage) {
    updateData.errorMessage = errorMessage;
  }
  
  await db.update(whatsappNotificationLogs).set(updateData).where(eq(whatsappNotificationLogs.id, id));
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================

export async function getComplianceAnalytics(employerId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get all employees for this employer
  const employeeList = await db.select().from(employees).where(eq(employees.employerId, employerId));
  const employeeIds = employeeList.map(e => e.id);
  
  if (employeeIds.length === 0) {
    return {
      totalEmployees: 0,
      totalDocuments: 0,
      validDocuments: 0,
      expiringSoon: 0,
      expired: 0,
      pendingRenewal: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      infoAlerts: 0,
    };
  }
  
  // Get all compliance records for these employees
  const complianceRecords = await db
    .select()
    .from(visaCompliance)
    .where(sql`${visaCompliance.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`);
  
  // Get active alerts
  const alerts = await db
    .select()
    .from(visaComplianceAlerts)
    .leftJoin(visaCompliance, eq(visaComplianceAlerts.visaComplianceId, visaCompliance.id))
    .where(
      and(
        sql`${visaCompliance.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        eq(visaComplianceAlerts.acknowledged, 0),
        eq(visaComplianceAlerts.dismissed, 0)
      )
    );
  
  return {
    totalEmployees: employeeList.length,
    totalDocuments: complianceRecords.length,
    validDocuments: complianceRecords.filter(r => r.status === 'valid').length,
    expiringSoon: complianceRecords.filter(r => r.status === 'expiring_soon').length,
    expired: complianceRecords.filter(r => r.status === 'expired').length,
    pendingRenewal: complianceRecords.filter(r => r.renewalStatus === 'in_progress').length,
    criticalAlerts: alerts.filter(a => a.visa_compliance_alerts?.severity === 'critical').length,
    warningAlerts: alerts.filter(a => a.visa_compliance_alerts?.severity === 'warning').length,
    infoAlerts: alerts.filter(a => a.visa_compliance_alerts?.severity === 'info').length,
  };
}

export async function getComplianceTrends(employerId: number, days: number = 90) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get employees for this employer
  const employeeList = await db.select().from(employees).where(eq(employees.employerId, employerId));
  const employeeIds = employeeList.map(e => e.id);
  
  if (employeeIds.length === 0) return [];
  
  // Get compliance records created in the time range
  const records = await db
    .select()
    .from(visaCompliance)
    .where(
      and(
        sql`${visaCompliance.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`,
        gte(visaCompliance.createdAt, startDate.toISOString())
      )
    )
    .orderBy(visaCompliance.createdAt);
  
  return records;
}
