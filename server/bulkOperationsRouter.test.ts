import { describe, expect, it } from "vitest";
import { bulkOperationsRouter } from "./bulkOperationsRouter";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("bulkOperationsRouter", () => {
  describe("getBulkOperations", () => {
    it("should return list of bulk operations", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.getBulkOperations({
        limit: 20,
        offset: 0,
      });

      expect(result).toHaveProperty("operations");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.operations)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter by status", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const statuses = ["pending", "processing", "completed", "failed", "cancelled"] as const;

      for (const status of statuses) {
        const result = await caller.getBulkOperations({
          status,
          limit: 20,
          offset: 0,
        });

        expect(result).toHaveProperty("operations");
        expect(Array.isArray(result.operations)).toBe(true);
        
        // All returned operations should have the requested status
        for (const operation of result.operations) {
          expect(operation.status).toBe(status);
        }
      }
    });

    it("should filter by operation type", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const types = [
        "status_update",
        "send_notification",
        "schedule_interview",
        "export_data",
        "enrich_profiles",
        "send_email_campaign"
      ] as const;

      for (const operationType of types) {
        const result = await caller.getBulkOperations({
          operationType,
          limit: 20,
          offset: 0,
        });

        expect(result).toHaveProperty("operations");
        expect(Array.isArray(result.operations)).toBe(true);
      }
    });

    it("should respect limit and offset parameters", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const result = await caller.getBulkOperations({
        limit: 5,
        offset: 0,
      });

      expect(result.operations.length).toBeLessThanOrEqual(5);
    });
  });

  describe("createBulkOperation", () => {
    it("should validate input parameters", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.createBulkOperation({
          operationType: "status_update",
          targetIds: [], // Empty array should fail
          targetType: "candidate",
          operationParams: {},
        })
      ).rejects.toThrow();
    });

    it("should accept valid operation types", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const types = [
        "status_update",
        "send_notification",
        "schedule_interview",
        "export_data",
        "enrich_profiles",
        "send_email_campaign"
      ] as const;

      for (const operationType of types) {
        const result = await caller.createBulkOperation({
          operationType,
          targetIds: [1, 2, 3],
          targetType: "candidate",
          operationParams: { test: "value" },
        });

        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("operationId");
        expect(result).toHaveProperty("targetCount");
        expect(result.success).toBe(true);
        expect(result.targetCount).toBe(3);
      }
    });
  });

  describe("getBulkOperationDetails", () => {
    it("should return operation details with items", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      // First create an operation
      const created = await caller.createBulkOperation({
        operationType: "status_update",
        targetIds: [1, 2, 3],
        targetType: "candidate",
        operationParams: { newStatus: "active" },
      });

      // Then get its details
      const result = await caller.getBulkOperationDetails({
        operationId: created.operationId,
      });

      expect(result).toHaveProperty("operation");
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.operation.id).toBe(created.operationId);
    });

    it("should throw error for non-existent operation", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.getBulkOperationDetails({
          operationId: 999999,
        })
      ).rejects.toThrow("Operation not found");
    });
  });

  describe("cancelBulkOperation", () => {
    it("should cancel pending operation", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      // Create an operation
      const created = await caller.createBulkOperation({
        operationType: "status_update",
        targetIds: [1, 2, 3],
        targetType: "candidate",
        operationParams: { newStatus: "active" },
      });

      // Cancel it immediately
      const result = await caller.cancelBulkOperation({
        operationId: created.operationId,
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result.operationId).toBe(created.operationId);
    });

    it("should throw error for non-existent operation", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      await expect(
        caller.cancelBulkOperation({
          operationId: 999999,
        })
      ).rejects.toThrow("Operation not found");
    });
  });

  describe("getBulkOperationStats", () => {
    it("should return statistics for specified period", async () => {
      const { ctx } = createAuthContext();
      const caller = bulkOperationsRouter.createCaller(ctx);

      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = new Date().toISOString();

      const result = await caller.getBulkOperationStats({
        periodStart,
        periodEnd,
      });

      expect(result).toHaveProperty("totalOperations");
      expect(result).toHaveProperty("completedOperations");
      expect(result).toHaveProperty("failedOperations");
      expect(result).toHaveProperty("cancelledOperations");
      expect(result).toHaveProperty("successRate");
      expect(result).toHaveProperty("totalItemsProcessed");
      expect(result).toHaveProperty("totalItemsSuccess");
      expect(result).toHaveProperty("totalItemsFailed");
      expect(result).toHaveProperty("itemSuccessRate");
      expect(result).toHaveProperty("averageProcessingTime");

      expect(typeof result.totalOperations).toBe("number");
      expect(typeof result.successRate).toBe("number");
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });
  });
});
