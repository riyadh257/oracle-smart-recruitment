import cron from "node-cron";
import {
  updateComplianceStatuses,
  getExpiringDocuments,
  createComplianceAlert,
  getWhatsappSettings,
  getComplianceAnalytics,
} from "./visaComplianceDb";
import { sendWhatsAppMessage, formatComplianceSummary, formatCriticalAlert } from "./whatsappService";
import { autoAnalyzeTests } from "./abTestNotificationService";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { users, whatsappSettings } from "../drizzle/schema";

// ============================================
// DAILY COMPLIANCE CHECK JOB
// Runs every day at 1:00 AM
// ============================================
export function startDailyComplianceCheck() {
  cron.schedule('0 1 * * *', async () => {
    console.log('[ComplianceScheduler] Running daily compliance check...');
    
    try {
      // Update all compliance statuses
      await updateComplianceStatuses();
      
      // Get documents expiring in the next 30 days
      const expiringDocs = await getExpiringDocuments(30);
      
      // Create alerts for expiring documents
      for (const doc of expiringDocs) {
        if (!doc.compliance || !doc.employee) continue;
        
        const daysUntilExpiry = doc.compliance.daysUntilExpiry || 0;
        
        let alertType: 'expiring_30_days' | 'expiring_15_days' | 'expiring_7_days' | 'expired' | 'renewal_overdue';
        let severity: 'info' | 'warning' | 'critical';
        
        if (daysUntilExpiry <= 0) {
          alertType = 'expired';
          severity = 'critical';
        } else if (daysUntilExpiry <= 7) {
          alertType = 'expiring_7_days';
          severity = 'critical';
        } else if (daysUntilExpiry <= 15) {
          alertType = 'expiring_15_days';
          severity = 'warning';
        } else {
          alertType = 'expiring_30_days';
          severity = 'info';
        }
        
        const message = `${doc.employee.firstName} ${doc.employee.lastName}'s ${doc.compliance.documentType} ${
          daysUntilExpiry <= 0 ? 'has expired' : `expires in ${daysUntilExpiry} days`
        }`;
        
        // Create alert
        await createComplianceAlert({
          visaComplianceId: doc.compliance.id,
          alertType,
          severity,
          message,
        });
        
        // Send critical WhatsApp alerts
        if (severity === 'critical') {
          // Get all users with WhatsApp enabled
          const db = await getDb();
          if (db) {
            const allSettings = await db.select().from(whatsappSettings).where(eq(whatsappSettings.isActive, 1));
            
            for (const settings of allSettings) {
              if (settings.enableCriticalAlerts) {
                await sendWhatsAppMessage({
                  to: settings.phoneNumber,
                  message: formatCriticalAlert({
                    employeeName: `${doc.employee.firstName} ${doc.employee.lastName}`,
                    documentType: doc.compliance.documentType,
                    expiryDate: doc.compliance.expiryDate,
                    daysRemaining: daysUntilExpiry,
                  }),
                  messageType: 'critical_alert',
                  userId: settings.userId,
                });
              }
            }
          }
        }
      }
      
      console.log(`[ComplianceScheduler] Daily check complete. Processed ${expiringDocs.length} expiring documents.`);
    } catch (error) {
      console.error('[ComplianceScheduler] Error in daily compliance check:', error);
    }
  });
  
  console.log('[ComplianceScheduler] Daily compliance check job scheduled (1:00 AM daily)');
}

