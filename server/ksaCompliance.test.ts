import { describe, expect, it } from "vitest";
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
    res: {} as TrpcContext["res"],
  };
}

describe("KSA Compliance - Nitaqat", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("getStatus", () => {
    it("should calculate Nitaqat band for given workforce", async () => {
      const result = await caller.ksaCompliance.nitaqat.getStatus({
        totalEmployees: 100,
        saudiEmployees: 30,
        entitySize: "medium",
      });

      expect(result).toBeDefined();
      expect(result.band).toBeDefined();
      expect(["platinum", "green", "yellow", "red"]).toContain(result.band);
      expect(result.currentPercentage).toBe(30);
      expect(result.requiredPercentage).toBeGreaterThan(0);
    });

    it("should return platinum band for high Saudi percentage", async () => {
      const result = await caller.ksaCompliance.nitaqat.getStatus({
        totalEmployees: 100,
        saudiEmployees: 50,
        entitySize: "medium",
      });

      expect(result.band).toBe("platinum");
    });

    it("should return red band for low Saudi percentage", async () => {
      const result = await caller.ksaCompliance.nitaqat.getStatus({
        totalEmployees: 100,
        saudiEmployees: 5,
        entitySize: "medium",
      });

      expect(result.band).toBe("red");
    });
  });

  describe("calculateHiringPlan", () => {
    it("should calculate hires needed to reach target band", async () => {
      const result = await caller.ksaCompliance.nitaqat.calculateHiringPlan({
        totalEmployees: 100,
        saudiEmployees: 20,
        entitySize: "medium",
        targetBand: "green",
      });

      expect(result).toBeDefined();
      expect(result.currentBand).toBeDefined();
      expect(result.targetBand).toBe("green");
      expect(result.saudiHiresNeeded).toBeGreaterThanOrEqual(0);
      expect(result.newTotalEmployees).toBeGreaterThanOrEqual(100);
    });

    it("should return zero hires if already at target band", async () => {
      const result = await caller.ksaCompliance.nitaqat.calculateHiringPlan({
        totalEmployees: 100,
        saudiEmployees: 50,
        entitySize: "medium",
        targetBand: "green",
      });

      expect(result.saudiHiresNeeded).toBe(0);
    });
  });
});

describe("KSA Compliance - Labor Law", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("calculateProbation", () => {
    it("should calculate standard 90-day probation period", async () => {
      const hireDate = new Date("2024-01-01");
      const result = await caller.ksaCompliance.laborLaw.calculateProbation({
        hireDate: hireDate.toISOString(),
      });

      expect(result).toBeDefined();
      expect(result.probationDays).toBe(90);
      expect(new Date(result.probationEndDate)).toBeInstanceOf(Date);
    });
  });

  describe("calculateNotice", () => {
    it("should calculate 30-day notice for employees under 5 years", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateNotice({
        yearsOfService: 3,
      });

      expect(result).toBeDefined();
      expect(result.noticeDays).toBe(30);
    });

    it("should calculate 60-day notice for employees over 5 years", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateNotice({
        yearsOfService: 7,
      });

      expect(result).toBeDefined();
      expect(result.noticeDays).toBe(60);
    });
  });

  describe("calculateGratuity", () => {
    it("should calculate gratuity for employee with 5 years service", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateGratuity({
        yearsOfService: 5,
        lastMonthlySalary: 10000,
      });

      expect(result).toBeDefined();
      expect(result.gratuityAmount).toBeGreaterThan(0);
      expect(result.calculation).toBeDefined();
    });

    it("should calculate different rates for first 5 years vs after", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateGratuity({
        yearsOfService: 8,
        lastMonthlySalary: 10000,
      });

      expect(result).toBeDefined();
      expect(result.gratuityAmount).toBeGreaterThan(0);
      expect(result.calculation.first5Years).toBeDefined();
      expect(result.calculation.after5Years).toBeDefined();
    });
  });

  describe("validateWorkingHours", () => {
    it("should validate standard working hours (48h/week)", async () => {
      const result = await caller.ksaCompliance.laborLaw.validateWorkingHours({
        weeklyHours: 48,
        isRamadan: false,
      });

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(true);
      expect(result.maxAllowedHours).toBe(48);
    });

    it("should validate Ramadan working hours (36h/week)", async () => {
      const result = await caller.ksaCompliance.laborLaw.validateWorkingHours({
        weeklyHours: 36,
        isRamadan: true,
      });

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(true);
      expect(result.maxAllowedHours).toBe(36);
    });

    it("should flag non-compliant working hours", async () => {
      const result = await caller.ksaCompliance.laborLaw.validateWorkingHours({
        weeklyHours: 55,
        isRamadan: false,
      });

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(false);
      expect(result.violation).toBeDefined();
    });
  });

  describe("calculateAnnualLeave", () => {
    it("should calculate 21 days leave for employees under 5 years", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateAnnualLeave({
        yearsOfService: 3,
      });

      expect(result).toBeDefined();
      expect(result.annualLeaveDays).toBe(21);
    });

    it("should calculate 30 days leave for employees over 5 years", async () => {
      const result = await caller.ksaCompliance.laborLaw.calculateAnnualLeave({
        yearsOfService: 6,
      });

      expect(result).toBeDefined();
      expect(result.annualLeaveDays).toBe(30);
    });
  });
});

