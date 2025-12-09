import { getDb } from "./db";
import { budgetScenarios, scenarioCampaigns } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Budget Scenario Service
 * Enables what-if analysis for campaign budget planning
 */

export interface CampaignInput {
  name: string;
  startDate: Date;
  endDate: Date;
  estimatedRecipients: number;
  costPerRecipient: number;
  expectedResponseRate?: number;
  expectedConversionRate?: number;
}

export interface ScenarioResult {
  totalCost: number;
  totalRecipients: number;
  averageCostPerDay: number;
  peakDailyCost: number;
  expectedResponses: number;
  expectedConversions: number;
  costPerConversion: number;
  roi: number; // Return on investment percentage
  timeline: Array<{
    date: Date;
    dailyCost: number;
    cumulativeCost: number;
    activeCampaigns: number;
  }>;
}

export interface Scenario {
  id?: number;
  name: string;
  description?: string;
  createdBy: number;
  campaigns: CampaignInput[];
  result?: ScenarioResult;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScenarioComparison {
  scenarios: Array<{
    id: number;
    name: string;
    totalCost: number;
    expectedConversions: number;
    costPerConversion: number;
    roi: number;
  }>;
  recommendation: {
    scenarioId: number;
    reason: string;
    savings?: number;
  };
}

/**
 * Calculate scenario results from campaign inputs
 */
export function calculateScenarioResult(campaigns: CampaignInput[]): ScenarioResult {
  if (campaigns.length === 0) {
    return {
      totalCost: 0,
      totalRecipients: 0,
      averageCostPerDay: 0,
      peakDailyCost: 0,
      expectedResponses: 0,
      expectedConversions: 0,
      costPerConversion: 0,
      roi: 0,
      timeline: [],
    };
  }

  // Calculate total metrics
  const totalCost = campaigns.reduce(
    (sum, c) => sum + c.estimatedRecipients * c.costPerRecipient,
    0
  );
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.estimatedRecipients, 0);

  // Calculate expected responses and conversions
  let expectedResponses = 0;
  let expectedConversions = 0;

  campaigns.forEach((campaign) => {
    const responses = campaign.estimatedRecipients * (campaign.expectedResponseRate || 0.05);
    const conversions = responses * (campaign.expectedConversionRate || 0.2);
    expectedResponses += responses;
    expectedConversions += conversions;
  });

  // Calculate cost per conversion
  const costPerConversion = expectedConversions > 0 ? totalCost / expectedConversions : 0;

  // Calculate ROI (assuming average value per conversion)
  const averageConversionValue = 5000; // SAR - configurable
  const totalRevenue = expectedConversions * averageConversionValue;
  const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

  // Build timeline
  const timeline = buildTimeline(campaigns);
  const averageCostPerDay = timeline.length > 0 ? totalCost / timeline.length : 0;
  const peakDailyCost = Math.max(...timeline.map((t) => t.dailyCost), 0);

  return {
    totalCost,
    totalRecipients,
    averageCostPerDay,
    peakDailyCost,
    expectedResponses,
    expectedConversions,
    costPerConversion,
    roi,
    timeline,
  };
}

/**
 * Build daily timeline from campaigns
 */
