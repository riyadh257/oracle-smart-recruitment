import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Gmail MCP Integration Module
 * Provides email sending capabilities through Gmail MCP server
 */

interface GmailSendOptions {
  to: string[];
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
}

interface GmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Gmail MCP
 */
export async function sendGmailMessage(
  options: GmailSendOptions
): Promise<GmailSendResult> {
  try {
    const messagePayload = {
      messages: [
        {
          to: options.to,
          subject: options.subject,
          content: options.content,
          ...(options.cc && { cc: options.cc }),
          ...(options.bcc && { bcc: options.bcc }),
          ...(options.attachments && { attachments: options.attachments }),
        },
      ],
    };

    const inputJson = JSON.stringify(messagePayload);
    const escapedInput = inputJson.replace(/'/g, "'\\''");

    const command = `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${escapedInput}'`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("Tip:")) {
      console.error("[Gmail MCP] Error:", stderr);
      return {
        success: false,
        error: stderr,
      };
    }

    // Parse the output to extract message ID if available
    const output = stdout.trim();
    console.log("[Gmail MCP] Email sent successfully:", output);

    return {
      success: true,
      messageId: `gmail-${Date.now()}`,
    };
  } catch (error) {
    console.error("[Gmail MCP] Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send multiple emails via Gmail MCP (batch sending)
 */
export async function sendGmailBatch(
  messages: GmailSendOptions[]
): Promise<{ success: boolean; results: GmailSendResult[] }> {
  try {
    const messagePayload = {
      messages: messages.map((msg) => ({
        to: msg.to,
        subject: msg.subject,
        content: msg.content,
        ...(msg.cc && { cc: msg.cc }),
        ...(msg.bcc && { bcc: msg.bcc }),
        ...(msg.attachments && { attachments: msg.attachments }),
      })),
    };

    const inputJson = JSON.stringify(messagePayload);
    const escapedInput = inputJson.replace(/'/g, "'\\''");

    const command = `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${escapedInput}'`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr && !stderr.includes("Tip:")) {
      console.error("[Gmail MCP Batch] Error:", stderr);
      return {
        success: false,
        results: messages.map(() => ({
          success: false,
          error: stderr,
        })),
      };
    }

    console.log("[Gmail MCP Batch] Emails sent successfully:", stdout.trim());

    return {
      success: true,
      results: messages.map(() => ({
        success: true,
        messageId: `gmail-${Date.now()}`,
      })),
    };
  } catch (error) {
    console.error("[Gmail MCP Batch] Failed to send emails:", error);
    return {
      success: false,
      results: messages.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })),
    };
  }
}

/**
 * Convert HTML email to plain text for Gmail
 * Gmail MCP requires plain text content
 */
export function htmlToPlainText(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<style[^>]*>.*?<\/style>/gi, "");
  text = text.replace(/<script[^>]*>.*?<\/script>/gi, "");
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, "\n\n");
  text = text.trim();

  return text;
}

/**
 * Test Gmail MCP connection
 */
export async function testGmailConnection(): Promise<boolean> {
  try {
    const result = await sendGmailMessage({
      to: ["test@example.com"],
      subject: "Gmail MCP Connection Test",
      content: "This is a test message to verify Gmail MCP integration.",
    });

    return result.success;
  } catch (error) {
    console.error("[Gmail MCP] Connection test failed:", error);
    return false;
  }
}

/**
 * Generate weekly digest email content
 */