describe("KSA Compliance - Localization", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("getSaudiHolidays", () => {
    it("should return list of Saudi national holidays", async () => {
      const result = await caller.ksaCompliance.localization.getSaudiHolidays({
        year: 2024,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.holidays)).toBe(true);
      expect(result.holidays.length).toBeGreaterThan(0);
      
      // Check for key holidays
      const holidayNames = result.holidays.map(h => h.name);
      expect(holidayNames).toContain("Saudi National Day");
      expect(holidayNames).toContain("Eid Al-Fitr");
      expect(holidayNames).toContain("Eid Al-Adha");
    });
  });

  describe("isRamadan", () => {
    it("should check if a date falls in Ramadan", async () => {
      const result = await caller.ksaCompliance.localization.isRamadan({
        date: new Date("2024-03-15").toISOString(),
      });

      expect(result).toBeDefined();
      expect(typeof result.isRamadan).toBe("boolean");
    });
  });
});

describe("KSA Compliance - Work Permits", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("validateIqama", () => {
    it("should validate Iqama number format", async () => {
      const result = await caller.ksaCompliance.workPermits.validateIqama({
        iqamaNumber: "2123456789",
      });

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should reject invalid Iqama format", async () => {
      const result = await caller.ksaCompliance.workPermits.validateIqama({
        iqamaNumber: "123", // Too short
      });

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("checkExpiringPermits", () => {
    it("should return list of expiring work permits", async () => {
      const result = await caller.ksaCompliance.workPermits.checkExpiringPermits({
        daysThreshold: 30,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.expiringPermits)).toBe(true);
    });
  });
});

describe("KSA Compliance - Integration Tests", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  it("should have all required Nitaqat procedures", () => {
    expect(caller.ksaCompliance.nitaqat.getStatus).toBeDefined();
    expect(caller.ksaCompliance.nitaqat.calculateHiringPlan).toBeDefined();
    expect(caller.ksaCompliance.nitaqat.updateWorkforce).toBeDefined();
    expect(caller.ksaCompliance.nitaqat.setGoals).toBeDefined();
  });

  it("should have all required labor law procedures", () => {
    expect(caller.ksaCompliance.laborLaw.calculateProbation).toBeDefined();
    expect(caller.ksaCompliance.laborLaw.calculateNotice).toBeDefined();
    expect(caller.ksaCompliance.laborLaw.calculateGratuity).toBeDefined();
    expect(caller.ksaCompliance.laborLaw.validateWorkingHours).toBeDefined();
    expect(caller.ksaCompliance.laborLaw.calculateAnnualLeave).toBeDefined();
    expect(caller.ksaCompliance.laborLaw.getComplianceChecklist).toBeDefined();
  });

  it("should have all required localization procedures", () => {
    expect(caller.ksaCompliance.localization.getSaudiHolidays).toBeDefined();
    expect(caller.ksaCompliance.localization.getPrayerTimes).toBeDefined();
    expect(caller.ksaCompliance.localization.isRamadan).toBeDefined();
  });

  it("should have all required work permit procedures", () => {
    expect(caller.ksaCompliance.workPermits.validateIqama).toBeDefined();
    expect(caller.ksaCompliance.workPermits.checkExpiringPermits).toBeDefined();
  });
});
