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

describe("KSA Compliance - Labor Law", () => {
  describe("calculateProbation", () => {
    it("calculates 90-day probation period correctly", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2024-01-01");
      const result = await caller.ksaCompliance.laborLaw.calculateProbation({ startDate });

      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toBeInstanceOf(Date);
      
      // Probation should be 90 days
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + 90);
      expect(result.endDate.toDateString()).toBe(expectedEndDate.toDateString());
    });

    it("correctly identifies completed probation", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Start date 100 days ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 100);

      const result = await caller.ksaCompliance.laborLaw.calculateProbation({ startDate });

      expect(result.isComplete).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });
  });

  describe("calculateNotice", () => {
    it("returns 30 days for contracts less than 5 years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Contract started 2 years ago
      const contractStartDate = new Date();
      contractStartDate.setFullYear(contractStartDate.getFullYear() - 2);

      const result = await caller.ksaCompliance.laborLaw.calculateNotice({
        contractStartDate,
        contractType: "indefinite"
      });

      expect(result.noticeDays).toBe(30);
    });

    it("returns 60 days for contracts 5+ years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Contract started 6 years ago
      const contractStartDate = new Date();
      contractStartDate.setFullYear(contractStartDate.getFullYear() - 6);

      const result = await caller.ksaCompliance.laborLaw.calculateNotice({
        contractStartDate,
        contractType: "indefinite"
      });

      expect(result.noticeDays).toBe(60);
    });
  });

  describe("calculateGratuity", () => {
    it("calculates end-of-service benefits correctly for 3 years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2021-01-01");
      const endDate = new Date("2024-01-01");
      const monthlySalary = 10000;

      const result = await caller.ksaCompliance.laborLaw.calculateGratuity({
        startDate,
        endDate,
        lastMonthlySalary: monthlySalary,
        terminationType: "termination"
      });

      expect(result.yearsOfService).toBe(3);
      // First 3 years: 3 * (10000 / 2) = 15000 SAR
      expect(result.totalAmount).toBe(15000);
      expect(result.firstFiveYearsAmount).toBe(15000);
      expect(result.afterFiveYearsAmount).toBe(0);
    });

    it("calculates benefits correctly for 7 years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2017-01-01");
      const endDate = new Date("2024-01-01");
      const monthlySalary = 10000;

      const result = await caller.ksaCompliance.laborLaw.calculateGratuity({
        startDate,
        endDate,
        lastMonthlySalary: monthlySalary,
        terminationType: "termination"
      });

      expect(result.yearsOfService).toBe(7);
      // First 5 years: 5 * (10000 / 2) = 25000
      // Next 2 years: 2 * 10000 = 20000
      // Total: 45000 SAR
      expect(result.totalAmount).toBe(45000);
      expect(result.firstFiveYearsAmount).toBe(25000);
      expect(result.afterFiveYearsAmount).toBe(20000);
    });

    it("reduces benefits for resignation before 5 years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2021-01-01");
      const endDate = new Date("2024-01-01");
      const monthlySalary = 10000;

      const result = await caller.ksaCompliance.laborLaw.calculateGratuity({
        startDate,
        endDate,
        lastMonthlySalary: monthlySalary,
        terminationType: "resignation"
      });

      expect(result.yearsOfService).toBe(3);
      // 3 years resignation: 1/3 of calculated amount
      // Full: 15000, Reduced: 5000
      expect(result.totalAmount).toBe(5000);
    });
  });

  describe("validateHours", () => {
    it("validates compliant standard working hours", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.validateHours({
        weeklyHours: 48,
        dailyHours: 8,
        isRamadan: false,
        isMuslim: true
      });

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.maxWeeklyHours).toBe(48);
      expect(result.maxDailyHours).toBe(8);
    });

    it("detects excessive working hours", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.validateHours({
        weeklyHours: 60,
        dailyHours: 10,
        isRamadan: false,
        isMuslim: true
      });

      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it("applies Ramadan hours for Muslim employees", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.validateHours({
        weeklyHours: 36,
        dailyHours: 6,
        isRamadan: true,
        isMuslim: true
      });

      expect(result.isCompliant).toBe(true);
      expect(result.maxWeeklyHours).toBe(36);
      expect(result.maxDailyHours).toBe(6);
    });

    it("detects violations during Ramadan", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.validateHours({
        weeklyHours: 48,
        dailyHours: 8,
        isRamadan: true,
        isMuslim: true
      });

      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe("calculateLeave", () => {
    it("returns 21 days for less than 5 years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.calculateLeave({
        yearsOfService: 3
      });

      expect(result.annualLeaveDays).toBe(21);
      expect(result.yearsOfService).toBe(3);
    });

    it("returns 30 days for 5+ years", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.ksaCompliance.laborLaw.calculateLeave({
        yearsOfService: 7
      });

      expect(result.annualLeaveDays).toBe(30);
      expect(result.yearsOfService).toBe(7);
    });
  });
});
