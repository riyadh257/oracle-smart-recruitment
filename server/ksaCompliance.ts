/**
 * KSA Compliance Service
 * Phase 16: Saudization (Nitaqat), Labor Law, and Localization
 */

/**
 * Nitaqat Color Bands and Thresholds
 * Based on Saudi Ministry of Human Resources and Social Development (MHRSD) regulations
 */
export const NITAQAT_BANDS = {
  platinum: {
    name: "Platinum",
    color: "#E5E4E2",
    benefits: [
      "Instant work permit issuance",
      "Transfer of expat workers without employer consent",
      "Priority in government contracts",
      "Reduced inspection frequency"
    ]
  },
  green: {
    name: "Green",
    color: "#22C55E",
    benefits: [
      "Normal work permit processing",
      "Can hire new expat workers",
      "Access to government services"
    ]
  },
  yellow: {
    name: "Yellow",
    color: "#EAB308",
    warnings: [
      "Limited work permit issuance",
      "Cannot transfer expat workers",
      "6-month grace period to improve"
    ]
  },
  red: {
    name: "Red",
    color: "#EF4444",
    restrictions: [
      "No new work permits",
      "Cannot renew expat work permits",
      "Cannot transfer expat workers",
      "Risk of fines and penalties"
    ]
  }
} as const;

/**
 * Calculate Nitaqat band based on company size and Saudization percentage
 */
export function calculateNitaqatBand(
  totalEmployees: number,
  saudiEmployees: number,
  activitySector: string
): {
  band: "platinum" | "green" | "yellow" | "red";
  saudizationPercentage: number;
  targetPercentage: number;
  gap: number;
  complianceStatus: "compliant" | "at_risk" | "non_compliant";
} {
  const saudizationPercentage = totalEmployees > 0 
    ? Math.round((saudiEmployees / totalEmployees) * 100)
    : 0;

  // Simplified thresholds - in production, these would vary by sector and company size
  // Real Nitaqat has complex matrices based on activity code and employee count ranges
  let targetPercentage: number;
  let platinumThreshold: number;
  let greenThreshold: number;
  let yellowThreshold: number;

  // Example thresholds (actual values depend on sector and size)
  if (totalEmployees >= 1000) {
    platinumThreshold = 15;
    greenThreshold = 10;
    yellowThreshold = 7;
    targetPercentage = 10;
  } else if (totalEmployees >= 500) {
    platinumThreshold = 12;
    greenThreshold = 8;
    yellowThreshold = 5;
    targetPercentage = 8;
  } else if (totalEmployees >= 50) {
    platinumThreshold = 10;
    greenThreshold = 6;
    yellowThreshold = 4;
    targetPercentage = 6;
  } else {
    platinumThreshold = 8;
    greenThreshold = 5;
    yellowThreshold = 3;
    targetPercentage = 5;
  }

  let band: "platinum" | "green" | "yellow" | "red";
  let complianceStatus: "compliant" | "at_risk" | "non_compliant";

  if (saudizationPercentage >= platinumThreshold) {
    band = "platinum";
    complianceStatus = "compliant";
  } else if (saudizationPercentage >= greenThreshold) {
    band = "green";
    complianceStatus = "compliant";
  } else if (saudizationPercentage >= yellowThreshold) {
    band = "yellow";
    complianceStatus = "at_risk";
  } else {
    band = "red";
    complianceStatus = "non_compliant";
  }

  const gap = targetPercentage - saudizationPercentage;

  return {
    band,
    saudizationPercentage,
    targetPercentage,
    gap,
    complianceStatus
  };
}

/**
 * Calculate how many Saudi hires needed to reach target band
 */
