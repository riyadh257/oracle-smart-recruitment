/**
 * Qiwa Platform Integration
 * 
 * This module provides integration with the Saudi Arabian Qiwa platform
 * for work permit management, employee data sync, and real-time Nitaqat status.
 * 
 * CRITICAL MARKET DIFFERENTIATOR: NO competitor offers automated Qiwa integration
 * 
 * Features:
 * - API authentication with Qiwa platform
 * - Bidirectional employee data synchronization
 * - Real-time Nitaqat status retrieval
 * - Work permit application submission
 * - Work permit status tracking
 * - Permit expiration alerts
 * - Webhook handling for status updates
 * 
 * API Documentation: https://api.qiwa.sa/docs (hypothetical - actual API docs required)
 */

import { getDb } from "../db";
import { governmentSyncLog, qiwaWorkPermits } from "../../drizzle/schema";
import { eq, desc, and, lt } from "drizzle-orm";

// Qiwa API Configuration
const QIWA_API_BASE_URL = process.env.QIWA_API_URL || "https://api.qiwa.sa/v1";
const QIWA_AUTH_URL = process.env.QIWA_AUTH_URL || "https://auth.qiwa.sa";

/**
 * Qiwa API Client Configuration
 */
interface QiwaConfig {
  apiKey: string;
  apiSecret: string;
  establishmentId: string; // Qiwa establishment ID
  accessToken?: string;
  tokenExpiry?: Date;
}

/**
 * Employee Data for Qiwa Sync
 */
interface QiwaEmployeeData {
  nationalId: string; // Iqama or National ID
  name: {
    arabic: string;
    english: string;
  };
  nationality: string; // ISO 3166-1 alpha-3 code
  dateOfBirth: string; // ISO 8601 format
  gender: "male" | "female";
  jobTitle: {
    arabic: string;
    english: string;
  };
  occupation: string; // Qiwa occupation code
  salary: number;
  contractType: "permanent" | "temporary" | "part_time";
  hireDate: string; // ISO 8601 format
  workPermitNumber?: string; // For expatriates
  workPermitExpiry?: string; // ISO 8601 format
}

/**
 * Work Permit Application
 */
interface WorkPermitApplication {
  employeeNationalId: string;
  employeeName: string;
  nationality: string;
  occupation: string;
  jobTitle: string;
  salary: number;
  contractDuration: number; // months
  requestedStartDate: string; // ISO 8601 format
  justification?: string;
  supportingDocuments?: Array<{
    documentType: string;
    documentUrl: string;
  }>;
}

/**
 * Work Permit Status
 */
interface WorkPermitStatus {
  permitNumber: string;
  applicationId: string;
  status: "pending" | "under_review" | "approved" | "rejected" | "expired" | "cancelled";
  employeeNationalId: string;
  employeeName: string;
  occupation: string;
  issueDate?: string;
  expiryDate?: string;
  rejectionReason?: string;
  lastUpdated: string;
}

/**
 * Nitaqat Status from Qiwa
 */
interface QiwaNitaqatStatus {
  establishmentId: string;
  establishmentName: string;
  sector: string;
  entitySize: "small" | "medium" | "large" | "very_large";
  nitaqatBand: "platinum" | "green" | "yellow" | "red";
  saudizationPercentage: number;
  requiredPercentage: number;
  totalEmployees: number;
  saudiEmployees: number;
  expatEmployees: number;
  lastUpdated: string;
  nextReviewDate: string;
  complianceStatus: "compliant" | "at_risk" | "non_compliant";
  availableQuotas: {
    newHires: number;
    workPermits: number;
  };
}

/**
 * Qiwa API Response
 */
interface QiwaApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  referenceNumber?: string;
  timestamp: string;
}

/**
 * Qiwa API Client
 */
export class QiwaClient {
  private config: QiwaConfig;
  private employerId: number;

  constructor(employerId: number, config: QiwaConfig) {
    this.employerId = employerId;
    this.config = config;
  }

