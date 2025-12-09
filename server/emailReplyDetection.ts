/**
 * Email Reply Detection and Parsing Service
 * Automatically parse and categorize candidate email responses
 */

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { processEngagementEvent } from "./engagementWorkflows";

export interface EmailReply {
  id: number;
  employerId: number;
  candidateId: number;
  emailAnalyticsId?: number;
  replyType: "positive" | "negative" | "neutral" | "question" | "out_of_office" | "unsubscribe";
  sentiment: "very_positive" | "positive" | "neutral" | "negative" | "very_negative";
  sentimentScore: number;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  keywords: string[];
  extractedInfo: Record<string, any>;
  workflowTriggered: boolean;
  engagementUpdated: boolean;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
}

/**
 * Analyze email reply using AI
 */
async function analyzeReplyWithAI(subject: string, bodyText: string): Promise<{
  replyType: EmailReply["replyType"];
  sentiment: EmailReply["sentiment"];
  sentimentScore: number;
  keywords: string[];
  extractedInfo: Record<string, any>;
}> {
  const prompt = `Analyze this candidate email reply and extract structured information:

Subject: ${subject}
Body: ${bodyText}

Provide analysis in JSON format with these fields:
- replyType: one of [positive, negative, neutral, question, out_of_office, unsubscribe]
- sentiment: one of [very_positive, positive, neutral, negative, very_negative]
- sentimentScore: number from 0 (very negative) to 100 (very positive)
- keywords: array of 3-5 key phrases from the email
- extractedInfo: object with any relevant extracted data like:
  * availabilityDates: if candidate mentions availability
  * questions: array of questions the candidate asked
  * concerns: array of concerns raised
  * interests: topics the candidate expressed interest in
  * nextSteps: any next steps mentioned

Be concise and accurate.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert at analyzing recruitment email responses." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              replyType: {
                type: "string",
                enum: ["positive", "negative", "neutral", "question", "out_of_office", "unsubscribe"],
              },
              sentiment: {
                type: "string",
                enum: ["very_positive", "positive", "neutral", "negative", "very_negative"],
              },
              sentimentScore: { type: "number" },
              keywords: {
                type: "array",
                items: { type: "string" },
              },
              extractedInfo: {
                type: "object",
                additionalProperties: true,
              },
            },
            required: ["replyType", "sentiment", "sentimentScore", "keywords", "extractedInfo"],
            additionalProperties: false,
          },
        },
      },
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error("[Email Reply] AI analysis failed:", error);
    // Fallback to basic analysis
    return {
      replyType: "neutral",
      sentiment: "neutral",
      sentimentScore: 50,
      keywords: [],
      extractedInfo: {},
    };
  }
}

/**
 * Process incoming email reply
 */
export async function processEmailReply(data: {
  employerId: number;
  candidateId: number;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: Date;
  emailAnalyticsId?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Analyze reply with AI
  const analysis = await analyzeReplyWithAI(data.subject, data.bodyText);

  // Store reply
  const [result] = await db.execute(
    `INSERT INTO emailReplies 
     (employerId, candidateId, emailAnalyticsId, replyType, sentiment, sentimentScore,
      subject, bodyText, bodyHtml, keywords, extractedInfo, receivedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.employerId,
      data.candidateId,
      data.emailAnalyticsId || null,
      analysis.replyType,
      analysis.sentiment,
      analysis.sentimentScore,
      data.subject,
      data.bodyText,
      data.bodyHtml || null,
      JSON.stringify(analysis.keywords),
      JSON.stringify(analysis.extractedInfo),
      data.receivedAt,
    ]
  ) as any;

  const replyId = result.insertId;

  // Update engagement score
  await updateEngagementFromReply(data.candidateId, data.employerId, analysis);

  // Mark as processed
  await db.execute(
    `UPDATE emailReplies 
     SET processedAt = NOW(), workflowTriggered = TRUE, engagementUpdated = TRUE
     WHERE id = ?`,
    [replyId]
  );

  // Trigger workflows
  await processEngagementEvent(data.candidateId, data.employerId, "response_received");

  return replyId;
}

/**
 * Update candidate engagement score based on reply
 */