export function generateWeeklyDigestContent(data: {
  userName: string;
  totalCandidates: number;
  newApplications: number;
  interviewsScheduled: number;
  feedbackPending: number;
  topPerformers: Array<{ name: string; score: number }>;
  campaignMetrics?: {
    emailsSent: number;
    openRate: number;
    clickRate: number;
  };
  budgetStatus?: {
    spent: number;
    remaining: number;
    percentUsed: number;
  };
}): string {
  const { 
    userName, 
    totalCandidates, 
    newApplications, 
    interviewsScheduled, 
    feedbackPending,
    topPerformers,
    campaignMetrics,
    budgetStatus
  } = data;

  let content = `Hello ${userName},\n\n`;
  content += `Here's your weekly recruitment summary:\n\n`;
  
  content += `=== CANDIDATE PIPELINE ===\n`;
  content += `Total Active Candidates: ${totalCandidates}\n`;
  content += `New Applications This Week: ${newApplications}\n`;
  content += `Interviews Scheduled: ${interviewsScheduled}\n`;
  content += `Pending Feedback: ${feedbackPending}\n\n`;

  if (topPerformers.length > 0) {
    content += `=== TOP PERFORMERS ===\n`;
    topPerformers.forEach((performer, idx) => {
      content += `${idx + 1}. ${performer.name} - Score: ${performer.score}\n`;
    });
    content += `\n`;
  }

  if (campaignMetrics) {
    content += `=== EMAIL CAMPAIGN PERFORMANCE ===\n`;
    content += `Emails Sent: ${campaignMetrics.emailsSent}\n`;
    content += `Open Rate: ${campaignMetrics.openRate.toFixed(1)}%\n`;
    content += `Click Rate: ${campaignMetrics.clickRate.toFixed(1)}%\n\n`;
  }

  if (budgetStatus) {
    content += `=== BUDGET STATUS ===\n`;
    content += `Spent: $${budgetStatus.spent.toLocaleString()}\n`;
    content += `Remaining: $${budgetStatus.remaining.toLocaleString()}\n`;
    content += `Usage: ${budgetStatus.percentUsed.toFixed(1)}%\n`;
    
    if (budgetStatus.percentUsed > 80) {
      content += `\n⚠️ WARNING: Budget usage exceeds 80%\n`;
    }
    content += `\n`;
  }

  content += `---\n`;
  content += `This is an automated weekly digest from Oracle Smart Recruitment System.\n`;
  content += `Log in to the dashboard for detailed analytics and actions.\n`;

  return content;
}

/**
 * Generate budget alert email content
 */
export function generateBudgetAlertContent(data: {
  userName: string;
  budgetName: string;
  currentSpending: number;
  budgetLimit: number;
  percentUsed: number;
  threshold: number;
  projectedOverrun?: number;
}): string {
  const { userName, budgetName, currentSpending, budgetLimit, percentUsed, threshold, projectedOverrun } = data;

  let content = `Hello ${userName},\n\n`;
  content += `⚠️ BUDGET ALERT: ${budgetName}\n\n`;
  
  content += `Your recruitment budget has reached ${percentUsed.toFixed(1)}% of the allocated limit.\n\n`;
  
  content += `=== BUDGET DETAILS ===\n`;
  content += `Budget Name: ${budgetName}\n`;
  content += `Current Spending: $${currentSpending.toLocaleString()}\n`;
  content += `Budget Limit: $${budgetLimit.toLocaleString()}\n`;
  content += `Remaining: $${(budgetLimit - currentSpending).toLocaleString()}\n`;
  content += `Alert Threshold: ${threshold}%\n\n`;

  if (projectedOverrun && projectedOverrun > 0) {
    content += `⚠️ PROJECTED OVERRUN: $${projectedOverrun.toLocaleString()}\n`;
    content += `Based on current spending trends, you may exceed the budget.\n\n`;
  }

  content += `=== RECOMMENDED ACTIONS ===\n`;
  if (percentUsed >= 90) {
    content += `- URGENT: Review and pause non-critical campaigns\n`;
    content += `- Consider requesting budget increase\n`;
    content += `- Prioritize high-ROI recruitment channels\n`;
  } else if (percentUsed >= 80) {
    content += `- Review upcoming scheduled campaigns\n`;
    content += `- Optimize spending on underperforming channels\n`;
    content += `- Monitor daily spending closely\n`;
  } else {
    content += `- Monitor spending trends\n`;
    content += `- Review budget allocation across campaigns\n`;
  }

  content += `\n---\n`;
  content += `This is an automated budget alert from Oracle Smart Recruitment System.\n`;
  content += `Log in to the dashboard to review detailed budget analytics.\n`;

  return content;
}
