/**
 * Culture Fit & Wellbeing Compatibility Analysis
 * Phase 15: Advanced assessment frameworks to reduce turnover and burnout
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

/**
 * Culture Dimensions Framework
 * Based on organizational culture research (Cameron & Quinn, Hofstede, Schein)
 */
export const CULTURE_DIMENSIONS = {
  hierarchy_vs_flat: {
    name: "Organizational Structure",
    minLabel: "Hierarchical (Clear chain of command)",
    maxLabel: "Flat (Collaborative decision-making)",
    description: "How decisions are made and authority is distributed"
  },
  innovation_vs_stability: {
    name: "Change Orientation",
    minLabel: "Stability (Proven processes)",
    maxLabel: "Innovation (Experimentation encouraged)",
    description: "Approach to change and new ideas"
  },
  individual_vs_team: {
    name: "Work Style",
    minLabel: "Individual (Autonomous work)",
    maxLabel: "Team (Collaborative work)",
    description: "Preference for individual vs. team-based work"
  },
  process_vs_results: {
    name: "Focus",
    minLabel: "Process (How work is done)",
    maxLabel: "Results (Outcomes matter most)",
    description: "What is valued more - process or results"
  },
  formal_vs_casual: {
    name: "Communication Style",
    minLabel: "Formal (Structured communication)",
    maxLabel: "Casual (Informal communication)",
    description: "Formality of workplace interactions"
  },
  competitive_vs_collaborative: {
    name: "Team Dynamics",
    minLabel: "Competitive (Individual achievement)",
    maxLabel: "Collaborative (Team success)",
    description: "How success is defined and rewarded"
  },
  risk_taking_vs_cautious: {
    name: "Risk Tolerance",
    minLabel: "Cautious (Risk-averse)",
    maxLabel: "Risk-taking (Embrace uncertainty)",
    description: "Attitude toward risk and failure"
  },
  work_life_balance: {
    name: "Work-Life Integration",
    minLabel: "Work-focused (Long hours expected)",
    maxLabel: "Life-focused (Flexible boundaries)",
    description: "Balance between work and personal life"
  }
} as const;

/**
 * Wellbeing Factors Framework
 * Based on workplace wellbeing research (Gallup, WHO, APA)
 */
export const WELLBEING_FACTORS = {
  work_life_balance: {
    name: "Work-Life Balance",
    description: "Ability to maintain healthy boundaries between work and personal life",
    assessmentQuestions: [
      {
        question: "How often do you work beyond regular hours?",
        options: ["Rarely", "Sometimes", "Often", "Always"]
      },
      {
        question: "Can you disconnect from work during personal time?",
        options: ["Always", "Usually", "Sometimes", "Rarely"]
      }
    ]
  },
  stress_management: {
    name: "Stress Management",
    description: "Support for managing workplace stress and pressure",
    assessmentQuestions: [
      {
        question: "How manageable is your workload?",
        options: ["Very manageable", "Manageable", "Challenging", "Overwhelming"]
      },
      {
        question: "Do you have resources to manage stress?",
        options: ["Excellent resources", "Good resources", "Limited resources", "No resources"]
      }
    ]
  },
  growth_mindset: {
    name: "Growth & Development",
    description: "Opportunities for learning and career advancement",
    assessmentQuestions: [
      {
        question: "How often do you learn new skills?",
        options: ["Constantly", "Regularly", "Occasionally", "Rarely"]
      },
      {
        question: "Are career growth paths clear?",
        options: ["Very clear", "Somewhat clear", "Unclear", "No paths"]
      }
    ]
  },
  autonomy: {
    name: "Autonomy",
    description: "Control over how work is done",
    assessmentQuestions: [
      {
        question: "How much control do you have over your work?",
        options: ["Full control", "Significant control", "Some control", "Little control"]
      }
    ]
  },
  recognition: {
    name: "Recognition",
    description: "Acknowledgment of contributions and achievements",
    assessmentQuestions: [
      {
        question: "How often is your work recognized?",
        options: ["Frequently", "Regularly", "Occasionally", "Rarely"]
      }
    ]
  },
  purpose: {
    name: "Purpose & Meaning",
    description: "Sense of purpose and meaningful contribution",
    assessmentQuestions: [
      {
        question: "Do you find your work meaningful?",
        options: ["Very meaningful", "Meaningful", "Somewhat meaningful", "Not meaningful"]
      }
    ]
  },
  social_connection: {
    name: "Social Connection",
    description: "Quality of relationships with colleagues",
    assessmentQuestions: [
      {
        question: "How would you describe team relationships?",
        options: ["Excellent", "Good", "Fair", "Poor"]
      }
    ]
  },
  physical_health: {
    name: "Physical Health Support",
    description: "Support for physical health and wellness",
    assessmentQuestions: [
      {
        question: "Does your workplace support physical health?",
        options: ["Strongly supports", "Supports", "Limited support", "No support"]
      }
    ]
  }
} as const;