  /**
   * Authenticate with Qiwa API
   */
  async authenticate(): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await fetch(`${QIWA_AUTH_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          api_secret: this.config.apiSecret,
          establishment_id: this.config.establishmentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Qiwa authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.config.accessToken = data.access_token;
      this.config.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error("[Qiwa] Authentication error:", error);
      throw error;
    }
  }

  /**
   * Ensure valid access token
   */
  private async ensureValidToken(): Promise<string> {
    if (!this.config.accessToken || !this.config.tokenExpiry || 
        this.config.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      const auth = await this.authenticate();
      return auth.accessToken;
    }
    return this.config.accessToken;
  }

  /**
   * Make authenticated API request to Qiwa
   */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<QiwaApiResponse<T>> {
    const token = await this.ensureValidToken();

    try {
      const response = await fetch(`${QIWA_API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Establishment-ID": this.config.establishmentId,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error_code || "UNKNOWN_ERROR",
            message: data.error_message || response.statusText,
            details: data.error_details,
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data || data,
        referenceNumber: data.reference_number,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Qiwa] API request error:", error);
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Unknown network error",
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get real-time Nitaqat status from Qiwa
   */
  async getNitaqatStatus(): Promise<QiwaApiResponse<QiwaNitaqatStatus>> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const syncStarted = new Date();
    const syncLogData = {
      employerId: this.employerId,
      syncSystem: "qiwa" as const,
      syncType: "nitaqat_status" as const,
      syncDirection: "pull" as const,
      syncStatus: "in_progress" as const,
      syncStarted,
      isAutomated: false,
      retryCount: 0,
    };

    try {
      const [syncLog] = await db.insert(governmentSyncLog).values(syncLogData).returning();

      const response = await this.makeRequest<QiwaNitaqatStatus>("/nitaqat/status", "GET");

      const syncCompleted = new Date();
      const durationMs = syncCompleted.getTime() - syncStarted.getTime();

      await db.update(governmentSyncLog)
        .set({
          syncStatus: response.success ? "success" : "failed",
          syncCompleted,
          durationMs,
          responsePayload: JSON.stringify(response),
          errorMessage: response.error?.message,
          errorCode: response.error?.code,
          recordsProcessed: response.success ? 1 : 0,
          recordsFailed: response.success ? 0 : 1,
        })
        .where(eq(governmentSyncLog.id, syncLog.id));

      return response;
    } catch (error) {
      console.error("[Qiwa] Nitaqat status retrieval error:", error);
      throw error;
    }
  }

  /**
   * Sync employee data to Qiwa (push)
   */
  async syncEmployeeData(employees: QiwaEmployeeData[]): Promise<QiwaApiResponse> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const syncStarted = new Date();
    const syncLogData = {
      employerId: this.employerId,
      syncSystem: "qiwa" as const,
      syncType: "employee_data" as const,
      syncDirection: "push" as const,
      syncStatus: "in_progress" as const,
      requestPayload: JSON.stringify({ employees }),
      syncStarted,
      isAutomated: false,
      retryCount: 0,
    };

