import { invokeLLM } from "./_core/llm";

/**
 * GenAI Inference Layer - Oracle Smart Recruitment
 * 
 * This module transforms the system from a passive sorter to an active AI agent that:
 * 1. Enriches vague job descriptions by inferring missing requirements
 * 2. Provides AI-powered career coaching to candidates
 * 3. Optimizes resumes for better matching
 * 4. Suggests career paths and growth opportunities
 */

export interface EnrichedJobDescription {
  originalDescription: string;
  enrichedDescription: string;
  inferredSkills: string[];
  inferredRequirements: string[];
  suggestedImprovements: string[];
  clarityScore: number;
  completenessScore: number;
}

/**
 * Enrich a job description by inferring missing information
 * Transforms vague JDs into comprehensive, structured postings
 */
export async function enrichJobDescription(
  jobData: {
    title: string;
    originalDescription: string;
    requiredSkills?: string[];
    location?: string;
    workSetting?: string;
    employmentType?: string;
    salaryMin?: number;
    salaryMax?: number;
  }
): Promise<EnrichedJobDescription> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert recruitment AI that enriches job descriptions by inferring missing information.
Your task is to:
1. Analyze the original job description for completeness and clarity
2. Infer missing technical skills, soft skills, and requirements
3. Suggest improvements to make the JD more attractive and complete
4. Create an enriched version that's optimized for candidate matching
5. Maintain the original intent while adding valuable context

Be specific and actionable. Infer realistic requirements based on the job title and description.`
        },
        {
          role: "user",
          content: `Enrich this job description:

JOB TITLE: ${jobData.title}
ORIGINAL DESCRIPTION:
${jobData.originalDescription}

EXISTING SKILLS: ${jobData.requiredSkills?.join(", ") || "None specified"}
LOCATION: ${jobData.location || "Not specified"}
WORK SETTING: ${jobData.workSetting || "Not specified"}
EMPLOYMENT TYPE: ${jobData.employmentType || "Not specified"}
SALARY RANGE: ${jobData.salaryMin && jobData.salaryMax ? `$${jobData.salaryMin} - $${jobData.salaryMax}` : "Not specified"}

Return a JSON object with:
{
  "enrichedDescription": "<improved, detailed description>",
  "inferredSkills": ["list of technical skills inferred from the role"],
  "inferredRequirements": ["list of requirements, qualifications, or experience levels"],
  "suggestedImprovements": ["list of suggestions to improve the JD"],
  "clarityScore": <0-100, how clear is the original JD>,
  "completenessScore": <0-100, how complete is the original JD>
}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_enrichment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              enrichedDescription: { type: "string" },
              inferredSkills: { type: "array", items: { type: "string" } },
              inferredRequirements: { type: "array", items: { type: "string" } },
              suggestedImprovements: { type: "array", items: { type: "string" } },
              clarityScore: { type: "number" },
              completenessScore: { type: "number" }
            },
            required: [
              "enrichedDescription",
              "inferredSkills",
              "inferredRequirements",
              "suggestedImprovements",
              "clarityScore",
              "completenessScore"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from GenAI service");
    }

    const enrichment = JSON.parse(content);
    
    return {
      originalDescription: jobData.originalDescription,
      ...enrichment
    };

  } catch (error) {
    console.error("GenAI Job Enrichment Error:", error);
    
    // Fallback: return original with minimal enrichment
    return {
      originalDescription: jobData.originalDescription,
      enrichedDescription: jobData.originalDescription,
      inferredSkills: [],
      inferredRequirements: [],
      suggestedImprovements: ["AI enrichment temporarily unavailable"],
      clarityScore: 50,
      completenessScore: 50
    };
  }
}

export interface CoachingResponse {
  response: string;
  actionableAdvice: string[];
  resources: string[];
  nextSteps: string[];
}

/**
 * Provide AI-powered career coaching to candidates
 * Covers resume review, career path, interview prep, and general advice
 */
export async function provideCareerCoaching(
  candidateProfile: any,
  sessionType: "resume_review" | "career_path" | "interview_prep" | "general",
  userQuery: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<CoachingResponse> {
  try {
    const systemPrompts = {
      resume_review: `You are an expert resume coach helping candidates optimize their resumes for better job matching.
Provide specific, actionable feedback on:
- Content structure and clarity
- Keyword optimization for ATS systems
- Achievement quantification
- Skills presentation
- Formatting and readability`,
      
      career_path: `You are an expert career advisor helping candidates plan their career trajectory.
Provide guidance on:
- Career progression opportunities
- Skill development priorities
- Industry trends and demands
- Transition strategies
- Long-term career planning`,
      
      interview_prep: `You are an expert interview coach helping candidates prepare for job interviews.
Provide guidance on:
- Common interview questions and answers
- STAR method for behavioral questions
- Company research strategies
- Salary negotiation tactics
- Follow-up best practices`,
      
      general: `You are an expert career coach providing comprehensive career guidance.
Help candidates with any career-related questions including job search strategies,
networking, professional development, work-life balance, and career transitions.`
    };

    const messages = [
      {
        role: "system" as const,
        content: systemPrompts[sessionType]
      },
      {
        role: "system" as const,
        content: `CANDIDATE PROFILE CONTEXT:
Skills: ${candidateProfile.skills?.join(", ") || "Not specified"}
Experience: ${candidateProfile.yearsOfExperience || "Not specified"} years
Current Role: ${candidateProfile.currentJobTitle || "Not specified"}
Career Goals: ${candidateProfile.careerGoals || "Not specified"}
Education: ${candidateProfile.education?.join(", ") || "Not specified"}`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory as any);
    }

    // Add current user query
    messages.push({
      role: "user" as const,
      content: userQuery
    });

    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "coaching_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              response: { type: "string" },
              actionableAdvice: { type: "array", items: { type: "string" } },
              resources: { type: "array", items: { type: "string" } },
              nextSteps: { type: "array", items: { type: "string" } }
            },
            required: ["response", "actionableAdvice", "resources", "nextSteps"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI coach");
    }

    return JSON.parse(content);

  } catch (error) {
    console.error("AI Career Coaching Error:", error);
    
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      actionableAdvice: ["AI coaching temporarily unavailable"],
      resources: [],
      nextSteps: ["Please try your question again"]
    };
  }
}