/**
 * Analyze company culture from description using AI
 */
export async function analyzeCultureFromDescription(
  companyDescription: string,
  additionalContext?: string
): Promise<Record<string, { score: number; explanation: string }>> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an organizational culture expert. Analyze company descriptions and rate them on 8 culture dimensions (1-10 scale).

Dimensions:
1. hierarchy_vs_flat (1=Hierarchical, 10=Flat)
2. innovation_vs_stability (1=Stability-focused, 10=Innovation-focused)
3. individual_vs_team (1=Individual work, 10=Team-based)
4. process_vs_results (1=Process-focused, 10=Results-focused)
5. formal_vs_casual (1=Formal, 10=Casual)
6. competitive_vs_collaborative (1=Competitive, 10=Collaborative)
7. risk_taking_vs_cautious (1=Cautious, 10=Risk-taking)
8. work_life_balance (1=Work-focused, 10=Life-focused)

Provide a score and brief explanation for each dimension.`
    },
    {
      role: "user",
      content: `Analyze the culture of this company:\n\n${companyDescription}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ""}`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "culture_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hierarchy_vs_flat: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            innovation_vs_stability: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            individual_vs_team: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            process_vs_results: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            formal_vs_casual: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            competitive_vs_collaborative: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            risk_taking_vs_cautious: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            },
            work_life_balance: {
              type: "object",
              properties: {
                score: { type: "number" },
                explanation: { type: "string" }
              },
              required: ["score", "explanation"],
              additionalProperties: false
            }
          },
          required: [
            "hierarchy_vs_flat",
            "innovation_vs_stability",
            "individual_vs_team",
            "process_vs_results",
            "formal_vs_casual",
            "competitive_vs_collaborative",
            "risk_taking_vs_cautious",
            "work_life_balance"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Assess candidate's culture preferences from resume/profile
 */
export async function assessCandidateCulturePreferences(
  resumeText: string,
  profileData?: Record<string, any>
): Promise<Record<string, { preferredScore: number; importance: "critical" | "important" | "moderate" | "flexible"; reasoning: string }>> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a career counselor expert. Analyze candidate information and infer their culture preferences on 8 dimensions (1-10 scale).

For each dimension, also assess importance level:
- critical: Deal-breaker if not met
- important: Strong preference
- moderate: Preference but flexible
- flexible: Open to various environments

Dimensions:
1. hierarchy_vs_flat (1=Prefers hierarchy, 10=Prefers flat)
2. innovation_vs_stability (1=Prefers stability, 10=Prefers innovation)
3. individual_vs_team (1=Prefers individual, 10=Prefers team)
4. process_vs_results (1=Prefers process, 10=Prefers results)
5. formal_vs_casual (1=Prefers formal, 10=Prefers casual)
6. competitive_vs_collaborative (1=Prefers competitive, 10=Prefers collaborative)
7. risk_taking_vs_cautious (1=Prefers cautious, 10=Prefers risk-taking)
8. work_life_balance (1=Work-focused, 10=Life-focused)`
    },
    {
      role: "user",
      content: `Assess culture preferences for this candidate:\n\nResume:\n${resumeText}${profileData ? `\n\nProfile: ${JSON.stringify(profileData)}` : ""}`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "candidate_culture_preferences",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hierarchy_vs_flat: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            innovation_vs_stability: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            individual_vs_team: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            process_vs_results: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            formal_vs_casual: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            competitive_vs_collaborative: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            risk_taking_vs_cautious: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            },
            work_life_balance: {
              type: "object",
              properties: {
                preferredScore: { type: "number" },
                importance: { type: "string", enum: ["critical", "important", "moderate", "flexible"] },
                reasoning: { type: "string" }
              },
              required: ["preferredScore", "importance", "reasoning"],
              additionalProperties: false
            }
          },
          required: [
            "hierarchy_vs_flat",
            "innovation_vs_stability",
            "individual_vs_team",
            "process_vs_results",
            "formal_vs_casual",
            "competitive_vs_collaborative",
            "risk_taking_vs_cautious",
            "work_life_balance"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}

