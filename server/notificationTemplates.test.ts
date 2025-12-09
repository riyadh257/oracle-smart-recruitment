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

describe("notificationTemplates router", () => {
  it("should list all templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notificationTemplates.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get template variables", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notificationTemplates.getVariables();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("placeholder");
      expect(result[0]).toHaveProperty("category");
    }
  });

  it("should create a new template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templateData = {
      name: "Test Template",
      description: "A test notification template",
      type: "general" as const,
      channel: "push" as const,
      bodyTemplate: "Hello {{candidate_name}}, this is a test notification.",
      variables: ["candidate_name"],
    };

    const result = await caller.notificationTemplates.create(templateData);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe(templateData.name);
    expect(result.type).toBe(templateData.type);
    expect(result.channel).toBe(templateData.channel);
  });

  it("should preview template with variables", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notificationTemplates.preview({
      template: "Hello {{candidate_name}}, your interview is on {{interview_date}}.",
      variables: {
        candidate_name: "John Doe",
        interview_date: "2024-01-15",
      },
    });

    expect(result.rendered).toBe("Hello John Doe, your interview is on 2024-01-15.");
  });

  it("should extract variables from template", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notificationTemplates.extractVariables({
      template: "Hello {{candidate_name}}, your interview is on {{interview_date}} at {{interview_time}}.",
    });

    expect(result.variables).toEqual(["candidate_name", "interview_date", "interview_time"]);
  });

  it("should get templates by type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notificationTemplates.getByType({
      type: "interview_reminder",
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((template: any) => {
      expect(template.type).toBe("interview_reminder");
    });
  });
});
