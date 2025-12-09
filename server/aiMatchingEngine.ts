/**
 * AI Matching Engine - 10,000+ Attribute System
 * Phase 15: Core matching logic with culture fit and wellbeing compatibility
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

/**
 * Extract attributes from job description using AI
 */
export async function extractJobAttributes(jobDescription: string): Promise<{
  technical: Array<{ name: string; importance: "required" | "preferred" | "nice_to_have"; confidence: number }>;
  soft: Array<{ name: string; importance: "required" | "preferred" | "nice_to_have"; confidence: number }>;
  experience: Array<{ name: string; value: string; confidence: number }>;
  education: Array<{ name: string; value: string; confidence: number }>;
  certifications: Array<{ name: string; confidence: number }>;
}> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an expert job description analyzer. Extract all relevant attributes from job descriptions with high precision.
      
Focus on:
- Technical skills (programming languages, tools, frameworks, technologies)
- Soft skills (communication, leadership, teamwork, problem-solving)
- Experience requirements (years, specific domains, industries)
- Education requirements (degrees, fields of study)
- Certifications (professional certifications, licenses)

For each attribute, assess its importance level (required, preferred, nice_to_have) and your confidence (0-100).`
    },
    {
      role: "user",
      content: `Extract all attributes from this job description:\n\n${jobDescription}`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "job_attributes",
        strict: true,
        schema: {
          type: "object",
          properties: {
            technical: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  importance: { type: "string", enum: ["required", "preferred", "nice_to_have"] },
                  confidence: { type: "number" }
                },
                required: ["name", "importance", "confidence"],
                additionalProperties: false
              }
            },
            soft: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  importance: { type: "string", enum: ["required", "preferred", "nice_to_have"] },
                  confidence: { type: "number" }
                },
                required: ["name", "importance", "confidence"],
                additionalProperties: false
              }
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "value", "confidence"],
                additionalProperties: false
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "value", "confidence"],
                additionalProperties: false
              }
            },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "confidence"],
                additionalProperties: false
              }
            }
          },
          required: ["technical", "soft", "experience", "education", "certifications"],
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
 * Extract attributes from candidate resume using AI
 */
export async function extractCandidateAttributes(resumeText: string): Promise<{
  technical: Array<{ name: string; proficiency: string; yearsOfExperience: number; confidence: number }>;
  soft: Array<{ name: string; evidence: string; confidence: number }>;
  experience: Array<{ name: string; value: string; confidence: number }>;
  education: Array<{ name: string; value: string; confidence: number }>;
  certifications: Array<{ name: string; issuer: string; year: number; confidence: number }>;
}> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an expert resume parser. Extract all relevant attributes from resumes with high precision.
      
Focus on:
- Technical skills with proficiency levels and years of experience
- Soft skills with evidence from resume
- Work experience (total years, specific domains, industries)
- Education (degrees, institutions, fields of study)
- Certifications (name, issuer, year obtained)

For each attribute, provide your confidence level (0-100).`
    },
    {
      role: "user",
      content: `Extract all attributes from this resume:\n\n${resumeText}`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "candidate_attributes",
        strict: true,
        schema: {
          type: "object",
          properties: {
            technical: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  proficiency: { type: "string" },
                  yearsOfExperience: { type: "number" },
                  confidence: { type: "number" }
                },
                required: ["name", "proficiency", "yearsOfExperience", "confidence"],
                additionalProperties: false
              }
            },
            soft: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  evidence: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "evidence", "confidence"],
                additionalProperties: false
              }
            },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "value", "confidence"],
                additionalProperties: false
              }
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["name", "value", "confidence"],
                additionalProperties: false
              }
            },
            certifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                  year: { type: "number" },
                  confidence: { type: "number" }
                },
                required: ["name", "issuer", "year", "confidence"],
                additionalProperties: false
              }
            }
          },
          required: ["technical", "soft", "experience", "education", "certifications"],
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
 * Calculate attribute-level match score
 */
export function calculateAttributeMatch(
  candidateValue: string,
  requiredValue: string,
  attributeType: "skill" | "experience" | "education" | "certification" | "trait" | "preference" | "value"
): { score: number; explanation: string } {
  // Simplified matching logic - in production, this would use semantic similarity, NLP, etc.
  
  if (!candidateValue || !requiredValue) {
    return { score: 0, explanation: "Missing value" };
  }

  const candidateLower = candidateValue.toLowerCase();
  const requiredLower = requiredValue.toLowerCase();

  // Exact match
  if (candidateLower === requiredLower) {
    return { score: 100, explanation: "Exact match" };
  }

  // Partial match
  if (candidateLower.includes(requiredLower) || requiredLower.includes(candidateLower)) {
    return { score: 75, explanation: "Partial match" };
  }

  // For numeric values (e.g., years of experience)
  const candidateNum = parseFloat(candidateValue);
  const requiredNum = parseFloat(requiredValue);
  if (!isNaN(candidateNum) && !isNaN(requiredNum)) {
    if (candidateNum >= requiredNum) {
      return { score: 100, explanation: `Meets requirement (${candidateNum} >= ${requiredNum})` };
    } else {
      const ratio = candidateNum / requiredNum;
      const score = Math.round(ratio * 100);
      return { score, explanation: `Below requirement (${candidateNum} / ${requiredNum})` };
    }
  }

  // No match
  return { score: 0, explanation: "No match found" };
}