/**
 * Calculate burnout risk score from assessment responses
 */
export function calculateBurnoutRisk(
  wellbeingNeeds: Record<string, number>, // factor -> importance (1-10)
  currentSatisfaction: Record<string, number> // factor -> current level (1-10)
): { 
  burnoutRiskScore: number; // 0-100 (higher = higher risk)
  riskLevel: "low" | "moderate" | "high" | "critical";
  contributingFactors: Array<{ factor: string; gap: number; impact: string }>;
  recommendations: string[];
} {
  const contributingFactors: Array<{ factor: string; gap: number; impact: string }> = [];
  let totalRisk = 0;
  let factorCount = 0;

  for (const factor in wellbeingNeeds) {
    const need = wellbeingNeeds[factor] || 5;
    const satisfaction = currentSatisfaction[factor] || 5;
    const gap = need - satisfaction;

    if (gap > 0) {
      // Unmet need contributes to burnout risk
      const riskContribution = (gap / 10) * need * 10; // Weighted by importance
      totalRisk += riskContribution;
      
      if (gap >= 3) {
        contributingFactors.push({
          factor,
          gap,
          impact: gap >= 5 ? "severe" : gap >= 3 ? "significant" : "moderate"
        });
      }
    }

    factorCount++;
  }

  const burnoutRiskScore = Math.min(100, Math.round(totalRisk / factorCount));

  let riskLevel: "low" | "moderate" | "high" | "critical";
  if (burnoutRiskScore < 30) riskLevel = "low";
  else if (burnoutRiskScore < 50) riskLevel = "moderate";
  else if (burnoutRiskScore < 70) riskLevel = "high";
  else riskLevel = "critical";

  const recommendations: string[] = [];

  // Generate recommendations based on top gaps
  const sortedFactors = contributingFactors.sort((a, b) => b.gap - a.gap);
  
  if (sortedFactors.length > 0) {
    recommendations.push(`Priority: Address ${sortedFactors[0].factor} (gap of ${sortedFactors[0].gap} points)`);
  }

  if (riskLevel === "critical" || riskLevel === "high") {
    recommendations.push("Immediate intervention recommended - consider wellbeing support programs");
    recommendations.push("Schedule regular check-ins with manager or HR");
  }

  if (sortedFactors.some(f => f.factor === "work_life_balance" && f.gap >= 3)) {
    recommendations.push("Consider flexible work arrangements or workload adjustment");
  }

  if (sortedFactors.some(f => f.factor === "stress_management" && f.gap >= 3)) {
    recommendations.push("Provide stress management resources and mental health support");
  }

  return {
    burnoutRiskScore,
    riskLevel,
    contributingFactors,
    recommendations
  };
}

/**
 * Generate culture fit report with AI insights
 */
export async function generateCultureFitReport(
  candidateName: string,
  companyName: string,
  dimensionScores: Record<string, { employerScore: number; candidateScore: number; compatibility: number }>,
  overallScore: number
): Promise<{
  summary: string;
  strengths: string[];
  potentialChallenges: string[];
  recommendations: string[];
}> {
  const dimensionDetails = Object.entries(dimensionScores)
    .map(([dim, scores]) => `${dim}: Employer ${scores.employerScore}/10, Candidate ${scores.candidateScore}/10, Compatibility ${scores.compatibility}%`)
    .join('\n');

  const messages: Message[] = [
    {
      role: "system",
      content: `You are an organizational psychologist specializing in culture fit assessment. Generate insightful culture fit reports that help both employers and candidates make informed decisions.`
    },
    {
      role: "user",
      content: `Generate a culture fit report for:

Candidate: ${candidateName}
Company: ${companyName}
Overall Culture Fit: ${overallScore}%

Dimension Scores:
${dimensionDetails}

Provide:
1. A summary of the overall culture fit
2. Key cultural strengths (areas of alignment)
3. Potential challenges (areas of misalignment)
4. Recommendations for both parties`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "culture_fit_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            potentialChallenges: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "strengths", "potentialChallenges", "recommendations"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  return JSON.parse(content);
}
