import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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

describe("campaigns", () => {
  it("should create a new campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.create({
      employerId: 1,
      name: "Test Campaign",
      description: "Test campaign description",
      workflowDefinition: {
        emailSubject: "Test Subject",
        emailBody: "Test Body"
      }
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Campaign");
    expect(result.status).toBe("draft");
  });

  it("should list all campaigns for an employer", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.campaigns.getAll({
      employerId: 1
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should pause an active campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a campaign
    const campaign = await caller.campaigns.create({
      employerId: 1,
      name: "Campaign to Pause",
      description: "Test",
    });

    // Update it to active
    await caller.campaigns.update({
      campaignId: campaign.id,
      status: "active"
    });

    // Then pause it
    const result = await caller.campaigns.pause({
      campaignId: campaign.id
    });

    expect(result.success).toBe(true);
  });

  it("should resume a paused campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create and pause a campaign
    const campaign = await caller.campaigns.create({
      employerId: 1,
      name: "Campaign to Resume",
      description: "Test",
    });

    await caller.campaigns.update({
      campaignId: campaign.id,
      status: "paused"
    });

    // Then resume it
    const result = await caller.campaigns.resume({
      campaignId: campaign.id
    });

    expect(result.success).toBe(true);
  });

  it("should delete a campaign", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a campaign
    const campaign = await caller.campaigns.create({
      employerId: 1,
      name: "Campaign to Delete",
      description: "Test",
    });

    // Then delete it
    const result = await caller.campaigns.delete({
      campaignId: campaign.id
    });

    expect(result.success).toBe(true);
  });
});