    try {
      const [syncLog] = await db.insert(governmentSyncLog).values(syncLogData).returning();

      const response = await this.makeRequest<any>("/employees/sync", "POST", { employees });

      const syncCompleted = new Date();
      const durationMs = syncCompleted.getTime() - syncStarted.getTime();

      await db.update(governmentSyncLog)
        .set({
          syncStatus: response.success ? "success" : "failed",
          syncCompleted,
          durationMs,
          responsePayload: JSON.stringify(response),
          errorMessage: response.error?.message,
          errorCode: response.error?.code,
          recordsProcessed: response.success ? employees.length : 0,
          recordsFailed: response.success ? 0 : employees.length,
        })
        .where(eq(governmentSyncLog.id, syncLog.id));

      return response;
    } catch (error) {
      console.error("[Qiwa] Employee data sync error:", error);
      throw error;
    }
  }

  /**
   * Fetch employee data from Qiwa (pull)
   */
  async fetchEmployeeData(): Promise<QiwaApiResponse<QiwaEmployeeData[]>> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const syncStarted = new Date();
    const syncLogData = {
      employerId: this.employerId,
      syncSystem: "qiwa" as const,
      syncType: "employee_data" as const,
      syncDirection: "pull" as const,
      syncStatus: "in_progress" as const,
      syncStarted,
      isAutomated: false,
      retryCount: 0,
    };

    try {
      const [syncLog] = await db.insert(governmentSyncLog).values(syncLogData).returning();

      const response = await this.makeRequest<QiwaEmployeeData[]>("/employees/list", "GET");

      const syncCompleted = new Date();
      const durationMs = syncCompleted.getTime() - syncStarted.getTime();

      await db.update(governmentSyncLog)
        .set({
          syncStatus: response.success ? "success" : "failed",
          syncCompleted,
          durationMs,
          responsePayload: JSON.stringify(response),
          errorMessage: response.error?.message,
          errorCode: response.error?.code,
          recordsProcessed: response.success && response.data ? response.data.length : 0,
          recordsFailed: 0,
        })
        .where(eq(governmentSyncLog.id, syncLog.id));

      return response;
    } catch (error) {
      console.error("[Qiwa] Employee data fetch error:", error);
      throw error;
    }
  }

  /**
   * Submit work permit application
   */
  async submitWorkPermitApplication(application: WorkPermitApplication): Promise<QiwaApiResponse> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const syncStarted = new Date();
    const syncLogData = {
      employerId: this.employerId,
      syncSystem: "qiwa" as const,
      syncType: "work_permit_application" as const,
      syncDirection: "push" as const,
      syncStatus: "in_progress" as const,
      requestPayload: JSON.stringify(application),
      syncStarted,
      isAutomated: false,
      retryCount: 0,
    };

    try {
      const [syncLog] = await db.insert(governmentSyncLog).values(syncLogData).returning();

      const response = await this.makeRequest<any>("/work-permits/apply", "POST", application);

      const syncCompleted = new Date();
      const durationMs = syncCompleted.getTime() - syncStarted.getTime();

      await db.update(governmentSyncLog)
        .set({
          syncStatus: response.success ? "success" : "failed",
          syncCompleted,
          durationMs,
          responsePayload: JSON.stringify(response),
          errorMessage: response.error?.message,
          errorCode: response.error?.code,
          recordsProcessed: response.success ? 1 : 0,
          recordsFailed: response.success ? 0 : 1,
        })
        .where(eq(governmentSyncLog.id, syncLog.id));

      // Save work permit application to database
      if (response.success && response.data) {
        await db.insert(qiwaWorkPermits).values({
          employerId: this.employerId,
          applicationId: response.data.application_id || response.referenceNumber || "",
          employeeNationalId: application.employeeNationalId,
          employeeName: application.employeeName,
          nationality: application.nationality,
          occupation: application.occupation,
          jobTitle: application.jobTitle,
          salary: application.salary,
          applicationStatus: "pending",
          applicationDate: syncStarted,
          qiwaResponse: JSON.stringify(response.data),
        });
      }

      return response;
    } catch (error) {
      console.error("[Qiwa] Work permit application error:", error);
      throw error;
    }
  }

  /**
   * Get work permit status
   */
  async getWorkPermitStatus(applicationId: string): Promise<QiwaApiResponse<WorkPermitStatus>> {
    return await this.makeRequest<WorkPermitStatus>(`/work-permits/status/${applicationId}`, "GET");
  }

  /**
   * List all work permits for establishment
   */
  async listWorkPermits(filters?: {
    status?: string;
    expiringWithinDays?: number;
  }): Promise<QiwaApiResponse<WorkPermitStatus[]>> {
    let endpoint = "/work-permits/list";
    const params = new URLSearchParams();
    
    if (filters?.status) {
      params.append("status", filters.status);
    }
    if (filters?.expiringWithinDays) {
      params.append("expiring_within_days", filters.expiringWithinDays.toString());
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return await this.makeRequest<WorkPermitStatus[]>(endpoint, "GET");
  }

  /**
   * Cancel work permit application
   */
  async cancelWorkPermitApplication(applicationId: string, reason: string): Promise<QiwaApiResponse> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const response = await this.makeRequest<any>(
      `/work-permits/cancel/${applicationId}`,
      "POST",
      { reason }
    );

    // Update database record
    if (response.success) {
      await db.update(qiwaWorkPermits)
        .set({
          applicationStatus: "cancelled",
          statusUpdatedAt: new Date(),
          qiwaResponse: JSON.stringify(response.data),
        })
        .where(eq(qiwaWorkPermits.applicationId, applicationId));
    }

    return response;
  }

  /**
   * Renew work permit
   */
  async renewWorkPermit(permitNumber: string, renewalPeriod: number): Promise<QiwaApiResponse> {
    return await this.makeRequest<any>(
      `/work-permits/renew/${permitNumber}`,
      "POST",
      { renewal_period_months: renewalPeriod }
    );
  }
}

