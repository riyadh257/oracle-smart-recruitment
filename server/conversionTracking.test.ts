import { describe, expect, it, beforeAll } from "vitest";
import { conversionTrackingRouter, generateTrackingToken, replaceEmailVariables } from "./conversionTracking";
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

describe("Conversion Tracking", () => {
  describe("generateTrackingToken", () => {
    it("generates a unique token", () => {
      const token1 = generateTrackingToken(1, 2, 3);
      const token2 = generateTrackingToken(1, 2, 3);
      
      expect(token1).toBeDefined();
      expect(token1.length).toBe(32);
      expect(token1).not.toBe(token2); // Should be unique due to timestamp and random
    });

    it("generates different tokens for different inputs", () => {
      const token1 = generateTrackingToken(1, 2, 3);
      const token2 = generateTrackingToken(4, 5, 6);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe("replaceEmailVariables", () => {
    it("replaces all variables with provided data", () => {
      const template = "Hello {{candidateName}}, you applied for {{jobTitle}} at {{companyName}}.";
      const data = {
        candidateName: "John Doe",
        jobTitle: "Software Engineer",
        companyName: "Oracle Technologies",
      };

      const result = replaceEmailVariables(template, data);
      expect(result).toBe("Hello John Doe, you applied for Software Engineer at Oracle Technologies.");
    });

    it("replaces missing variables with empty string", () => {
      const template = "Hello {{candidateName}}, your interview is on {{interviewDate}}.";
      const data = {
        candidateName: "Jane Smith",
      };

      const result = replaceEmailVariables(template, data);
      expect(result).toBe("Hello Jane Smith, your interview is on .");
    });

    it("handles multiple occurrences of the same variable", () => {
      const template = "{{candidateName}}, welcome! We're excited to have you, {{candidateName}}.";
      const data = {
        candidateName: "Alice Johnson",
      };

      const result = replaceEmailVariables(template, data);
      expect(result).toBe("Alice Johnson, welcome! We're excited to have you, Alice Johnson.");
    });

    it("handles all supported variables", () => {
      const template = `
        Candidate: {{candidateName}} ({{candidateEmail}}, {{candidatePhone}})
        Job: {{jobTitle}} at {{companyName}} in {{department}}
        Location: {{location}}, Salary: {{salary}}
        Interview: {{interviewDate}} at {{interviewTime}} with {{interviewerName}}
        Duration: {{interviewDuration}}, Location: {{interviewLocation}}
        Application: {{applicationDate}}, Status: {{applicationStatus}}
      `;

      const data = {
        candidateName: "Bob Wilson",
        candidateEmail: "bob@example.com",
        candidatePhone: "+966 50 123 4567",
        jobTitle: "Senior Developer",
        companyName: "Tech Corp",
        department: "Engineering",
        location: "Riyadh",
        salary: "15,000 SAR",
        interviewDate: "Dec 15, 2025",
        interviewTime: "2:00 PM",
        interviewerName: "Sarah Manager",
        interviewDuration: "45 minutes",
        interviewLocation: "Office A",
        applicationDate: "Dec 1, 2025",
        applicationStatus: "Under Review",
      };

      const result = replaceEmailVariables(template, data);
      expect(result).toContain("Bob Wilson");
      expect(result).toContain("bob@example.com");
      expect(result).toContain("Senior Developer");
      expect(result).toContain("Tech Corp");
      expect(result).toContain("Riyadh");
      expect(result).toContain("15,000 SAR");
    });
  });

  describe("conversionTrackingRouter", () => {
    it("generates tracking token via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = conversionTrackingRouter.createCaller(ctx);

      const result = await caller.generateToken({
        campaignId: 1,
        workflowId: 2,
        candidateId: 3,
      });

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(32);
    });

    it("tracks email sent event", async () => {
      const { ctx } = createAuthContext();
      const caller = conversionTrackingRouter.createCaller(ctx);

      const result = await caller.trackEmailSent({
        campaignId: 1,
        candidateId: 100,
        trackingToken: "test-token-123",
        eventData: { subject: "Test Email" },
      });

      expect(result.success).toBe(true);
    });

    it("tracks application submitted event", async () => {
      const { ctx } = createAuthContext();
      const caller = conversionTrackingRouter.createCaller(ctx);

      const result = await caller.trackApplicationSubmitted({
        candidateId: 100,
        campaignId: 1,
        eventData: { jobId: 5 },
      });

      expect(result.success).toBe(true);
    });

    it("tracks interview accepted event", async () => {
      const { ctx } = createAuthContext();
      const caller = conversionTrackingRouter.createCaller(ctx);

      const result = await caller.trackInterviewAccepted({
        candidateId: 100,
        workflowId: 2,
        eventData: { interviewId: 10 },
      });

      expect(result.success).toBe(true);
    });
  });
});