export interface ResumeOptimization {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  keywordSuggestions: string[];
  structureSuggestions: string[];
  contentImprovements: string[];
  atsCompatibilityScore: number;
}

/**
 * Analyze and optimize a candidate's resume
 * Provides detailed feedback for better ATS compatibility and matching
 */
export async function optimizeResume(
  resumeText: string,
  targetJobTitle?: string,
  targetIndustry?: string
): Promise<ResumeOptimization> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert resume optimization AI that helps candidates improve their resumes for better ATS compatibility and job matching.
Analyze resumes for:
- ATS keyword optimization
- Content structure and clarity
- Achievement quantification
- Skills presentation
- Formatting issues
- Industry-specific best practices`
        },
        {
          role: "user",
          content: `Analyze and optimize this resume:

RESUME TEXT:
${resumeText}

${targetJobTitle ? `TARGET JOB TITLE: ${targetJobTitle}` : ""}
${targetIndustry ? `TARGET INDUSTRY: ${targetIndustry}` : ""}

Provide comprehensive feedback in JSON format:
{
  "overallScore": <0-100>,
  "strengths": ["list of resume strengths"],
  "weaknesses": ["list of areas to improve"],
  "keywordSuggestions": ["keywords to add for better ATS matching"],
  "structureSuggestions": ["structural improvements"],
  "contentImprovements": ["specific content improvements"],
  "atsCompatibilityScore": <0-100>
}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_optimization",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              keywordSuggestions: { type: "array", items: { type: "string" } },
              structureSuggestions: { type: "array", items: { type: "string" } },
              contentImprovements: { type: "array", items: { type: "string" } },
              atsCompatibilityScore: { type: "number" }
            },
            required: [
              "overallScore",
              "strengths",
              "weaknesses",
              "keywordSuggestions",
              "structureSuggestions",
              "contentImprovements",
              "atsCompatibilityScore"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from resume optimizer");
    }

    return JSON.parse(content);

  } catch (error) {
    console.error("Resume Optimization Error:", error);
    
    return {
      overallScore: 50,
      strengths: [],
      weaknesses: ["AI analysis temporarily unavailable"],
      keywordSuggestions: [],
      structureSuggestions: [],
      contentImprovements: [],
      atsCompatibilityScore: 50
    };
  }
}

export interface CareerPathRecommendation {
  currentRole: string;
  suggestedPaths: Array<{
    title: string;
    timeframe: string;
    requiredSkills: string[];
    description: string;
    salaryRange: string;
    demandLevel: string;
  }>;
  skillGaps: string[];
  learningResources: string[];
  industryTrends: string[];
}

/**
 * Generate personalized career path recommendations
 * Helps candidates understand growth opportunities and skill development priorities
 */
export async function generateCareerPath(
  candidateProfile: any
): Promise<CareerPathRecommendation> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert career advisor that helps candidates plan their career trajectory.
Provide realistic, actionable career path recommendations based on their current profile.
Consider industry trends, skill demands, and typical career progressions.`
        },
        {
          role: "user",
          content: `Generate career path recommendations for this candidate:

CURRENT PROFILE:
Current Role: ${candidateProfile.currentJobTitle || "Not specified"}
Skills: ${candidateProfile.skills?.join(", ") || "Not specified"}
Experience: ${candidateProfile.yearsOfExperience || 0} years
Education: ${candidateProfile.education?.join(", ") || "Not specified"}
Career Goals: ${candidateProfile.careerGoals || "Not specified"}
Industry: ${candidateProfile.industryExperience?.join(", ") || "Not specified"}

Provide 3-5 realistic career paths in JSON format.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "career_path",
          strict: true,
          schema: {
            type: "object",
            properties: {
              currentRole: { type: "string" },
              suggestedPaths: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    timeframe: { type: "string" },
                    requiredSkills: { type: "array", items: { type: "string" } },
                    description: { type: "string" },
                    salaryRange: { type: "string" },
                    demandLevel: { type: "string" }
                  },
                  required: ["title", "timeframe", "requiredSkills", "description", "salaryRange", "demandLevel"],
                  additionalProperties: false
                }
              },
              skillGaps: { type: "array", items: { type: "string" } },
              learningResources: { type: "array", items: { type: "string" } },
              industryTrends: { type: "array", items: { type: "string" } }
            },
            required: ["currentRole", "suggestedPaths", "skillGaps", "learningResources", "industryTrends"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from career path generator");
    }

    return JSON.parse(content);

  } catch (error) {
    console.error("Career Path Generation Error:", error);
    
    return {
      currentRole: candidateProfile.currentJobTitle || "Current Role",
      suggestedPaths: [],
      skillGaps: ["AI analysis temporarily unavailable"],
      learningResources: [],
      industryTrends: []
    };
  }
}
