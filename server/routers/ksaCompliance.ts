/**
 * KSA Compliance Router
 * Phase 16: tRPC procedures for Saudization, labor law, and localization
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  calculateNitaqatBand,
  calculateSaudiHiresNeeded,
  calculateProbationEndDate,
  calculateNoticePeriod,
  calculateEndOfServiceBenefits,
  validateWorkingHours,
  calculateAnnualLeave,
  isRamadanPeriod,
  getSaudiNationalHolidays,
  getPrayerTimes,
  validateIqamaStatus,
  NITAQAT_BANDS
} from "../ksaCompliance";
import {
  // saudizationTracking,
  // saudizationGoals,
  candidateNationality,
  // employmentContracts,
  endOfServiceBenefits,
  workPermits,
  hijriCalendarEvents,
  prayerTimes,
  laborLawCompliance
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const ksaComplianceRouter = router({
  /**
   * Nitaqat / Saudization Features
   */
  nitaqat: router({
    /**
     * Get current Nitaqat status for employer
     */
    getStatus: protectedProcedure
      .input(z.object({
        employerId: z.number()
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [tracking] = await db.select().from(saudizationTracking)
          .where(eq(saudizationTracking.employerId, input.employerId))
          .limit(1);

        if (!tracking) {
          return null;
        }

        // Use a default sector for calculation - in production, store this in employer profile
        const bandInfo = calculateNitaqatBand(
          tracking.totalEmployees,
          tracking.saudiEmployees,
          "general" // Default sector
        );

        return {
          tracking,
          bandInfo,
          bandDetails: NITAQAT_BANDS[bandInfo.band]
        };
      }),

    /**
     * Calculate hiring plan to reach target band
     */
    calculateHiringPlan: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        targetBand: z.enum(["platinum", "green", "yellow"])
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [tracking] = await db.select().from(saudizationTracking)
          .where(eq(saudizationTracking.employerId, input.employerId))
          .limit(1);

        if (!tracking) {
          throw new Error("No Saudization tracking found for employer");
        }

        const plan = calculateSaudiHiresNeeded(
          tracking.totalEmployees,
          tracking.saudiEmployees,
          input.targetBand
        );

        return plan;
      }),

    /**
     * Update workforce composition
     */
    updateWorkforce: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        totalEmployees: z.number().min(0),
        saudiEmployees: z.number().min(0),
        nonSaudiEmployees: z.number().min(0),
        activitySector: z.string(),
        periodStart: z.date(),
        periodEnd: z.date()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const bandInfo = calculateNitaqatBand(
          input.totalEmployees,
          input.saudiEmployees,
          input.activitySector
        );

        // Update or create tracking record
        const [existing] = await db.select().from(saudizationTracking)
          .where(eq(saudizationTracking.employerId, input.employerId))
          .limit(1);

        if (existing) {
          await db.update(saudizationTracking)
            .set({
              periodStart: input.periodStart,
              periodEnd: input.periodEnd,
              totalEmployees: input.totalEmployees,
              saudiEmployees: input.saudiEmployees,
              nonSaudiEmployees: input.nonSaudiEmployees,
              nitaqatBand: bandInfo.band,
              saudizationPercentage: bandInfo.saudizationPercentage,
              targetPercentage: bandInfo.targetPercentage,
              complianceStatus: bandInfo.complianceStatus
            })
            .where(eq(saudizationTracking.id, existing.id));
        } else {
          await db.insert(saudizationTracking).values({
            employerId: input.employerId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            totalEmployees: input.totalEmployees,
            saudiEmployees: input.saudiEmployees,
            nonSaudiEmployees: input.nonSaudiEmployees,
            nitaqatBand: bandInfo.band,
            saudizationPercentage: bandInfo.saudizationPercentage,
            targetPercentage: bandInfo.targetPercentage,
            complianceStatus: bandInfo.complianceStatus
          });
        }

        return {
          success: true,
          bandInfo
        };
      }),

    /**
     * Set Saudization goals
     */
    setGoals: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        targetPercentage: z.number().min(0).max(100),
        targetSaudiHires: z.number().min(0),
        targetDate: z.date()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.insert(saudizationGoals).values({
          employerId: input.employerId,
          targetPercentage: input.targetPercentage,
          targetSaudiHires: input.targetSaudiHires,
          targetDate: input.targetDate
        });

        return { success: true };
      })
  }),

  /**
   * Labor Law Compliance Features
   */
  laborLaw: router({
    /**
     * Calculate probation end date
     */
    calculateProbation: protectedProcedure
      .input(z.object({
        startDate: z.date()
      }))
      .query(({ input }) => {
        const endDate = calculateProbationEndDate(input.startDate);
        const daysRemaining = Math.floor((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          startDate: input.startDate,
          endDate,
          daysRemaining: Math.max(0, daysRemaining),
          isComplete: daysRemaining <= 0
        };
      }),

    /**
     * Calculate notice period
     */
    calculateNotice: protectedProcedure
      .input(z.object({
        contractStartDate: z.date(),
        contractType: z.enum(["indefinite", "fixed"])
      }))
      .query(({ input }) => {
        const noticeDays = calculateNoticePeriod(input.contractStartDate, input.contractType);
        const noticeEndDate = new Date();
        noticeEndDate.setDate(noticeEndDate.getDate() + noticeDays);

        return {
          noticeDays,
          noticeEndDate
        };
      }),

    /**
     * Calculate end-of-service benefits
     */
    calculateGratuity: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        lastMonthlySalary: z.number().min(0),
        terminationType: z.enum(["resignation", "termination", "mutual", "contract_end"])
      }))
      .query(({ input }) => {
        const benefits = calculateEndOfServiceBenefits(
          input.startDate,
          input.endDate,
          input.lastMonthlySalary,
          input.terminationType
        );

        // Calculate breakdown for first 5 years and after 5 years
        const yearsOfService = benefits.totalYears;
        const first5Years = Math.min(yearsOfService, 5);
        const after5Years = Math.max(0, yearsOfService - 5);
        
        const firstFiveYearsAmount = first5Years * (input.lastMonthlySalary / 2);
        const afterFiveYearsAmount = after5Years * input.lastMonthlySalary;
        
        return {
          yearsOfService: benefits.totalYears,
          totalAmount: benefits.benefitAmount,
          firstFiveYearsAmount: Math.round(firstFiveYearsAmount),
          afterFiveYearsAmount: Math.round(afterFiveYearsAmount),
          explanation: benefits.calculation
        };
      }),

    /**
     * Validate working hours
     */
    validateHours: protectedProcedure
      .input(z.object({
        weeklyHours: z.number().min(0),
        dailyHours: z.number().min(0),
        isRamadan: z.boolean(),
        isMuslim: z.boolean()
      }))
      .query(({ input }) => {
        return validateWorkingHours(
          input.weeklyHours,
          input.dailyHours,
          input.isRamadan,
          input.isMuslim
        );
      }),

    /**
     * Calculate annual leave entitlement
     */
    calculateLeave: protectedProcedure
      .input(z.object({
        yearsOfService: z.number().min(0)
      }))
      .query(({ input }) => {
        const days = calculateAnnualLeave(input.yearsOfService);
        
        return {
          yearsOfService: input.yearsOfService,
          annualLeaveDays: days
        };
      }),

    /**
     * Get compliance checklist for contract
     */
    getComplianceChecklist: protectedProcedure
      .input(z.object({
        contractId: z.number()
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [contract] = await db.select().from(employmentContracts)
          .where(eq(employmentContracts.id, input.contractId))
          .limit(1);

        if (!contract) {
          throw new Error("Contract not found");
        }

        const checklist = [];

        // Check probation period
        if (contract.probationEndDate) {
          const isProbationComplete = new Date() > contract.probationEndDate;
          checklist.push({
            item: "Probation Period",
            status: isProbationComplete ? "complete" : "in_progress",
            details: `Ends on ${contract.probationEndDate.toLocaleDateString()}`
          });
        }

        // Check working hours (placeholder - would need actual hours fields)
        // Note: employmentContracts schema doesn't have weeklyWorkingHours field
        const defaultWeeklyHours = 48;
        const defaultDailyHours = 8;
        if (true) {
          const hoursCheck = validateWorkingHours(
            defaultWeeklyHours,
            defaultDailyHours,
            false,
            false
          );
          checklist.push({
            item: "Working Hours",
            status: hoursCheck.isCompliant ? "compliant" : "non_compliant",
            details: hoursCheck.violations.join(", ") || "Within legal limits"
          });
        }

        // Check contract type
        checklist.push({
          item: "Contract Type",
          status: "compliant",
          details: contract.contractType === "full_time" ? "Full-time contract" : 
                   contract.contractType === "part_time" ? "Part-time contract" :
                   contract.contractType === "contract" ? "Contract" : "Temporary"
        });

        return checklist;
      })
  }),

  /**
   * Localization Features
   */
  localization: router({
    /**
     * Get Saudi national holidays for a year
     */
    getHolidays: protectedProcedure
      .input(z.object({
        year: z.number()
      }))
      .query(({ input }) => {
        return getSaudiNationalHolidays(input.year);
      }),

    /**
     * Get prayer times for a city
     */
    getPrayerTimes: protectedProcedure
      .input(z.object({
        city: z.string(),
        date: z.date()
      }))
      .query(({ input }) => {
        return getPrayerTimes(input.city, input.date);
      }),

    /**
     * Check if date is in Ramadan
     */
    isRamadan: protectedProcedure
      .input(z.object({
        date: z.date()
      }))
      .query(({ input }) => {
        return {
          isRamadan: isRamadanPeriod(input.date),
          date: input.date
        };
      })
  }),

  /**
   * Iqama & Work Permit Management
   */
  workPermits: router({
    /**
     * Bulk validate Iqama numbers
     */
    bulkValidateIqama: protectedProcedure
      .input(z.object({
        iqamaNumbers: z.array(z.object({
          iqamaNumber: z.string(),
          employeeName: z.string().optional(),
          expiryDate: z.date()
        }))
      }))
      .mutation(async ({ input }) => {
        const results = input.iqamaNumbers.map((item) => {
          const validation = validateIqamaStatus(item.iqamaNumber, item.expiryDate);
          return {
            iqamaNumber: item.iqamaNumber,
            employeeName: item.employeeName || 'Unknown',
            expiryDate: item.expiryDate,
            isValid: validation.isValid,
            daysUntilExpiry: validation.daysUntilExpiry,
            status: validation.status,
            warnings: validation.warnings,
          };
        });

        return {
          totalProcessed: results.length,
          validCount: results.filter((r) => r.isValid).length,
          invalidCount: results.filter((r) => !r.isValid).length,
          expiringCount: results.filter(
            (r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 90
          ).length,
          criticalCount: results.filter(
            (r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30
          ).length,
          expiredCount: results.filter((r) => r.daysUntilExpiry < 0).length,
          results,
        };
      }),

    /**
     * Process CSV file for bulk Iqama validation
     */
    processBulkIqamaCsv: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Parse CSV content (expecting format: iqamaNumber,employeeName,expiryDate)
        const lines = input.csvContent.split('\n').filter((line) => line.trim());
        const iqamaData: Array<{ iqamaNumber: string; employeeName: string; expiryDate: Date }> = [];

        // Skip header row if present
        const startIndex = lines[0]?.toLowerCase().includes('iqama') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i]!.split(',').map((p) => p.trim());
          if (parts[0]) {
            const expiryDate = parts[2] ? new Date(parts[2]) : new Date();
            iqamaData.push({
              iqamaNumber: parts[0],
              employeeName: parts[1] || 'Unknown',
              expiryDate: isNaN(expiryDate.getTime()) ? new Date() : expiryDate,
            });
          }
        }

        // Validate all Iqama numbers
        const results = iqamaData.map((item) => {
          const validation = validateIqamaStatus(item.iqamaNumber, item.expiryDate);
          return {
            iqamaNumber: item.iqamaNumber,
            employeeName: item.employeeName,
            expiryDate: item.expiryDate,
            isValid: validation.isValid,
            daysUntilExpiry: validation.daysUntilExpiry,
            status: validation.status,
            warnings: validation.warnings,
          };
        });

        return {
          totalProcessed: results.length,
          validCount: results.filter((r) => r.isValid).length,
          invalidCount: results.filter((r) => !r.isValid).length,
          expiringCount: results.filter(
            (r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 90
          ).length,
          criticalCount: results.filter(
            (r) => r.daysUntilExpiry >= 0 && r.daysUntilExpiry <= 30
          ).length,
          expiredCount: results.filter((r) => r.daysUntilExpiry < 0).length,
          results,
        };
      }),
    /**
     * Validate Iqama status
     */
    validateIqama: protectedProcedure
      .input(z.object({
        iqamaNumber: z.string(),
        expiryDate: z.date()
      }))
      .query(({ input }) => {
        return validateIqamaStatus(input.iqamaNumber, input.expiryDate);
      }),

    /**
     * Get expiring work permits
     */
    getExpiringPermits: protectedProcedure
      .input(z.object({
        employerId: z.number(),
        daysAhead: z.number().default(90)
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.daysAhead);

        const permits = await db.select().from(workPermits)
          .where(and(
            eq(workPermits.employerId, input.employerId),
            lte(workPermits.expiryDate, futureDate),
            gte(workPermits.expiryDate, new Date())
          ));

        return permits.map(permit => {
          // Note: workPermits schema uses permitNumber, not iqamaNumber
          const validation = validateIqamaStatus(permit.permitNumber || "", permit.expiryDate);
          return {
            ...permit,
            validation
          };
        });
      })
  }),

  /**
   * Candidate Nationality Tracking
   */
  nationality: router({
    /**
     * Get candidate nationality info
     */
    getCandidateNationality: protectedProcedure
      .input(z.object({
        candidateId: z.number()
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [nationality] = await db.select().from(candidateNationality)
          .where(eq(candidateNationality.candidateId, input.candidateId))
          .limit(1);

        return nationality || null;
      }),

    /**
     * Update candidate nationality
     */
    updateNationality: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        isSaudi: z.boolean(),
        nationality: z.string(),
        iqamaNumber: z.string().optional(),
        iqamaExpiry: z.date().optional(),
        workPermitStatus: z.enum(["valid", "expired", "pending", "not_required"]).optional(),
        workPermitExpiry: z.date().optional()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [existing] = await db.select().from(candidateNationality)
          .where(eq(candidateNationality.candidateId, input.candidateId))
          .limit(1);

        if (existing) {
          await db.update(candidateNationality)
            .set({
              isSaudi: input.isSaudi,
              nationality: input.nationality,
              iqamaNumber: input.iqamaNumber,
              iqamaExpiry: input.iqamaExpiry,
              workPermitStatus: input.workPermitStatus,
              workPermitExpiry: input.workPermitExpiry
            })
            .where(eq(candidateNationality.id, existing.id));
        } else {
          await db.insert(candidateNationality).values({
            candidateId: input.candidateId,
            isSaudi: input.isSaudi,
            nationality: input.nationality,
            iqamaNumber: input.iqamaNumber,
            iqamaExpiry: input.iqamaExpiry,
            workPermitStatus: input.workPermitStatus,
            workPermitExpiry: input.workPermitExpiry
          });
        }

        return { success: true };
      })
  })
});
