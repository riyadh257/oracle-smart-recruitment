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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("messageTemplates router", () => {
  it("should create a new message template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const template = await caller.messageTemplates.create({
      name: "Test Interview Invitation",
      description: "Template for interview invitations",
      category: "interview_invitation",
      channelType: "email",
      emailSubject: "Interview Invitation for {{jobTitle}}",
      emailBody: "Dear {{candidateName}}, we would like to invite you for an interview.",
      variables: ["candidateName", "jobTitle"],
    });

    expect(template).toBeDefined();
  });

  it("should list user message templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template first
    await caller.messageTemplates.create({
      name: "Test Template",
      category: "general",
      channelType: "email",
      emailSubject: "Test",
      emailBody: "Test body",
    });

    const templates = await caller.messageTemplates.list();

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should filter templates by category", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.messageTemplates.list({
      category: "interview_invitation",
    });

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should filter templates by channel type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.messageTemplates.list({
      channelType: "email",
    });

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
  });
});

describe("messageTemplates variable replacement", () => {
  it("should preview template with variable replacement", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a template
    const template = await caller.messageTemplates.create({
      name: "Variable Test Template",
      category: "general",
      channelType: "email",
      emailSubject: "Hello {{candidateName}}",
      emailBody: "Dear {{candidateName}}, the position is {{jobTitle}}.",
    });

    // Preview with variables
    const preview = await caller.messageTemplates.preview({
      templateId: template.insertId,
      variables: {
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
      },
    });

    expect(preview.emailSubject).toBe("Hello John Doe");
    expect(preview.emailBody).toContain("Dear John Doe");
    expect(preview.emailBody).toContain("Software Engineer");
  });
});
