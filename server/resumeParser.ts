import { invokeLLM } from "./_core/llm";

/**
 * Resume Parser - Extracts structured data from resume text using AI
 * Supports PDF, DOCX, and TXT formats via text extraction
 */

export interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  yearsOfExperience?: number;
  technicalSkills?: string[];
  softSkills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year?: number;
  }>;
  workExperience?: Array<{
    title: string;
    company: string;
    duration?: string;
    description?: string;
  }>;
  certifications?: string[];
  languages?: string[];
}

export async function parseResumeText(resumeText: string): Promise<ParsedResume> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a resume parsing expert. Extract structured information from resumes accurately.
Return ONLY valid JSON with no additional text or markdown formatting.`
      },
      {
        role: "user",
        content: `Parse this resume and extract all relevant information:\n\n${resumeText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "parsed_resume",
        strict: true,
        schema: {
          type: "object",
          properties: {
            fullName: { type: "string", description: "Candidate's full name" },
            email: { type: "string", description: "Email address" },
            phone: { type: "string", description: "Phone number" },
            location: { type: "string", description: "Current location/city" },
            headline: { type: "string", description: "Professional headline or title" },
            summary: { type: "string", description: "Professional summary or objective" },
            yearsOfExperience: { type: "integer", description: "Total years of professional experience" },
            technicalSkills: {
              type: "array",
              items: { type: "string" },
              description: "List of technical skills"
            },
            softSkills: {
              type: "array",
              items: { type: "string" },
              description: "List of soft skills"
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  degree: { type: "string" },
                  institution: { type: "string" },
                  year: { type: "integer" }
                },
                required: ["degree", "institution"],
                additionalProperties: false
              },
              description: "Educational background"
            },
            workExperience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  duration: { type: "string" },
                  description: { type: "string" }
                },
                required: ["title", "company"],
                additionalProperties: false
              },
              description: "Work experience history"
            },
            certifications: {
              type: "array",
              items: { type: "string" },
              description: "Professional certifications"
            },
            languages: {
              type: "array",
              items: { type: "string" },
              description: "Languages spoken"
            }
          },
          required: [],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI resume parser");
  }

  try {
    return JSON.parse(content) as ParsedResume;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid response format from AI parser");
  }
}

/**
 * Extract text from PDF using pdf-parse library
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = await import("pdf-parse");
  const data = await pdfParse.default(buffer);
  return data.text;
}

/**
 * Main resume parsing function that handles file upload and extraction
 */
export async function parseResumeFile(fileBuffer: Buffer, mimeType: string): Promise<ParsedResume> {
  let resumeText: string;

  if (mimeType === "application/pdf") {
    resumeText = await extractTextFromPDF(fileBuffer);
  } else if (mimeType === "text/plain") {
    resumeText = fileBuffer.toString("utf-8");
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    // For DOCX files, use mammoth library
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    resumeText = result.value;
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error("Resume text is too short or empty");
  }

  return parseResumeText(resumeText);
}