export function calculateSaudiHiresNeeded(
  currentTotal: number,
  currentSaudi: number,
  targetBand: "platinum" | "green" | "yellow"
): {
  hiresNeeded: number;
  targetPercentage: number;
  projectedTotal: number;
  projectedSaudi: number;
  projectedPercentage: number;
} {
  // Get target percentage for desired band
  let targetPercentage: number;
  
  if (currentTotal >= 1000) {
    targetPercentage = targetBand === "platinum" ? 15 : targetBand === "green" ? 10 : 7;
  } else if (currentTotal >= 500) {
    targetPercentage = targetBand === "platinum" ? 12 : targetBand === "green" ? 8 : 5;
  } else if (currentTotal >= 50) {
    targetPercentage = targetBand === "platinum" ? 10 : targetBand === "green" ? 6 : 4;
  } else {
    targetPercentage = targetBand === "platinum" ? 8 : targetBand === "green" ? 5 : 3;
  }

  // Calculate needed Saudi hires
  // Formula: (currentSaudi + x) / (currentTotal + x) >= targetPercentage / 100
  // Solving for x: x >= (currentTotal * targetPercentage - currentSaudi * 100) / (100 - targetPercentage)
  
  const numerator = (currentTotal * targetPercentage) - (currentSaudi * 100);
  const denominator = 100 - targetPercentage;
  
  const hiresNeeded = denominator > 0 
    ? Math.max(0, Math.ceil(numerator / denominator))
    : 0;

  const projectedTotal = currentTotal + hiresNeeded;
  const projectedSaudi = currentSaudi + hiresNeeded;
  const projectedPercentage = projectedTotal > 0 
    ? Math.round((projectedSaudi / projectedTotal) * 100)
    : 0;

  return {
    hiresNeeded,
    targetPercentage,
    projectedTotal,
    projectedSaudi,
    projectedPercentage
  };
}

/**
 * KSA Labor Law Compliance Calculations
 */

/**
 * Calculate probation period end date (90 days standard)
 */
export function calculateProbationEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 90);
  return endDate;
}

/**
 * Calculate notice period (60 days standard, can be 30 days for contracts < 2 years)
 */