/**
 * Calculate overall match score with weighted components
 */
export function calculateOverallMatch(
  technicalScore: number,
  cultureScore: number,
  wellbeingScore: number,
  weights: { technical: number; culture: number; wellbeing: number } = { technical: 40, culture: 30, wellbeing: 30 }
): number {
  const totalWeight = weights.technical + weights.culture + weights.wellbeing;
  const weightedScore = (
    (technicalScore * weights.technical) +
    (cultureScore * weights.culture) +
    (wellbeingScore * weights.wellbeing)
  ) / totalWeight;

  return Math.round(weightedScore);
}

/**
 * Generate AI match explanation
 */
export async function generateMatchExplanation(
  candidateName: string,
  jobTitle: string,
  overallScore: number,
  technicalScore: number,
  cultureScore: number,
  wellbeingScore: number,
  topStrengths: string[],
  topConcerns: string[]
): Promise<{
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an expert recruitment advisor. Generate clear, actionable match explanations for hiring managers.
      
Your explanations should:
- Summarize the overall fit in 2-3 sentences
- Highlight key strengths that make the candidate suitable
- Note any concerns or gaps that should be addressed
- Provide actionable recommendations for next steps`
    },
    {
      role: "user",
      content: `Generate a match explanation for:
      
Candidate: ${candidateName}
Job: ${jobTitle}

Match Scores:
- Overall: ${overallScore}/100
- Technical: ${technicalScore}/100
- Culture Fit: ${cultureScore}/100
- Wellbeing Compatibility: ${wellbeingScore}/100

Top Strengths:
${topStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Top Concerns:
${topConcerns.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    }
  ];

  const response = await invokeLLM({
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "match_explanation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "strengths", "concerns", "recommendations"],
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
 * Calculate culture fit score between employer and candidate
 */
export function calculateCultureFitScore(
  employerScores: Record<string, number>, // dimension -> score (1-10)
  candidateScores: Record<string, number>, // dimension -> preferred score (1-10)
  importanceWeights: Record<string, number> // dimension -> importance (0-100)
): { overallScore: number; dimensionScores: Record<string, { compatibility: number; difference: number }> } {
  const dimensionScores: Record<string, { compatibility: number; difference: number }> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const dimension in employerScores) {
    const employerScore = employerScores[dimension] || 5;
    const candidateScore = candidateScores[dimension] || 5;
    const weight = importanceWeights[dimension] || 50;

    const difference = Math.abs(employerScore - candidateScore);
    // Compatibility: 100% if identical, decreases with difference
    const compatibility = Math.max(0, 100 - (difference * 11.11)); // 11.11 = 100/9 (max difference is 9)

    dimensionScores[dimension] = { compatibility, difference };
    totalWeightedScore += compatibility * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  return { overallScore, dimensionScores };
}

/**
 * Calculate wellbeing compatibility score
 */
export function calculateWellbeingCompatibilityScore(
  employerSupport: Record<string, number>, // factor -> support level (1-10)
  candidateNeeds: Record<string, number>, // factor -> importance (1-10)
  candidateBurnoutRisk: number // 0-100
): { 
  overallScore: number; 
  factorScores: Record<string, { compatibility: number; burnoutRisk: "low" | "moderate" | "high" | "critical" }>;
  recommendations: string[];
} {
  const factorScores: Record<string, { compatibility: number; burnoutRisk: "low" | "moderate" | "high" | "critical" }> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const recommendations: string[] = [];

  for (const factor in candidateNeeds) {
    const support = employerSupport[factor] || 5;
    const need = candidateNeeds[factor] || 5;

    // Compatibility: employer support should meet or exceed candidate need
    let compatibility: number;
    if (support >= need) {
      compatibility = 100; // Needs are met
    } else {
      const gap = need - support;
      compatibility = Math.max(0, 100 - (gap * 20)); // Each point of gap reduces score by 20%
    }

    // Burnout risk assessment
    let burnoutRisk: "low" | "moderate" | "high" | "critical";
    if (support >= need) {
      burnoutRisk = "low";
    } else if (support >= need - 2) {
      burnoutRisk = "moderate";
    } else if (support >= need - 4) {
      burnoutRisk = "high";
    } else {
      burnoutRisk = "critical";
    }

    factorScores[factor] = { compatibility, burnoutRisk };
    totalWeightedScore += compatibility * need; // Weight by candidate's importance
    totalWeight += need;

    // Generate recommendations for gaps
    if (support < need) {
      recommendations.push(`Consider enhancing ${factor} support to better match candidate needs`);
    }
  }

  // Factor in overall burnout risk
  if (candidateBurnoutRisk > 70) {
    recommendations.push("Candidate shows high burnout risk - prioritize wellbeing initiatives");
  }

  const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

  return { overallScore, factorScores, recommendations };
}