async function updateEngagementFromReply(
  candidateId: number,
  employerId: number,
  analysis: {
    replyType: string;
    sentiment: string;
    sentimentScore: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate engagement boost based on reply type and sentiment
  let engagementBoost = 0;

  switch (analysis.replyType) {
    case "positive":
      engagementBoost = 15;
      break;
    case "question":
      engagementBoost = 10;
      break;
    case "neutral":
      engagementBoost = 5;
      break;
    case "negative":
      engagementBoost = -5;
      break;
    case "unsubscribe":
      engagementBoost = -20;
      break;
    case "out_of_office":
      engagementBoost = 0;
      break;
  }

  // Adjust based on sentiment
  if (analysis.sentiment === "very_positive") engagementBoost += 5;
  if (analysis.sentiment === "very_negative") engagementBoost -= 5;

  // Update engagement
  await db.execute(
    `UPDATE candidateEngagement 
     SET totalResponses = totalResponses + 1,
         responseRate = (totalResponses + 1) / GREATEST(totalEmailsSent, 1) * 100,
         engagementScore = LEAST(GREATEST(engagementScore + ?, 0), 100),
         lastEngagementAt = NOW()
     WHERE candidateId = ? AND employerId = ?`,
    [engagementBoost, candidateId, employerId]
  );

  // Recalculate engagement level
  const { updateCandidateEngagementLevel } = await import("./candidateEngagement");
  await updateCandidateEngagementLevel(candidateId, employerId);
}

/**
 * Get email replies for a candidate
 */
export async function getCandidateReplies(
  candidateId: number,
  employerId: number
): Promise<EmailReply[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [rows] = await db.execute(
    `SELECT * FROM emailReplies 
     WHERE candidateId = ? AND employerId = ?
     ORDER BY receivedAt DESC`,
    [candidateId, employerId]
  ) as any;

  return rows.map((row: any) => ({
    ...row,
    keywords: JSON.parse(row.keywords || "[]"),
    extractedInfo: JSON.parse(row.extractedInfo || "{}"),
  }));
}

/**
 * Get all replies for an employer
 */
export async function getEmployerReplies(
  employerId: number,
  options?: {
    replyType?: EmailReply["replyType"];
    sentiment?: EmailReply["sentiment"];
    limit?: number;
  }
): Promise<Array<EmailReply & { candidateName: string; candidateEmail: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = `
    SELECT er.*, c.name as candidateName, c.email as candidateEmail
    FROM emailReplies er
    JOIN candidates c ON er.candidateId = c.id
    WHERE er.employerId = ?
  `;
  const params: any[] = [employerId];

  if (options?.replyType) {
    query += " AND er.replyType = ?";
    params.push(options.replyType);
  }
  if (options?.sentiment) {
    query += " AND er.sentiment = ?";
    params.push(options.sentiment);
  }

  query += " ORDER BY er.receivedAt DESC";

  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  const [rows] = await db.execute(query, params) as any;

  return rows.map((row: any) => ({
    ...row,
    keywords: JSON.parse(row.keywords || "[]"),
    extractedInfo: JSON.parse(row.extractedInfo || "{}"),
  }));
}

/**
 * Get reply statistics
 */
export async function getReplyStats(employerId: number): Promise<{
  totalReplies: number;
  positiveReplies: number;
  negativeReplies: number;
  questions: number;
  avgSentimentScore: number;
  recentReplies: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [stats] = await db.execute(
    `SELECT 
       COUNT(*) as totalReplies,
       SUM(CASE WHEN replyType = 'positive' THEN 1 ELSE 0 END) as positiveReplies,
       SUM(CASE WHEN replyType = 'negative' THEN 1 ELSE 0 END) as negativeReplies,
       SUM(CASE WHEN replyType = 'question' THEN 1 ELSE 0 END) as questions,
       AVG(sentimentScore) as avgSentimentScore,
       SUM(CASE WHEN receivedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recentReplies
     FROM emailReplies
     WHERE employerId = ?`,
    [employerId]
  ) as any;

  const result = stats[0] || {};
  return {
    totalReplies: parseInt(result.totalReplies || 0),
    positiveReplies: parseInt(result.positiveReplies || 0),
    negativeReplies: parseInt(result.negativeReplies || 0),
    questions: parseInt(result.questions || 0),
    avgSentimentScore: parseFloat(result.avgSentimentScore || 50),
    recentReplies: parseInt(result.recentReplies || 0),
  };
}
