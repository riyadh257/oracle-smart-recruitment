import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createEmployee,
  getEmployeesByEmployer,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  createVisaCompliance,
  getVisaComplianceByEmployee,
  getExpiringDocuments,
  updateVisaComplianceStatus,
  updateComplianceStatuses,
  getActiveAlerts,
  acknowledgeAlert,
  dismissAlert,
  getWhatsappSettings,
  upsertWhatsappSettings,
  getWhatsappLogs,
  getComplianceAnalytics,
  getComplianceTrends,
} from "../visaComplianceDb";
import {
  sendWhatsAppMessage,
  formatComplianceSummary,
  formatCriticalAlert,
} from "../whatsappService";
import {
  parseCSV,
  parseExcel,
  importEmployees,
  generateImportTemplate,
} from "../employeeImportService";
import {
  generateReportData,
  generatePDFReport,
  generateExcelReport,
} from "../complianceReportService";
import { requirePermission } from "../complianceRbac";

export const visaComplianceRouter = router({
  // ============================================
  // EMPLOYEE PROCEDURES
  // ============================================
  
  employees: router({
    create: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        nationality: z.string().optional(),
        jobTitle: z.string().optional(),
        department: z.string().optional(),
        employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'suspended']).optional(),
        hireDate: z.string().optional(),
        isSaudiNational: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createEmployee(input);
      }),
    
    list: protectedProcedure
      .input(z.object({
        employerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getEmployeesByEmployer(input.employerId);
      }),
    
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        return await getEmployeeById(input.id);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          phoneNumber: z.string().optional(),
          nationality: z.string().optional(),
          jobTitle: z.string().optional(),
          department: z.string().optional(),
          employmentStatus: z.enum(['active', 'on_leave', 'terminated', 'suspended']).optional(),
          terminationDate: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await updateEmployee(input.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await deleteEmployee(input.id);
        return { success: true };
      }),
  }),
  
  // ============================================
  // VISA COMPLIANCE PROCEDURES
  // ============================================
  
  compliance: router({
    create: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
        documentType: z.enum(['visa', 'work_permit', 'iqama', 'passport']),
        documentNumber: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: z.string(),
        renewalStatus: z.enum(['not_started', 'in_progress', 'completed', 'rejected']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createVisaCompliance(input);
      }),
    
    getByEmployee: protectedProcedure
      .input(z.object({
        employeeId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getVisaComplianceByEmployee(input.employeeId);
      }),
    
    getExpiring: protectedProcedure
      .input(z.object({
        daysThreshold: z.number().default(30),
      }))
      .query(async ({ input }) => {
        return await getExpiringDocuments(input.daysThreshold);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(['valid', 'expiring_soon', 'expired', 'pending_renewal']).optional(),
          renewalStatus: z.enum(['not_started', 'in_progress', 'completed', 'rejected']).optional(),
          reminderSent: z.number().optional(),
          lastReminderDate: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await updateVisaComplianceStatus(input.id, input.data);
        return { success: true };
      }),
    
    updateAllStatuses: protectedProcedure
      .mutation(async () => {
        await updateComplianceStatuses();
        return { success: true };
      }),
  }),
  
  // ============================================
  // ALERTS PROCEDURES
  // ============================================
  
  alerts: router({
    getActive: protectedProcedure
      .query(async () => {
        return await getActiveAlerts();
      }),
    
    acknowledge: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await acknowledgeAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),
    
    dismiss: protectedProcedure
      .input(z.object({
        alertId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await dismissAlert(input.alertId, ctx.user.id);
        return { success: true };
      }),
  }),
  
  // ============================================
  // WHATSAPP PROCEDURES
  // ============================================
  
  whatsapp: router({
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        return await getWhatsappSettings(ctx.user.id);
      }),
    
    updateSettings: protectedProcedure
      .input(z.object({
        phoneNumber: z.string(),
        countryCode: z.string().optional(),
        enableDailySummary: z.number().optional(),
        enableCriticalAlerts: z.number().optional(),
        enableWeeklyReports: z.number().optional(),
        dailySummaryTime: z.string().optional(),
        weeklyReportDay: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertWhatsappSettings(ctx.user.id, input);
        return { success: true };
      }),
    
    sendTestMessage: protectedProcedure
      .mutation(async ({ ctx }) => {
        const settings = await getWhatsappSettings(ctx.user.id);
        
        if (!settings || !settings.phoneNumber) {
          throw new Error("WhatsApp settings not configured");
        }
        
        const result = await sendWhatsAppMessage({
          to: settings.phoneNumber,
          message: "✅ Test message from Oracle Smart Recruitment System. Your WhatsApp notifications are working correctly!",
          messageType: 'test_message',
          userId: ctx.user.id,
        });
        
        return result;
      }),
    
    getLogs: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return await getWhatsappLogs(ctx.user.id, input.limit);
      }),
  }),
  
  // ============================================
  // ANALYTICS PROCEDURES
  // ============================================
  
  analytics: router({
    getOverview: protectedProcedure
      .input(z.object({
        employerId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getComplianceAnalytics(input.employerId);
      }),
    
    getTrends: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        days: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await getComplianceTrends(input.employerId, input.days);
      }),
  }),
  
  // ============================================
  // IMPORT/EXPORT PROCEDURES
  // ============================================
  
  import: router({
    uploadCSV: protectedProcedure
      .input(z.object({
        fileContent: z.string(),
        employerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        requirePermission(ctx, 'canImportData');
        
        const data = parseCSV(input.fileContent);
        const result = await importEmployees(data, input.employerId);
        return result;
      }),
    
    uploadExcel: protectedProcedure
      .input(z.object({
        fileBuffer: z.string(), // Base64 encoded
        employerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        requirePermission(ctx, 'canImportData');
        
        const buffer = Buffer.from(input.fileBuffer, 'base64');
        const data = parseExcel(buffer);
        const result = await importEmployees(data, input.employerId);
        return result;
      }),
    
    getTemplate: protectedProcedure
      .query(() => {
        return generateImportTemplate();
      }),
  }),
  
  export: router({
    generatePDF: protectedProcedure
      .input(z.object({
        employerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        requirePermission(ctx, 'canExportReports');
        
        const reportData = await generateReportData(input.employerId);
        const pdfBuffer = await generatePDFReport(reportData);
        return {
          data: pdfBuffer.toString('base64'),
          filename: `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
    
    generateExcel: protectedProcedure
      .input(z.object({
        employerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        requirePermission(ctx, 'canExportReports');
        
        const reportData = await generateReportData(input.employerId);
        const excelBuffer = await generateExcelReport(reportData);
        return {
          data: excelBuffer.toString('base64'),
          filename: `compliance-report-${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      }),
  }),
  
  // ============================================
  // ROLE MANAGEMENT PROCEDURES
  // ============================================
  
  roles: router({
    getMyPermissions: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserPermissions } = await import('../complianceRbac');
        return getUserPermissions(ctx);
      }),
  }),
});
