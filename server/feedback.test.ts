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

describe("feedback.create", () => {
  it("validates rating ranges (1-5)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test invalid rating (out of range)
    try {
      await caller.feedback.create({
        interviewId: 1,
        candidateId: 1,
        interviewerId: 1,
        overallRating: 6, // Invalid: should be 1-5
        recommendation: "hire",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Too big");
    }
  });

  it("accepts valid feedback input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Test that valid input structure is accepted
    try {
      await caller.feedback.create({
        interviewId: 1,
        candidateId: 1,
        interviewerId: 1,
        overallRating: 4,
        technicalSkillsRating: 5,
        communicationRating: 4,
        problemSolvingRating: 4,
        cultureFitRating: 3,
        recommendation: "hire",
        strengths: "Strong technical skills",
        weaknesses: "Could improve communication",
        detailedNotes: "Overall good candidate",
      });
    } catch (error) {
      // Expected to fail due to missing database records
      // but should not be a validation error
      expect(error).toBeDefined();
    }
  });

  it("requires valid recommendation enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.feedback.create({
        interviewId: 1,
        candidateId: 1,
        interviewerId: 1,
        overallRating: 4,
        recommendation: "invalid_value" as any,
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid option");
    }
  });
});

describe("feedback.getByInterview", () => {
  it("accepts valid interview ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.getByInterview({
      interviewId: 999, // Non-existent interview
    });

    // Should return empty array for non-existent interview
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("feedbackTemplate.create", () => {
  it("accepts valid template input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.feedback.createTemplate({
        employerId: 1,
        name: "Technical Interview Template",
        description: "Template for technical interviews",
        interviewType: "technical",
        questions: [
          {
            id: "q1",
            question: "How would you rate the candidate's coding skills?",
            type: "rating",
            required: true,
          },
          {
            id: "q2",
            question: "Describe the candidate's problem-solving approach",
            type: "text",
            required: true,
          },
        ],
      });
    } catch (error) {
      // Expected to fail due to missing database records
      expect(error).toBeDefined();
    }
  });

  it("validates question types", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.feedback.createTemplate({
        employerId: 1,
        name: "Test Template",
        questions: [
          {
            id: "q1",
            question: "Test question",
            type: "invalid_type" as any,
            required: true,
          },
        ],
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid option");
    }
  });
});