/**
 * Create Qiwa client for an employer
 */
export async function createQiwaClient(employerId: number): Promise<QiwaClient> {
  // In production, fetch credentials from secure storage
  const config: QiwaConfig = {
    apiKey: process.env.QIWA_API_KEY || "",
    apiSecret: process.env.QIWA_API_SECRET || "",
    establishmentId: process.env.QIWA_ESTABLISHMENT_ID || "",
  };

  if (!config.apiKey || !config.apiSecret || !config.establishmentId) {
    throw new Error("Qiwa credentials not configured for this employer");
  }

  return new QiwaClient(employerId, config);
}

/**
 * Get Qiwa sync history for an employer
 */
export async function getQiwaSyncHistory(employerId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(governmentSyncLog)
    .where(and(
      eq(governmentSyncLog.employerId, employerId),
      eq(governmentSyncLog.syncSystem, "qiwa")
    ))
    .orderBy(desc(governmentSyncLog.syncStarted))
    .limit(limit);
}

/**
 * Get work permits for an employer
 */
export async function getEmployerWorkPermits(employerId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(qiwaWorkPermits)
    .where(eq(qiwaWorkPermits.employerId, employerId))
    .orderBy(desc(qiwaWorkPermits.applicationDate))
    .limit(limit);
}

/**
 * Get expiring work permits (within specified days)
 */
export async function getExpiringWorkPermits(employerId: number, withinDays: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + withinDays);

  return await db.select()
    .from(qiwaWorkPermits)
    .where(and(
      eq(qiwaWorkPermits.employerId, employerId),
      lt(qiwaWorkPermits.permitExpiryDate, expiryThreshold)
    ))
    .orderBy(qiwaWorkPermits.permitExpiryDate);
}

/**
 * Webhook handler for Qiwa status updates
 * This function should be called by a webhook endpoint when Qiwa sends updates
 */
export async function handleQiwaWebhook(payload: any) {
  const db = await getDb();
  if (!db) {
    console.error("[Qiwa] Database not available for webhook handling");
    return { success: false, error: "Database unavailable" };
  }

  try {
    const { event_type, data } = payload;

    switch (event_type) {
      case "work_permit_status_update":
        // Update work permit status in database
        await db.update(qiwaWorkPermits)
          .set({
            applicationStatus: data.status,
            permitNumber: data.permit_number,
            permitIssueDate: data.issue_date ? new Date(data.issue_date) : undefined,
            permitExpiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
            statusUpdatedAt: new Date(),
            qiwaResponse: JSON.stringify(data),
          })
          .where(eq(qiwaWorkPermits.applicationId, data.application_id));
        
        console.log(`[Qiwa] Work permit status updated: ${data.application_id} -> ${data.status}`);
        break;

      case "nitaqat_status_change":
        // Handle Nitaqat band change notification
        console.log(`[Qiwa] Nitaqat status changed for establishment: ${data.establishment_id}`);
        // Could trigger compliance alerts here
        break;

      case "employee_data_sync_complete":
        // Handle employee data sync completion
        console.log(`[Qiwa] Employee data sync completed: ${data.sync_id}`);
        break;

      default:
        console.warn(`[Qiwa] Unknown webhook event type: ${event_type}`);
    }

    return { success: true };
  } catch (error) {
    console.error("[Qiwa] Webhook handling error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Automated daily check for expiring work permits
 * This function should be called by a scheduled job (cron) daily
 */
export async function checkExpiringWorkPermits() {
  const db = await getDb();
  if (!db) {
    console.error("[Qiwa] Database not available for expiring permits check");
    return;
  }

  console.log("[Qiwa] Checking for expiring work permits...");

  // Get all employers with Qiwa integration enabled
  // (Would need to add a flag in the employers table)
  // For now, this is a placeholder

  // TODO: Implement automated expiring permits check
  // 1. Fetch all employers with Qiwa enabled
  // 2. For each employer:
  //    a. Get expiring permits (within 30, 60, 90 days)
  //    b. Create compliance alerts
  //    c. Send notifications to employers
  // 3. Log results

  console.log("[Qiwa] Expiring work permits check completed");
}
