import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getAuditLogs,
  getAuditLogById,
  getEntityHistory,
  exportAuditLogsToCSV,
} from "../auditLog";

/**
 * Audit Log Router
 * Provides access to compliance audit trail for regulatory requirements
 */

export const auditLogRouter = router({
  // Get audit logs with filters
  list: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        searchTerm: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const logs = await getAuditLogs({
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        startDate: input.startDate,
        endDate: input.endDate,
        searchTerm: input.searchTerm,
        limit: input.limit,
        offset: input.offset,
      });

      return logs;
    }),

  // Get single audit log entry by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const log = await getAuditLogById(input.id);
      if (!log) throw new Error("Audit log entry not found");
      return log;
    }),

  // Get complete history for a specific entity
  entityHistory: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const history = await getEntityHistory(input.entityType, input.entityId);
      return history;
    }),

  // Export audit logs to CSV
  exportCSV: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        action: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const logs = await getAuditLogs({
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: 10000, // Export all matching records
      });

      const csv = exportAuditLogsToCSV(logs);

      return {
        csv,
        filename: `audit_log_${new Date().toISOString().split("T")[0]}.csv`,
        recordCount: logs.length,
      };
    }),

  // Get audit statistics
  statistics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const logs = await getAuditLogs({
        startDate: input.startDate,
        endDate: input.endDate,
        limit: 100000,
      });

      // Calculate statistics
      const stats = {
        totalEntries: logs.length,
        byEntityType: {} as Record<string, number>,
        byAction: {} as Record<string, number>,
        byUser: {} as Record<number, number>,
      };

      logs.forEach((log) => {
        // Count by entity type
        stats.byEntityType[log.entityType] =
          (stats.byEntityType[log.entityType] || 0) + 1;

        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

        // Count by user
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      });

      return stats;
    }),
});
