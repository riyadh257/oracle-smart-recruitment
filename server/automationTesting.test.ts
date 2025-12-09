import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Automation Testing", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;
  let scenarioId: number;
  let triggerId: number;
  let campaignId: number;
  let executionId: number;

  beforeAll(() => {
    ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Test Scenarios", () => {
    it("should create a test scenario", async () => {
      const result = await caller.automationTesting.scenarios.create({
        name: "Test Candidate Application Flow",
        description: "Tests the complete candidate application workflow",
        scenarioType: "candidate_application",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
      scenarioId = result.id;
    });

    it("should list test scenarios", async () => {
      const scenarios = await caller.automationTesting.scenarios.list();

      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBeGreaterThan(0);
      
      const createdScenario = scenarios.find(s => s.id === scenarioId);
      expect(createdScenario).toBeDefined();
      expect(createdScenario?.name).toBe("Test Candidate Application Flow");
    });

    it("should get scenario by id", async () => {
      const scenario = await caller.automationTesting.scenarios.getById({
        id: scenarioId,
      });

      expect(scenario).toBeDefined();
      expect(scenario.id).toBe(scenarioId);
      expect(scenario.name).toBe("Test Candidate Application Flow");
      expect(scenario.scenarioType).toBe("candidate_application");
    });

    it("should update a test scenario", async () => {
      const result = await caller.automationTesting.scenarios.update({
        id: scenarioId,
        name: "Updated Test Scenario",
        isActive: false,
      });

      expect(result.success).toBe(true);

      const updated = await caller.automationTesting.scenarios.getById({
        id: scenarioId,
      });
      expect(updated.name).toBe("Updated Test Scenario");
      expect(updated.isActive).toBe(false);
    });
  });

  describe("Test Triggers", () => {
    it("should create a test trigger", async () => {
      const result = await caller.automationTesting.triggers.create({
        scenarioId,
        name: "Application Submitted Trigger",
        triggerType: "application_submitted",
        delayMinutes: 0,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
      triggerId = result.id;
    });

    it("should list triggers by scenario", async () => {
      const triggers = await caller.automationTesting.triggers.listByScenario({
        scenarioId,
      });

      expect(Array.isArray(triggers)).toBe(true);
      expect(triggers.length).toBeGreaterThan(0);
      
      const createdTrigger = triggers.find(t => t.id === triggerId);
      expect(createdTrigger).toBeDefined();
      expect(createdTrigger?.name).toBe("Application Submitted Trigger");
    });

    it("should update a test trigger", async () => {
      const result = await caller.automationTesting.triggers.update({
        id: triggerId,
        name: "Updated Trigger",
        delayMinutes: 5,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Test Campaigns", () => {
    it("should create a test campaign", async () => {
      const result = await caller.automationTesting.campaigns.create({
        scenarioId,
        name: "Welcome Email Campaign",
        campaignType: "email",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
      campaignId = result.id;
    });

    it("should list campaigns by scenario", async () => {
      const campaigns = await caller.automationTesting.campaigns.listByScenario({
        scenarioId,
      });

      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThan(0);
      
      const createdCampaign = campaigns.find(c => c.id === campaignId);
      expect(createdCampaign).toBeDefined();
      expect(createdCampaign?.name).toBe("Welcome Email Campaign");
    });

    it("should update a test campaign", async () => {
      const result = await caller.automationTesting.campaigns.update({
        id: campaignId,
        name: "Updated Campaign",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Test Executions", () => {
    it("should create a test execution", async () => {
      const result = await caller.automationTesting.executions.create({
        scenarioId,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
      executionId = result.id;
    });

    it("should list executions by scenario", async () => {
      const executions = await caller.automationTesting.executions.listByScenario({
        scenarioId,
      });

      expect(Array.isArray(executions)).toBe(true);
      expect(executions.length).toBeGreaterThan(0);
      
      const createdExecution = executions.find(e => e.id === executionId);
      expect(createdExecution).toBeDefined();
      expect(createdExecution?.status).toBe("pending");
    });

    it("should get execution by id", async () => {
      const execution = await caller.automationTesting.executions.getById({
        id: executionId,
      });

      expect(execution).toBeDefined();
      expect(execution.id).toBe(executionId);
      expect(execution.scenarioId).toBe(scenarioId);
    });

    it("should update execution status", async () => {
      const result = await caller.automationTesting.executions.updateStatus({
        id: executionId,
        status: "running",
        startedAt: new Date(),
      });

      expect(result.success).toBe(true);

      const updated = await caller.automationTesting.executions.getById({
        id: executionId,
      });
      expect(updated.status).toBe("running");
      expect(updated.startedAt).toBeDefined();
    });

    it("should update execution metrics", async () => {
      const result = await caller.automationTesting.executions.updateMetrics({
        id: executionId,
        sampleDataGenerated: true,
        testCandidatesCount: 5,
        testJobsCount: 3,
        testApplicationsCount: 10,
        triggersExecuted: 1,
        campaignsExecuted: 1,
      });

      expect(result.success).toBe(true);

      const updated = await caller.automationTesting.executions.getById({
        id: executionId,
      });
      expect(updated.sampleDataGenerated).toBe(true);
      expect(updated.testCandidatesCount).toBe(5);
      expect(updated.testJobsCount).toBe(3);
    });
  });

  describe("Test Data Tracking", () => {
    it("should track test data", async () => {
      const result = await caller.automationTesting.data.track({
        executionId,
        dataType: "candidate",
        recordId: 999,
        recordData: { name: "Test Candidate", email: "test@example.com" },
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
    });

    it("should list test data by execution", async () => {
      const testData = await caller.automationTesting.data.listByExecution({
        executionId,
      });

      expect(Array.isArray(testData)).toBe(true);
      expect(testData.length).toBeGreaterThan(0);
      
      const trackedData = testData.find(d => d.recordId === 999);
      expect(trackedData).toBeDefined();
      expect(trackedData?.dataType).toBe("candidate");
    });
  });

  describe("Test Results", () => {
    it("should create test result", async () => {
      const result = await caller.automationTesting.results.create({
        executionId,
        testType: "sample_data_generation",
        testName: "Generate Sample Candidates",
        passed: true,
        expectedValue: "5 candidates",
        actualValue: "5 candidates",
        executionTime: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeTypeOf("number");
    });

    it("should list test results by execution", async () => {
      const results = await caller.automationTesting.results.listByExecution({
        executionId,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const testResult = results.find(r => r.testName === "Generate Sample Candidates");
      expect(testResult).toBeDefined();
      expect(testResult?.passed).toBe(true);
    });
  });

  describe("Cleanup", () => {
    it("should delete test trigger", async () => {
      const result = await caller.automationTesting.triggers.delete({
        id: triggerId,
      });

      expect(result.success).toBe(true);
    });

    it("should delete test campaign", async () => {
      const result = await caller.automationTesting.campaigns.delete({
        id: campaignId,
      });

      expect(result.success).toBe(true);
    });

    it("should delete test scenario", async () => {
      const result = await caller.automationTesting.scenarios.delete({
        id: scenarioId,
      });

      expect(result.success).toBe(true);
    });
  });
});
