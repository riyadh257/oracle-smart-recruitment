import { z } from "zod";
import { eq, desc, and, inArray } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  bulkOperations, 
  bulkOperationItems,
  candidates,
  applications,
  interviews
} from "../drizzle/schema";

/**
 * Bulk Operations Router
 * 
 * Provides procedures for bulk operations on candidates, applications, and interviews:
 * - Create bulk operations (status updates, notifications, exports)
 * - Track operation progress
 * - Cancel running operations
 * - Get operation history and results
 */

export const bulkOperationsRouter = router({
  /**
   * Get list of bulk operations
   */
  getBulkOperations: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
      operationType: z.enum([
        'status_update',
        'send_notification',
        'schedule_interview',
        'export_data',
        'enrich_profiles',
        'send_email_campaign'
      ]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      let query = db
        .select()
        .from(bulkOperations)
        .where(eq(bulkOperations.userId, ctx.user.id))
        .orderBy(desc(bulkOperations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Apply filters
      const conditions = [eq(bulkOperations.userId, ctx.user.id)];
      
      if (input.status) {
        conditions.push(eq(bulkOperations.status, input.status));
      }
      
      if (input.operationType) {
        conditions.push(eq(bulkOperations.operationType, input.operationType));
      }

      if (conditions.length > 1) {
        query = db
          .select()
          .from(bulkOperations)
          .where(and(...conditions))
          .orderBy(desc(bulkOperations.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }

      const operations = await query;

      return {
        operations,
        total: operations.length,
      };
    }),

  /**
   * Create a new bulk operation
   */
  createBulkOperation: protectedProcedure
    .input(z.object({
      operationType: z.enum([
        'status_update',
        'send_notification',
        'schedule_interview',
        'export_data',
        'enrich_profiles',
        'send_email_campaign'
      ]),
      targetIds: z.array(z.number()),
      targetType: z.enum(['candidate', 'application', 'interview', 'job']),
      operationParams: z.record(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create bulk operation
      const [operation] = await db.insert(bulkOperations).values({
        userId: ctx.user.id,
        operationType: input.operationType,
        status: 'pending',
        targetCount: input.targetIds.length,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        targetCriteria: { targetIds: input.targetIds, targetType: input.targetType },
        operationParams: input.operationParams,
      }).$returningId();

      // Create operation items
      const items = input.targetIds.map(targetId => ({
        operationId: operation.id,
        targetId,
        targetType: input.targetType,
        status: 'pending' as const,
      }));

      await db.insert(bulkOperationItems).values(items);

      // Start processing in background (async)
      processBulkOperation(operation.id, input.operationType, input.operationParams).catch(
        error => console.error('Bulk operation processing error:', error)
      );

      return {
        success: true,
        operationId: operation.id,
        targetCount: input.targetIds.length,
      };
    }),

  /**
   * Get bulk operation details
   */
  getBulkOperationDetails: protectedProcedure
    .input(z.object({
      operationId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [operation] = await db
        .select()
        .from(bulkOperations)
        .where(
          and(
            eq(bulkOperations.id, input.operationId),
            eq(bulkOperations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!operation) {
        throw new Error("Operation not found");
      }

      const items = await db
        .select()
        .from(bulkOperationItems)
        .where(eq(bulkOperationItems.operationId, input.operationId))
        .limit(100);

      return {
        operation,
        items,
      };
    }),

  /**
   * Cancel a bulk operation
   */
  cancelBulkOperation: protectedProcedure
    .input(z.object({
      operationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [operation] = await db
        .select()
        .from(bulkOperations)
        .where(
          and(
            eq(bulkOperations.id, input.operationId),
            eq(bulkOperations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!operation) {
        throw new Error("Operation not found");
      }

      if (operation.status === 'completed' || operation.status === 'cancelled') {
        throw new Error("Operation cannot be cancelled");
      }

      await db.update(bulkOperations)
        .set({
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: ctx.user.id,
        })
        .where(eq(bulkOperations.id, input.operationId));

      // Cancel pending items
      await db.update(bulkOperationItems)
        .set({
          status: 'skipped',
        })
        .where(
          and(
            eq(bulkOperationItems.operationId, input.operationId),
            eq(bulkOperationItems.status, 'pending')
          )
        );

      return {
        success: true,
        operationId: input.operationId,
      };
    }),

  /**
   * Get bulk operation statistics
   */
  getBulkOperationStats: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const operations = await db
        .select()
        .from(bulkOperations)
        .where(eq(bulkOperations.userId, ctx.user.id));

      const totalOperations = operations.length;
      const completedOperations = operations.filter(op => op.status === 'completed').length;
      const failedOperations = operations.filter(op => op.status === 'failed').length;
      const cancelledOperations = operations.filter(op => op.status === 'cancelled').length;

      const totalItemsProcessed = operations.reduce((sum, op) => sum + (op.processedCount || 0), 0);
      const totalItemsSuccess = operations.reduce((sum, op) => sum + (op.successCount || 0), 0);
      const totalItemsFailed = operations.reduce((sum, op) => sum + (op.failedCount || 0), 0);

      const processingTimes = operations
        .filter(op => op.processingTime)
        .map(op => op.processingTime!);
      const averageProcessingTime = processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

      return {
        totalOperations,
        completedOperations,
        failedOperations,
        cancelledOperations,
        successRate: totalOperations > 0 
          ? Math.round((completedOperations / totalOperations) * 100) 
          : 0,
        totalItemsProcessed,
        totalItemsSuccess,
        totalItemsFailed,
        itemSuccessRate: totalItemsProcessed > 0
          ? Math.round((totalItemsSuccess / totalItemsProcessed) * 100)
          : 0,
        averageProcessingTime,
      };
    }),
});

/**
 * Process bulk operation in background
 */
async function processBulkOperation(
  operationId: number,
  operationType: string,
  operationParams: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const startTime = Date.now();

  try {
    // Update operation status to processing
    await db.update(bulkOperations)
      .set({
        status: 'processing',
        startedAt: new Date().toISOString(),
      })
      .where(eq(bulkOperations.id, operationId));

    // Get operation items
    const items = await db
      .select()
      .from(bulkOperationItems)
      .where(eq(bulkOperationItems.operationId, operationId));

    let successCount = 0;
    let failedCount = 0;

    // Process each item
    for (const item of items) {
      try {
        // Check if operation is cancelled
        const [operation] = await db
          .select()
          .from(bulkOperations)
          .where(eq(bulkOperations.id, operationId))
          .limit(1);

        if (operation?.status === 'cancelled') {
          break;
        }

        // Update item status
        await db.update(bulkOperationItems)
          .set({
            status: 'processing',
          })
          .where(eq(bulkOperationItems.id, item.id));

        // Process based on operation type
        await processOperationItem(item, operationType, operationParams);

        // Update item as completed
        await db.update(bulkOperationItems)
          .set({
            status: 'completed',
            processedAt: new Date().toISOString(),
          })
          .where(eq(bulkOperationItems.id, item.id));

        successCount++;

      } catch (error) {
        // Update item as failed
        await db.update(bulkOperationItems)
          .set({
            status: 'failed',
            processedAt: new Date().toISOString(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(bulkOperationItems.id, item.id));

        failedCount++;
      }

      // Update operation progress
      await db.update(bulkOperations)
        .set({
          processedCount: successCount + failedCount,
          successCount,
          failedCount,
        })
        .where(eq(bulkOperations.id, operationId));
    }

    // Update operation as completed
    const processingTime = Date.now() - startTime;
    await db.update(bulkOperations)
      .set({
        status: 'completed',
        completedAt: new Date().toISOString(),
        processingTime,
        resultsSummary: {
          successCount,
          failedCount,
          totalProcessed: successCount + failedCount,
        },
      })
      .where(eq(bulkOperations.id, operationId));

  } catch (error) {
    // Update operation as failed
    await db.update(bulkOperations)
      .set({
        status: 'failed',
        completedAt: new Date().toISOString(),
        errorSummary: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(bulkOperations.id, operationId));
  }
}

/**
 * Process individual operation item
 */
async function processOperationItem(
  item: any,
  operationType: string,
  operationParams: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  switch (operationType) {
    case 'status_update':
      // Update candidate/application status
      if (item.targetType === 'candidate') {
        await db.update(candidates)
          .set({
            profileStatus: operationParams.newStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(candidates.id, item.targetId));
      } else if (item.targetType === 'application') {
        await db.update(applications)
          .set({
            status: operationParams.newStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(applications.id, item.targetId));
      }
      break;

    case 'send_notification':
      // Send notification (implement notification logic)
      // This would integrate with the notification system
      break;

    case 'schedule_interview':
      // Schedule interview (implement scheduling logic)
      // This would integrate with the calendar system
      break;

    case 'export_data':
      // Export data (implement export logic)
      // This would generate CSV/PDF exports
      break;

    case 'enrich_profiles':
      // Enrich profiles (implement enrichment logic)
      // This would call the profile enrichment service
      break;

    case 'send_email_campaign':
      // Send email campaign (implement email logic)
      // This would integrate with the email template system
      break;

    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}