export function calculateNoticePeriod(
  contractStartDate: Date,
  contractType: "indefinite" | "fixed"
): number {
  const now = new Date();
  const yearsEmployed = (now.getTime() - contractStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (yearsEmployed < 5) {
    return 30; // 30 days for contracts < 5 years
  }

  return 60; // 60 days for contracts 5+ years
}

/**
 * Calculate end-of-service benefits (gratuity)
 * Based on Saudi Labor Law Article 84
 */
export function calculateEndOfServiceBenefits(
  startDate: Date,
  endDate: Date,
  lastMonthlySalary: number,
  terminationType: "resignation" | "termination" | "mutual" | "contract_end"
): {
  totalYears: number;
  totalMonths: number;
  benefitAmount: number;
  calculation: string;
} {
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalYears = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const totalMonths = Math.floor(remainingDays / 30);

  let benefitAmount = 0;
  let calculation = "";

  if (terminationType === "resignation") {
    // Resignation: Reduced benefits based on years of service
    if (totalYears < 2) {
      benefitAmount = 0;
      calculation = "Less than 2 years of service - no benefits for resignation";
    } else if (totalYears < 5) {
      // 1/3 of half month salary per year for years 1-5
      const years1to5 = Math.min(totalYears, 5);
      benefitAmount = (years1to5 * (lastMonthlySalary / 2)) / 3;
      calculation = `${years1to5} years × (${lastMonthlySalary}/2) / 3 = ${benefitAmount}`;
    } else if (totalYears < 10) {
      // 2/3 of half month salary per year for years 1-5, plus years 6-10
      const first5Years = 5 * (lastMonthlySalary / 2) / 3;
      const next5Years = (Math.min(totalYears, 10) - 5) * (lastMonthlySalary / 2) * 2 / 3;
      benefitAmount = first5Years + next5Years;
      calculation = `First 5 years: ${first5Years}, Next ${totalYears - 5} years: ${next5Years}`;
    } else {
      // Full benefits after 10 years
      const first5Years = 5 * (lastMonthlySalary / 2);
      const remaining = (totalYears - 5) * lastMonthlySalary;
      benefitAmount = first5Years + remaining;
      calculation = `First 5 years: ${first5Years}, Remaining ${totalYears - 5} years: ${remaining}`;
    }
  } else {
    // Termination/Mutual/Contract End: Full benefits
    // Half month salary for each of first 5 years
    const first5Years = Math.min(totalYears, 5) * (lastMonthlySalary / 2);
    
    // Full month salary for each year beyond 5
    const remainingYears = Math.max(0, totalYears - 5);
    const remaining = remainingYears * lastMonthlySalary;
    
    benefitAmount = first5Years + remaining;
    calculation = `First 5 years: ${first5Years}, Remaining ${remainingYears} years: ${remaining}`;
  }

  // Add pro-rata for partial months
  if (totalMonths > 0 && totalYears >= 2) {
    const monthlyRate = totalYears < 5 ? lastMonthlySalary / 24 : lastMonthlySalary / 12;
    const monthsBenefit = totalMonths * monthlyRate;
    benefitAmount += monthsBenefit;
    calculation += ` + ${totalMonths} months: ${monthsBenefit}`;
  }

  return {
    totalYears,
    totalMonths,
    benefitAmount: Math.round(benefitAmount),
    calculation
  };
}

/**
 * Validate working hours compliance
 * Standard: 48 hours/week, 8 hours/day
 * Ramadan: 36 hours/week, 6 hours/day for Muslims
 */
export function validateWorkingHours(
  weeklyHours: number,
  dailyHours: number,
  isRamadan: boolean,
  isMuslim: boolean
): {
  isCompliant: boolean;
  violations: string[];
  maxWeeklyHours: number;
  maxDailyHours: number;
} {
  const violations: string[] = [];
  let maxWeeklyHours = 48;
  let maxDailyHours = 8;

  if (isRamadan && isMuslim) {
    maxWeeklyHours = 36;
    maxDailyHours = 6;
  }

  if (weeklyHours > maxWeeklyHours) {
    violations.push(`Weekly hours (${weeklyHours}) exceed maximum (${maxWeeklyHours})`);
  }

  if (dailyHours > maxDailyHours) {
    violations.push(`Daily hours (${dailyHours}) exceed maximum (${maxDailyHours})`);
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    maxWeeklyHours,
    maxDailyHours
  };
}

/**
 * Calculate annual leave entitlement
 * Standard: 21 days after 1 year, 30 days after 5 years
 */
export function calculateAnnualLeave(yearsOfService: number): number {
  if (yearsOfService < 1) return 0;
  if (yearsOfService >= 5) return 30;
  return 21;
}

/**
 * Hijri Calendar Utilities
 */

/**
 * Check if date falls in Ramadan (approximate - would use actual Hijri calendar API in production)
 */
export function isRamadanPeriod(date: Date): boolean {
  // This is a placeholder - in production, use proper Hijri calendar conversion
  // Ramadan dates vary each year in Gregorian calendar
  // Would integrate with Islamic calendar API or library
  return false; // Placeholder
}

/**
 * Get Saudi national holidays
 */
export function getSaudiNationalHolidays(year: number): Array<{ name: string; date: Date; nameArabic: string }> {
  return [
    {
      name: "Saudi National Day",
      nameArabic: "اليوم الوطني السعودي",
      date: new Date(year, 8, 23) // September 23
    },
    {
      name: "Saudi Foundation Day",
      nameArabic: "يوم التأسيس السعودي",
      date: new Date(year, 1, 22) // February 22
    }
    // Eid al-Fitr and Eid al-Adha dates vary based on Hijri calendar
    // Would be calculated using Hijri calendar API
  ];
}

/**
 * Prayer Times Integration (placeholder)
 * In production, integrate with prayer times API based on city
 */
export function getPrayerTimes(city: string, date: Date): {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
} {
  // Placeholder - would integrate with prayer times API
  // Different cities have different prayer times
  return {
    fajr: "05:00",
    dhuhr: "12:15",
    asr: "15:30",
    maghrib: "18:00",
    isha: "19:30"
  };
}

/**
 * Validate Iqama (residency permit) status
 */
export function validateIqamaStatus(
  iqamaNumber: string,
  expiryDate: Date
): {
  isValid: boolean;
  daysUntilExpiry: number;
  status: "valid" | "expiring_soon" | "expired";
  warnings: string[];
} {
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const warnings: string[] = [];

  let status: "valid" | "expiring_soon" | "expired";
  let isValid: boolean;

  if (daysUntilExpiry < 0) {
    status = "expired";
    isValid = false;
    warnings.push("Iqama has expired - immediate renewal required");
  } else if (daysUntilExpiry <= 90) {
    status = "expiring_soon";
    isValid = true;
    warnings.push(`Iqama expires in ${daysUntilExpiry} days - renewal recommended`);
  } else {
    status = "valid";
    isValid = true;
  }

  // Basic Iqama number validation (10 digits starting with 1 or 2)
  if (!/^[12]\d{9}$/.test(iqamaNumber)) {
    warnings.push("Invalid Iqama number format");
    isValid = false;
  }

  return {
    isValid,
    daysUntilExpiry,
    status,
    warnings
  };
}
