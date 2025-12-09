import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-employer",
    email: "employer@example.com",
    name: "Test Employer",
    loginMethod: "manus",
    role: "employer",
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
    res: {} as TrpcContext["res"],
  };
}

describe("Email Campaign Automation", () => {
  describe("create campaign", () => {
    it("should create a new campaign", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.campaigns.create({
        employerId: 1,
        name: "Test Campaign",
        description: "A test email campaign",
      });

      expect(result).toHaveProperty("id");
      expect(result.name).toBe("Test Campaign");
      expect(result.status).toBe("draft");
    });

    it("should create campaign with workflow definition", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const workflowDefinition = {
        nodes: [
          {
            id: "node-1",
            type: "trigger",
            label: "Application Submitted",
            config: { triggerType: "application_submitted" },
            position: { x: 100, y: 100 },
            connections: ["node-2"],
          },
          {
            id: "node-2",
            type: "action",
            label: "Send Welcome Email",
            config: {
              subject: "Welcome!",
              emailContent: "<p>Thank you for applying</p>",
            },
            position: { x: 300, y: 100 },
            connections: [],
          },
        ],
        startNodeId: "node-1",
      };

      const result = await caller.campaigns.create({
        employerId: 1,
        name: "Welcome Campaign",
        description: "Automated welcome emails",
        workflowDefinition,
      });

      expect(result).toHaveProperty("id");
      expect(result.workflowDefinition).toBeDefined();
    });
  });

  describe("getAll campaigns", () => {
    it("should return all campaigns for an employer", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.campaigns.getAll({
        employerId: 1,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("update campaign", () => {
    it("should update campaign status", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a campaign
      const campaign = await caller.campaigns.create({
        employerId: 1,
        name: "Test Campaign for Update",
        description: "Test",
      });

      // Then update it
      const result = await caller.campaigns.update({
        campaignId: campaign.id,
        status: "active",
      });

      expect(result.status).toBe("active");
    });
  });

  describe("getAnalytics", () => {
    it("should return campaign analytics", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a campaign first
      const campaign = await caller.campaigns.create({
        employerId: 1,
        name: "Analytics Test Campaign",
      });

      const result = await caller.campaigns.getAnalytics({
        campaignId: campaign.id,
      });

      expect(result).toHaveProperty("totalSent");
      expect(result).toHaveProperty("totalOpened");
      expect(result).toHaveProperty("totalClicked");
      expect(result).toHaveProperty("openRate");
      expect(result).toHaveProperty("clickRate");
      expect(result).toHaveProperty("executions");
    });
  });

  describe("pause and resume", () => {
    it("should pause a campaign", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const campaign = await caller.campaigns.create({
        employerId: 1,
        name: "Pause Test Campaign",
      });

      const result = await caller.campaigns.pause({
        campaignId: campaign.id,
      });

      expect(result.success).toBe(true);
    });

    it("should resume a campaign", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const campaign = await caller.campaigns.create({
        employerId: 1,
        name: "Resume Test Campaign",
      });

      await caller.campaigns.pause({ campaignId: campaign.id });

      const result = await caller.campaigns.resume({
        campaignId: campaign.id,
      });

      expect(result.success).toBe(true);
    });
  });
});
