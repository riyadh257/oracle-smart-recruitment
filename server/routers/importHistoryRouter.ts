import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createImportRecord,
  updateImportRecord,
  getImportHistory,
  getImportById,
  getImportStatistics,
  rollbackImport,
} from "../importHistory";
import { auditDataChange } from "../auditLog";

/**
 * Import History Router
 * Handles import tracking, history viewing, and rollback operations
 */

export const importHistoryRouter = router({
  // Create a new import record
  create: protectedProcedure
    .input(
      z.object({
        importType: z.enum([
          "candidates",
          "jobs",
          "employees",
          "compliance_data",
          "feedback",
          "other",
        ]),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        recordsTotal: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await createImportRecord({
        userId: ctx.user.id,
        importType: input.importType,
        fileName: input.fileName,
        fileSize: input.fileSize,
        recordsTotal: input.recordsTotal,
        status: "pending",
        startedAt: new Date().toISOString() as any,
      });

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "import_history",
        entityId: record.id,
        action: "create",
        valueAfter: record,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return record;
    }),

  // Update import record (for tracking progress)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        recordsSuccess: z.number().optional(),
        recordsError: z.number().optional(),
        status: z
          .enum(["pending", "processing", "completed", "failed", "rolled_back"])
          .optional(),
        errorLog: z.any().optional(),
        importData: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get current record for audit
      const before = await getImportById(id);

      const updated = await updateImportRecord(id, {
        ...updateData,
        completedAt:
          updateData.status === "completed" || updateData.status === "failed"
            ? (new Date().toISOString() as any)
            : undefined,
      });

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "import_history",
        entityId: id,
        action: "update",
        valueBefore: before,
        valueAfter: updated,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return updated;
    }),

  // Get import history with filters
  list: protectedProcedure
    .input(
      z.object({
        importType: z.string().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const records = await getImportHistory({
        userId: ctx.user.id,
        importType: input.importType,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        limit: input.limit,
        offset: input.offset,
      });

      return records;
    }),

  // Get single import record by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const record = await getImportById(input.id);
      if (!record) throw new Error("Import record not found");
      return record;
    }),

  // Get import statistics
  statistics: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getImportStatistics(ctx.user.id);
    return stats;
  }),

  // Rollback an import
  rollback: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get current record for audit
      const before = await getImportById(input.id);

      const updated = await rollbackImport(input.id, ctx.user.id);

      // Log audit entry
      await auditDataChange({
        userId: ctx.user.id,
        entityType: "import_history",
        entityId: input.id,
        action: "rollback",
        valueBefore: before,
        valueAfter: updated,
        changeReason: input.reason,
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.get("user-agent"),
      });

      return updated;
    }),
});
