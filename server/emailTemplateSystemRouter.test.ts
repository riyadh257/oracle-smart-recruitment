import { describe, expect, it } from "vitest";
import { emailTemplateSystemRouter } from "./emailTemplateSystemRouter";
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

describe("emailTemplateSystemRouter", () => {
  describe("getTemplates", () => {
    it("should return list of templates", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const result = await caller.getTemplates({
        limit: 20,
        offset: 0,
      });

      expect(result).toHaveProperty("templates");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.templates)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("should filter by category", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const categories = [
        "interview_invitation",
        "rejection",
        "offer",
        "follow_up",
        "reminder",
        "welcome",
        "general"
      ] as const;

      for (const category of categories) {
        const result = await caller.getTemplates({
          category,
          limit: 20,
          offset: 0,
        });

        expect(result).toHaveProperty("templates");
        expect(Array.isArray(result.templates)).toBe(true);
      }
    });

    it("should filter by active status", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const activeResult = await caller.getTemplates({
        isActive: true,
        limit: 20,
        offset: 0,
      });

      const inactiveResult = await caller.getTemplates({
        isActive: false,
        limit: 20,
        offset: 0,
      });

      expect(Array.isArray(activeResult.templates)).toBe(true);
      expect(Array.isArray(inactiveResult.templates)).toBe(true);
    });
  });

  describe("createTemplate", () => {
    it("should create a new template", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const result = await caller.createTemplate({
        name: "Test Template",
        description: "Test description",
        category: "general",
        subject: "Test Subject {{candidateName}}",
        bodyHtml: "<p>Hello {{candidateName}}, welcome to {{companyName}}!</p>",
        bodyText: "Hello {{candidateName}}, welcome to {{companyName}}!",
        variables: [
          {
            name: "candidateName",
            description: "Candidate's full name",
            required: true,
          },
          {
            name: "companyName",
            description: "Company name",
            required: true,
          },
        ],
        isDefault: false,
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("templateId");
      expect(result.success).toBe(true);
      expect(typeof result.templateId).toBe("number");
    });

    it("should validate required fields", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      await expect(
        caller.createTemplate({
          name: "",
          category: "general",
          subject: "Test",
          bodyHtml: "<p>Test</p>",
        })
      ).rejects.toThrow();
    });
  });

  describe("updateTemplate", () => {
    it("should update template fields", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      // Create a template first
      const created = await caller.createTemplate({
        name: "Original Name",
        category: "general",
        subject: "Original Subject",
        bodyHtml: "<p>Original Body</p>",
      });

      // Update it
      const result = await caller.updateTemplate({
        templateId: created.templateId,
        name: "Updated Name",
        subject: "Updated Subject",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result.templateId).toBe(created.templateId);
    });
  });

  describe("previewTemplate", () => {
    it("should substitute variables in template", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      // Create a template with variables
      const created = await caller.createTemplate({
        name: "Variable Test",
        category: "general",
        subject: "Hello {{name}}",
        bodyHtml: "<p>Dear {{name}}, your interview is at {{time}}.</p>",
      });

      // Preview with sample data
      const result = await caller.previewTemplate({
        templateId: created.templateId,
        sampleData: {
          name: "John Doe",
          time: "2:00 PM",
        },
      });

      expect(result).toHaveProperty("subject");
      expect(result).toHaveProperty("bodyHtml");
      expect(result.subject).toBe("Hello John Doe");
      expect(result.bodyHtml).toContain("Dear John Doe");
      expect(result.bodyHtml).toContain("2:00 PM");
    });
  });

  describe("getAvailableVariables", () => {
    it("should return list of available variables", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const result = await caller.getAvailableVariables({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter by category", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const categories = ["candidate", "job", "company", "interview", "system"] as const;

      for (const category of categories) {
        const result = await caller.getAvailableVariables({ category });
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe("createAbTest", () => {
    it("should create A/B test", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      // Create two templates for testing
      const templateA = await caller.createTemplate({
        name: "Template A",
        category: "general",
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      });

      const templateB = await caller.createTemplate({
        name: "Template B",
        category: "general",
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      });

      // Create A/B test
      const result = await caller.createAbTest({
        name: "Test Campaign",
        description: "Testing subject lines",
        testType: "subject",
        variantATemplateId: templateA.templateId,
        variantBTemplateId: templateB.templateId,
        trafficSplit: 50,
        minimumSampleSize: 100,
        confidenceLevel: 95,
        primaryMetric: "open_rate",
      });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("testId");
      expect(result.success).toBe(true);
      expect(typeof result.testId).toBe("number");
    });

    it("should validate test types", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const testTypes = ["subject", "content", "send_time", "full_template"] as const;

      for (const testType of testTypes) {
        // Create templates
        const templateA = await caller.createTemplate({
          name: `Template A ${testType}`,
          category: "general",
          subject: "Subject A",
          bodyHtml: "<p>Body A</p>",
        });

        const templateB = await caller.createTemplate({
          name: `Template B ${testType}`,
          category: "general",
          subject: "Subject B",
          bodyHtml: "<p>Body B</p>",
        });

        const result = await caller.createAbTest({
          name: `Test ${testType}`,
          testType,
          variantATemplateId: templateA.templateId,
          variantBTemplateId: templateB.templateId,
          trafficSplit: 50,
          minimumSampleSize: 100,
          confidenceLevel: 95,
          primaryMetric: "open_rate",
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("startAbTest", () => {
    it("should start an A/B test", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      // Create templates and test
      const templateA = await caller.createTemplate({
        name: "Template A",
        category: "general",
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      });

      const templateB = await caller.createTemplate({
        name: "Template B",
        category: "general",
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      });

      const test = await caller.createAbTest({
        name: "Test Campaign",
        testType: "subject",
        variantATemplateId: templateA.templateId,
        variantBTemplateId: templateB.templateId,
        trafficSplit: 50,
        minimumSampleSize: 100,
        confidenceLevel: 95,
        primaryMetric: "open_rate",
      });

      // Start the test
      const result = await caller.startAbTest({
        testId: test.testId,
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result.testId).toBe(test.testId);
    });
  });

  describe("getAbTestResults", () => {
    it("should return test results", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      // Create templates and test
      const templateA = await caller.createTemplate({
        name: "Template A",
        category: "general",
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
      });

      const templateB = await caller.createTemplate({
        name: "Template B",
        category: "general",
        subject: "Subject B",
        bodyHtml: "<p>Body B</p>",
      });

      const test = await caller.createAbTest({
        name: "Test Campaign",
        testType: "subject",
        variantATemplateId: templateA.templateId,
        variantBTemplateId: templateB.templateId,
        trafficSplit: 50,
        minimumSampleSize: 100,
        confidenceLevel: 95,
        primaryMetric: "open_rate",
      });

      // Get results
      const result = await caller.getAbTestResults({
        testId: test.testId,
      });

      expect(result).toHaveProperty("test");
      expect(result).toHaveProperty("variantA");
      expect(result).toHaveProperty("variantB");
      expect(result).toHaveProperty("significance");
      expect(result).toHaveProperty("hasWinner");
      expect(result).toHaveProperty("winner");
    });
  });

  describe("getCampaignAnalytics", () => {
    it("should return campaign analytics", async () => {
      const { ctx } = createAuthContext();
      const caller = emailTemplateSystemRouter.createCaller(ctx);

      const result = await caller.getCampaignAnalytics({
        campaignId: 1,
      });

      expect(result).toHaveProperty("totalSent");
      expect(result).toHaveProperty("delivered");
      expect(result).toHaveProperty("opened");
      expect(result).toHaveProperty("clicked");
      expect(result).toHaveProperty("bounced");
      expect(result).toHaveProperty("deliveryRate");
      expect(result).toHaveProperty("openRate");
      expect(result).toHaveProperty("clickRate");
      expect(result).toHaveProperty("bounceRate");

      expect(typeof result.totalSent).toBe("number");
      expect(typeof result.deliveryRate).toBe("number");
      expect(result.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(result.deliveryRate).toBeLessThanOrEqual(100);
    });
  });
});