function buildTimeline(
  campaigns: CampaignInput[]
): Array<{
  date: Date;
  dailyCost: number;
  cumulativeCost: number;
  activeCampaigns: number;
}> {
  if (campaigns.length === 0) return [];

  // Find date range
  const allDates = campaigns.flatMap((c) => [c.startDate, c.endDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  const timeline: Array<{
    date: Date;
    dailyCost: number;
    cumulativeCost: number;
    activeCampaigns: number;
  }> = [];

  let cumulativeCost = 0;
  const currentDate = new Date(minDate);

  while (currentDate <= maxDate) {
    const activeCampaigns = campaigns.filter(
      (c) => currentDate >= c.startDate && currentDate <= c.endDate
    );

    // Calculate daily cost (spread campaign cost evenly across days)
    let dailyCost = 0;
    activeCampaigns.forEach((campaign) => {
      const campaignDays =
        Math.ceil(
          (campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      const campaignTotalCost = campaign.estimatedRecipients * campaign.costPerRecipient;
      dailyCost += campaignTotalCost / campaignDays;
    });

    cumulativeCost += dailyCost;

    timeline.push({
      date: new Date(currentDate),
      dailyCost,
      cumulativeCost,
      activeCampaigns: activeCampaigns.length,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeline;
}

/**
 * Create a new scenario
 */
export async function createScenario(scenario: Scenario): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = calculateScenarioResult(scenario.campaigns);

  const scenarioResult = await db.insert(budgetScenarios).values({
    name: scenario.name,
    description: scenario.description || null,
    createdBy: scenario.createdBy,
    totalCost: Math.round(result.totalCost),
    totalRecipients: result.totalRecipients,
    expectedConversions: Math.round(result.expectedConversions),
    costPerConversion: Math.round(result.costPerConversion),
    roi: Math.round(result.roi),
    timeline: JSON.stringify(result.timeline),
  });

  const scenarioId = typeof scenarioResult.insertId === 'bigint' 
    ? Number(scenarioResult.insertId) 
    : parseInt(String(scenarioResult.insertId), 10);

  // Insert campaigns
  if (scenario.campaigns.length > 0) {
    await db.insert(scenarioCampaigns).values(
      scenario.campaigns.map((campaign) => ({
        scenarioId,
        name: campaign.name,
        startDate: campaign.startDate.toISOString(),
        endDate: campaign.endDate.toISOString(),
        estimatedRecipients: campaign.estimatedRecipients,
        costPerRecipient: Math.round(campaign.costPerRecipient * 100), // Store as cents
        expectedResponseRate: Math.round((campaign.expectedResponseRate || 0.05) * 100), // Store as percentage * 100
        expectedConversionRate: Math.round((campaign.expectedConversionRate || 0.2) * 100), // Store as percentage * 100
      }))
    );
  }

  return scenarioId;
}

/**
 * Get scenario by ID
 */
export async function getScenario(scenarioId: number): Promise<Scenario | null> {
  const db = await getDb();
  if (!db) return null;

  const scenarios = await db
    .select()
    .from(budgetScenarios)
    .where(eq(budgetScenarios.id, scenarioId))
    .limit(1);

  if (scenarios.length === 0) return null;

  const scenario = scenarios[0];

  const campaigns = await db
    .select()
    .from(scenarioCampaigns)
    .where(eq(scenarioCampaigns.scenarioId, scenarioId));

  const campaignInputs: CampaignInput[] = campaigns.map((c) => ({
    name: c.name,
    startDate: new Date(c.startDate),
    endDate: new Date(c.endDate),
    estimatedRecipients: c.estimatedRecipients,
    costPerRecipient: c.costPerRecipient,
    expectedResponseRate: c.expectedResponseRate,
    expectedConversionRate: c.expectedConversionRate,
  }));

  const result: ScenarioResult = {
    totalCost: scenario.totalCost,
    totalRecipients: scenario.totalRecipients,
    averageCostPerDay: 0,
    peakDailyCost: 0,
    expectedResponses: 0,
    expectedConversions: scenario.expectedConversions,
    costPerConversion: scenario.costPerConversion,
    roi: scenario.roi,
    timeline: scenario.timeline ? JSON.parse(scenario.timeline as string) : [],
  };

  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description || undefined,
    createdBy: scenario.createdBy,
    campaigns: campaignInputs,
    result,
    createdAt: new Date(scenario.createdAt),
    updatedAt: new Date(scenario.updatedAt),
  };
}

/**
 * Get all scenarios for a user
 */
export async function getUserScenarios(userId: number): Promise<Scenario[]> {
  const db = await getDb();
  if (!db) return [];

  const scenarios = await db
    .select()
    .from(budgetScenarios)
    .where(eq(budgetScenarios.createdBy, userId))
    .orderBy(desc(budgetScenarios.createdAt));

  const scenariosWithCampaigns = await Promise.all(
    scenarios.map(async (scenario) => {
      const campaigns = await db
        .select()
        .from(scenarioCampaigns)
        .where(eq(scenarioCampaigns.scenarioId, scenario.id));

      const campaignInputs: CampaignInput[] = campaigns.map((c) => ({
        name: c.name,
        startDate: new Date(c.startDate),
        endDate: new Date(c.endDate),
        estimatedRecipients: c.estimatedRecipients,
        costPerRecipient: c.costPerRecipient,
        expectedResponseRate: c.expectedResponseRate,
        expectedConversionRate: c.expectedConversionRate,
      }));

      const result: ScenarioResult = {
        totalCost: scenario.totalCost,
        totalRecipients: scenario.totalRecipients,
        averageCostPerDay: 0,
        peakDailyCost: 0,
        expectedResponses: 0,
        expectedConversions: scenario.expectedConversions,
        costPerConversion: scenario.costPerConversion,
        roi: scenario.roi,
        timeline: scenario.timeline ? JSON.parse(scenario.timeline as string) : [],
      };

      return {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description || undefined,
        createdBy: scenario.createdBy,
        campaigns: campaignInputs,
        result,
        createdAt: new Date(scenario.createdAt),
        updatedAt: new Date(scenario.updatedAt),
      };
    })
  );

  return scenariosWithCampaigns;
}

/**
 * Compare multiple scenarios
 */
export async function compareScenarios(scenarioIds: number[]): Promise<ScenarioComparison> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scenarios = await db
    .select()
    .from(budgetScenarios)
    .where(and(...scenarioIds.map((id) => eq(budgetScenarios.id, id))));

  const comparison: ScenarioComparison = {
    scenarios: scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      totalCost: s.totalCost,
      expectedConversions: s.expectedConversions,
      costPerConversion: s.costPerConversion,
      roi: s.roi,
    })),
    recommendation: {
      scenarioId: 0,
      reason: "",
    },
  };

  // Find best scenario (highest ROI with reasonable cost)
  const bestScenario = scenarios.reduce((best, current) => {
    if (!best) return current;
    // Prefer higher ROI, but penalize if cost is too high
    const currentScore = current.roi - current.totalCost / 10000;
    const bestScore = best.roi - best.totalCost / 10000;
    return currentScore > bestScore ? current : best;
  });

  if (bestScenario) {
    const worstScenario = scenarios.reduce((worst, current) => {
      if (!worst) return current;
      const currentScore = current.roi - current.totalCost / 10000;
      const worstScore = worst.roi - worst.totalCost / 10000;
      return currentScore < worstScore ? current : worst;
    });

    comparison.recommendation = {
      scenarioId: bestScenario.id,
      reason: `Highest ROI (${bestScenario.roi.toFixed(1)}%) with ${bestScenario.expectedConversions} expected conversions`,
      savings: worstScenario ? worstScenario.totalCost - bestScenario.totalCost : undefined,
    };
  }

  return comparison;
}

/**
 * Delete scenario
 */
export async function deleteScenario(scenarioId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Campaigns will be deleted by cascade
  await db.delete(budgetScenarios).where(eq(budgetScenarios.id, scenarioId));
}

/**
 * Run Monte Carlo simulation for risk analysis
 */
export function runMonteCarloSimulation(
  campaigns: CampaignInput[],
  iterations: number = 1000
): {
  meanCost: number;
  medianCost: number;
  percentile95: number;
  percentile5: number;
  standardDeviation: number;
} {
  const results: number[] = [];

  for (let i = 0; i < iterations; i++) {
    let totalCost = 0;

    campaigns.forEach((campaign) => {
      // Add randomness to cost and recipients (±20%)
      const recipientVariance = 1 + (Math.random() - 0.5) * 0.4;
      const costVariance = 1 + (Math.random() - 0.5) * 0.4;

      const simulatedRecipients = campaign.estimatedRecipients * recipientVariance;
      const simulatedCost = campaign.costPerRecipient * costVariance;

      totalCost += simulatedRecipients * simulatedCost;
    });

    results.push(totalCost);
  }

  results.sort((a, b) => a - b);

  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const median = results[Math.floor(results.length / 2)];
  const percentile95 = results[Math.floor(results.length * 0.95)];
  const percentile5 = results[Math.floor(results.length * 0.05)];

  const variance =
    results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    meanCost: mean,
    medianCost: median,
    percentile95,
    percentile5,
    standardDeviation,
  };
}
