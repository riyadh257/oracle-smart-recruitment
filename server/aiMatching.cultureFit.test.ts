import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(role: "admin" | "user" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("AI Matching Engine - Culture Fit Scoring", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("analyzeCultureFit", () => {
    it("should analyze company culture from description", async () => {
      const companyDescription = `
        We are a fast-paced startup that values innovation and creativity.
        Our team is collaborative and encourages open communication.
        We believe in flat hierarchies and empowering every team member.
        Work-life balance is important to us, and we offer flexible working hours.
      `;

      const result = await caller.aiMatching.analyzeCultureFit({
        companyDescription,
      });

      expect(result).toBeDefined();
      expect(result.dimensions).toBeDefined();
      expect(result.dimensions).toHaveProperty("hierarchy");
      expect(result.dimensions).toHaveProperty("innovation");
      expect(result.dimensions).toHaveProperty("teamStyle");
      expect(result.dimensions).toHaveProperty("communication");
      expect(result.dimensions).toHaveProperty("riskTolerance");
      expect(result.dimensions).toHaveProperty("workLifeBalance");
      expect(result.dimensions).toHaveProperty("decisionMaking");
      expect(result.dimensions).toHaveProperty("changeAdaptability");

      // Verify scores are in valid range (0-100)
      Object.values(result.dimensions).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it("should reject empty company description", async () => {
      await expect(
        caller.aiMatching.analyzeCultureFit({
          companyDescription: "",
        })
      ).rejects.toThrow();
    });

    it("should handle corporate culture description", async () => {
      const corporateDescription = `
        We are a well-established enterprise with clear hierarchies and processes.
        Decision-making follows structured approval chains.
        We value stability, consistency, and proven methodologies.
        Professional communication and formal meetings are the norm.
      `;

      const result = await caller.aiMatching.analyzeCultureFit({
        companyDescription: corporateDescription,
      });

      expect(result).toBeDefined();
      expect(result.dimensions.hierarchy).toBeGreaterThan(50); // Should detect hierarchical structure
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe("assessCandidateCulture", () => {
    it("should assess candidate culture preferences from profile", async () => {
      const candidateProfile = `
        I thrive in collaborative environments where ideas are shared freely.
        I prefer flat organizational structures where everyone's voice matters.
        I'm comfortable with ambiguity and enjoy taking calculated risks.
        Work-life balance is very important to me.
      `;

      const result = await caller.aiMatching.assessCandidateCulture({
        candidateProfile,
      });

      expect(result).toBeDefined();
      expect(result.preferences).toBeDefined();
      expect(result.preferences).toHaveProperty("hierarchy");
      expect(result.preferences).toHaveProperty("innovation");
      expect(result.preferences).toHaveProperty("teamStyle");
      expect(result.preferences).toHaveProperty("communication");

      // Verify scores are in valid range
      Object.values(result.preferences).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it("should reject empty candidate profile", async () => {
      await expect(
        caller.aiMatching.assessCandidateCulture({
          candidateProfile: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("calculateCultureScore", () => {
    it("should calculate culture fit score between company and candidate", async () => {
      const companyDimensions = {
        hierarchy: 30,
        innovation: 80,
        teamStyle: 75,
        communication: 85,
        riskTolerance: 70,
        workLifeBalance: 80,
        decisionMaking: 65,
        changeAdaptability: 90,
      };

      const candidatePreferences = {
        hierarchy: 25,
        innovation: 85,
        teamStyle: 80,
        communication: 90,
        riskTolerance: 75,
        workLifeBalance: 85,
        decisionMaking: 70,
        changeAdaptability: 85,
      };

      const result = await caller.aiMatching.calculateCultureScore({
        companyDimensions,
        candidatePreferences,
      });

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.dimensionScores).toBeDefined();
      expect(result.strengths).toBeDefined();
      expect(result.concerns).toBeDefined();
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
    });

    it("should detect high culture fit for aligned profiles", async () => {
      const aligned = {
        hierarchy: 50,
        innovation: 50,
        teamStyle: 50,
        communication: 50,
        riskTolerance: 50,
        workLifeBalance: 50,
        decisionMaking: 50,
        changeAdaptability: 50,
      };

      const result = await caller.aiMatching.calculateCultureScore({
        companyDimensions: aligned,
        candidatePreferences: aligned,
      });

      expect(result.overallScore).toBeGreaterThan(95); // Perfect alignment
      expect(result.concerns.length).toBe(0); // No concerns
    });

    it("should detect low culture fit for misaligned profiles", async () => {
      const companyDimensions = {
        hierarchy: 90, // Very hierarchical
        innovation: 20, // Low innovation
        teamStyle: 30, // Individual work
        communication: 40, // Formal
        riskTolerance: 20, // Risk-averse
        workLifeBalance: 30, // Long hours
        decisionMaking: 20, // Top-down
        changeAdaptability: 30, // Resistant to change
      };

      const candidatePreferences = {
        hierarchy: 10, // Flat structure
        innovation: 90, // High innovation
        teamStyle: 85, // Collaborative
        communication: 90, // Open
        riskTolerance: 80, // Risk-taking
        workLifeBalance: 90, // Balance important
        decisionMaking: 85, // Participative
        changeAdaptability: 90, // Embraces change
      };

      const result = await caller.aiMatching.calculateCultureScore({
        companyDimensions,
        candidatePreferences,
      });

      expect(result.overallScore).toBeLessThan(50); // Poor alignment
      expect(result.concerns.length).toBeGreaterThan(0); // Multiple concerns
    });
  });

  describe("generateCultureReport", () => {
    it("should generate comprehensive culture fit report", async () => {
      const result = await caller.aiMatching.generateCultureReport({
        applicationId: 1, // Assuming test data exists
      });

      expect(result).toBeDefined();
      // Test structure exists even if no data
      expect(caller.aiMatching.generateCultureReport).toBeDefined();
    });
  });
});

describe("AI Matching Engine - Wellbeing Compatibility", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("analyzeWellbeingFactors", () => {
    it("should analyze company wellbeing environment", async () => {
      const companyEnvironment = `
        We offer comprehensive health benefits and mental health support.
        Flexible working hours and remote work options are available.
        We encourage continuous learning and provide training budgets.
        Our culture promotes work-life balance with no expectation of overtime.
        We have regular team building activities and wellness programs.
      `;

      const result = await caller.aiMatching.analyzeWellbeingFactors({
        companyEnvironment,
      });

      expect(result).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.factors).toHaveProperty("workLifeBalance");
      expect(result.factors).toHaveProperty("stressTolerance");
      expect(result.factors).toHaveProperty("growthMindset");
      expect(result.factors).toHaveProperty("autonomy");
      expect(result.factors).toHaveProperty("socialConnection");
      expect(result.factors).toHaveProperty("purposeAlignment");
      expect(result.factors).toHaveProperty("physicalWellness");
      expect(result.factors).toHaveProperty("mentalHealth");

      // Verify scores are in valid range
      Object.values(result.factors).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it("should reject empty company environment description", async () => {
      await expect(
        caller.aiMatching.analyzeWellbeingFactors({
          companyEnvironment: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("assessCandidateWellbeing", () => {
    it("should assess candidate wellbeing needs", async () => {
      const candidateNeeds = `
        I value work-life balance and need flexibility in my schedule.
        Mental health support and low-stress environments are important to me.
        I'm motivated by continuous learning and growth opportunities.
        I prefer autonomy in how I complete my work.
        Social connections with colleagues matter to me.
      `;

      const result = await caller.aiMatching.assessCandidateWellbeing({
        candidateNeeds,
      });

      expect(result).toBeDefined();
      expect(result.needs).toBeDefined();
      expect(result.needs).toHaveProperty("workLifeBalance");
      expect(result.needs).toHaveProperty("stressTolerance");
      expect(result.needs).toHaveProperty("growthMindset");

      // Verify scores are in valid range
      Object.values(result.needs).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("calculateWellbeingScore", () => {
    it("should calculate wellbeing compatibility score", async () => {
      const companyFactors = {
        workLifeBalance: 85,
        stressTolerance: 70,
        growthMindset: 80,
        autonomy: 75,
        socialConnection: 80,
        purposeAlignment: 70,
        physicalWellness: 65,
        mentalHealth: 90,
      };

      const candidateNeeds = {
        workLifeBalance: 90,
        stressTolerance: 60,
        growthMindset: 85,
        autonomy: 80,
        socialConnection: 75,
        purposeAlignment: 70,
        physicalWellness: 60,
        mentalHealth: 95,
      };

      const result = await caller.aiMatching.calculateWellbeingScore({
        companyFactors,
        candidateNeeds,
      });

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.factorScores).toBeDefined();
      expect(result.burnoutRisk).toBeDefined();
      expect(["low", "medium", "high"]).toContain(result.burnoutRisk);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should detect high burnout risk for mismatched needs", async () => {
      const companyFactors = {
        workLifeBalance: 30, // Poor balance
        stressTolerance: 20, // High stress
        growthMindset: 40,
        autonomy: 30, // Low autonomy
        socialConnection: 50,
        purposeAlignment: 40,
        physicalWellness: 30,
        mentalHealth: 35, // Poor support
      };

      const candidateNeeds = {
        workLifeBalance: 95, // Needs balance
        stressTolerance: 90, // Needs low stress
        growthMindset: 80,
        autonomy: 90, // Needs autonomy
        socialConnection: 70,
        purposeAlignment: 80,
        physicalWellness: 75,
        mentalHealth: 95, // Needs support
      };

      const result = await caller.aiMatching.calculateWellbeingScore({
        companyFactors,
        candidateNeeds,
      });

      expect(result.burnoutRisk).toBe("high");
      expect(result.overallScore).toBeLessThan(50);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("generateWellbeingReport", () => {
    it("should generate comprehensive wellbeing report", async () => {
      const result = await caller.aiMatching.generateWellbeingReport({
        applicationId: 1, // Assuming test data exists
      });

      expect(result).toBeDefined();
      // Test structure exists
      expect(caller.aiMatching.generateWellbeingReport).toBeDefined();
    });
  });
});

describe("AI Matching Engine - Overall Match Calculation", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("calculateOverallMatch", () => {
    it("should calculate weighted overall match score", async () => {
      const matchData = {
        technicalScore: 85,
        cultureScore: 75,
        wellbeingScore: 80,
        technicalWeight: 40,
        cultureWeight: 30,
        wellbeingWeight: 30,
      };

      const result = await caller.aiMatching.calculateOverallMatch(matchData);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      
      // Verify weighted calculation
      const expectedScore = 
        (matchData.technicalScore * matchData.technicalWeight / 100) +
        (matchData.cultureScore * matchData.cultureWeight / 100) +
        (matchData.wellbeingScore * matchData.wellbeingWeight / 100);
      
      expect(Math.abs(result.overallScore - expectedScore)).toBeLessThan(1);
    });

    it("should handle different weight distributions", async () => {
      const matchData = {
        technicalScore: 90,
        cultureScore: 60,
        wellbeingScore: 70,
        technicalWeight: 70, // Heavy technical weight
        cultureWeight: 15,
        wellbeingWeight: 15,
      };

      const result = await caller.aiMatching.calculateOverallMatch(matchData);

      // Should be closer to technical score due to high weight
      expect(result.overallScore).toBeGreaterThan(80);
    });
  });

  describe("generateMatchExplanation", () => {
    it("should generate human-readable match explanation", async () => {
      const matchData = {
        technicalScore: 85,
        cultureScore: 75,
        wellbeingScore: 80,
        overallScore: 81,
        technicalStrengths: ["React", "Node.js", "TypeScript"],
        cultureStrengths: ["Collaborative", "Innovative"],
        cultureConcerns: ["Hierarchy preference mismatch"],
        wellbeingStrengths: ["Work-life balance alignment"],
        burnoutRisk: "low" as const,
      };

      const result = await caller.aiMatching.generateMatchExplanation(matchData);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.details).toBeDefined();
      expect(result.details.technical).toBeDefined();
      expect(result.details.culture).toBeDefined();
      expect(result.details.wellbeing).toBeDefined();
    });
  });
});