// ============================================
// DAILY SUMMARY NOTIFICATIONS
// Runs every hour to check for scheduled summaries
// ============================================
export function startDailySummaryNotifications() {
  cron.schedule('0 * * * *', async () => {
    const currentHour = new Date().getHours();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:00`;
    
    console.log(`[ComplianceScheduler] Checking for daily summaries at ${currentTime}...`);
    
    try {
      const db = await getDb();
      if (!db) return;
      
      // Get all active WhatsApp settings with daily summary enabled
      const allSettings = await db
        .select()
        .from(whatsappSettings)
        .where(eq(whatsappSettings.isActive, 1));
      
      for (const settings of allSettings) {
        if (!settings.enableDailySummary) continue;
        
        // Check if it's time to send the summary
        const summaryHour = settings.dailySummaryTime?.split(':')[0] || '09';
        if (summaryHour !== currentHour.toString().padStart(2, '0')) continue;
        
        // Get user's employer ID
        const [user] = await db.select().from(users).where(eq(users.id, settings.userId)).limit(1);
        if (!user) continue;
        
        // Get compliance analytics
        const analytics = await getComplianceAnalytics(1); // TODO: Get actual employer ID
        
        if (analytics) {
          await sendWhatsAppMessage({
            to: settings.phoneNumber,
            message: formatComplianceSummary(analytics),
            messageType: 'daily_summary',
            userId: settings.userId,
          });
        }
      }
      
      console.log('[ComplianceScheduler] Daily summary check complete');
    } catch (error) {
      console.error('[ComplianceScheduler] Error in daily summary notifications:', error);
    }
  });
  
  console.log('[ComplianceScheduler] Daily summary notification job scheduled (hourly check)');
}

// ============================================
// WEEKLY REPORT NOTIFICATIONS
// Runs every day at 9:00 AM to check for weekly reports
// ============================================
export function startWeeklyReportNotifications() {
  cron.schedule('0 9 * * *', async () => {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' }) as
      | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    
    console.log(`[ComplianceScheduler] Checking for weekly reports on ${dayOfWeek}...`);
    
    try {
      const db = await getDb();
      if (!db) return;
      
      // Get all active WhatsApp settings with weekly reports enabled
      const allSettings = await db
        .select()
        .from(whatsappSettings)
        .where(eq(whatsappSettings.isActive, 1));
      
      for (const settings of allSettings) {
        if (!settings.enableWeeklyReports) continue;
        if (settings.weeklyReportDay !== dayOfWeek) continue;
        
        // Get user's employer ID
        const [user] = await db.select().from(users).where(eq(users.id, settings.userId)).limit(1);
        if (!user) continue;
        
        // Get compliance analytics
        const analytics = await getComplianceAnalytics(1); // TODO: Get actual employer ID
        
        if (analytics) {
          const reportMessage = `
📊 *Weekly Compliance Report*

Week of ${today.toLocaleDateString()}

👥 Total Employees: ${analytics.totalEmployees}
✅ Valid Documents: ${analytics.validDocuments}
⚠️ Expiring Soon (30 days): ${analytics.expiringSoon}
❌ Expired Documents: ${analytics.expired}
🔄 Pending Renewals: ${analytics.pendingRenewal}

🚨 Active Alerts:
• Critical: ${analytics.criticalAlerts}
• Warning: ${analytics.warningAlerts}
• Info: ${analytics.infoAlerts}

_Oracle Smart Recruitment System_
`.trim();
          
          await sendWhatsAppMessage({
            to: settings.phoneNumber,
            message: reportMessage,
            messageType: 'weekly_report',
            userId: settings.userId,
          });
        }
      }
      
      console.log('[ComplianceScheduler] Weekly report check complete');
    } catch (error) {
      console.error('[ComplianceScheduler] Error in weekly report notifications:', error);
    }
  });
  
  console.log('[ComplianceScheduler] Weekly report notification job scheduled (9:00 AM daily)');
}

// ============================================
// A/B TEST AUTO-ANALYSIS JOB
// Runs every 6 hours to check for A/B test winners
// ============================================
export function startAbTestAutoAnalysis() {
  cron.schedule('0 */6 * * *', async () => {
    console.log('[A/B Test Scheduler] Running automatic A/B test analysis...');
    
    try {
      const result = await autoAnalyzeTests();
      console.log(`[A/B Test Scheduler] Analysis complete. Analyzed: ${result.analyzed}, Winners: ${result.winnersFound}, Notifications: ${result.notificationsSent}`);
    } catch (error) {
      console.error('[A/B Test Scheduler] Error in auto-analysis:', error);
    }
  });
  
  console.log('[A/B Test Scheduler] Auto-analysis job scheduled (every 6 hours)');
}

// ============================================
// INITIALIZE ALL COMPLIANCE JOBS
// ============================================
export function initializeComplianceScheduler() {
  console.log('[ComplianceScheduler] Initializing compliance scheduler...');
  
  startDailyComplianceCheck();
  startDailySummaryNotifications();
  startWeeklyReportNotifications();
  startAbTestAutoAnalysis();
  
  console.log('[ComplianceScheduler] All compliance jobs initialized successfully');
}
