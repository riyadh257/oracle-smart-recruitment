/**
 * Gmail MCP Integration for Compliance Alerts
 * Sends automated email notifications for work permit expiry and compliance violations
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ComplianceEmailAlert {
  recipientEmail: string;
  subject: string;
  content: string;
  severity: "critical" | "high" | "medium";
  permitDetails?: {
    permitNumber: string;
    employeeName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }[];
}

/**
 * Send compliance alert email via Gmail MCP
 */
export async function sendComplianceAlertEmail(
  alert: ComplianceEmailAlert
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format email content with proper structure
    const emailContent = formatComplianceEmailContent(alert);

    // Prepare MCP command input
    const mcpInput = {
      messages: [
        {
          subject: alert.subject,
          to: [alert.recipientEmail],
          content: emailContent,
        },
      ],
    };

    // Call Gmail MCP to send email
    const { stdout, stderr } = await execAsync(
      `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${JSON.stringify(mcpInput).replace(/'/g, "'\\''")}'`
    );

    if (stderr && !stderr.includes("OAuth")) {
      console.error("[Gmail MCP] Error:", stderr);
      return {
        success: false,
        error: stderr,
      };
    }

    console.log("[Gmail MCP] Email sent successfully:", stdout);

    return {
      success: true,
      messageId: extractMessageId(stdout),
    };
  } catch (error) {
    console.error("[Gmail MCP] Failed to send compliance alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Format compliance alert email content
 */
function formatComplianceEmailContent(alert: ComplianceEmailAlert): string {
  const severityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "ℹ️",
  };

  let content = `${severityEmoji[alert.severity]} COMPLIANCE ALERT - ${alert.severity.toUpperCase()} PRIORITY\n\n`;
  content += `Dear HR Manager,\n\n`;
  content += `This is an automated compliance alert from Oracle Smart Recruitment System.\n\n`;

  if (alert.permitDetails && alert.permitDetails.length > 0) {
    content += `WORK PERMIT EXPIRY ALERTS:\n`;
    content += `${"=".repeat(60)}\n\n`;

    for (const permit of alert.permitDetails) {
      const status =
        permit.daysUntilExpiry < 0
          ? "EXPIRED"
          : permit.daysUntilExpiry <= 30
          ? "CRITICAL"
          : permit.daysUntilExpiry <= 60
          ? "HIGH PRIORITY"
          : "MEDIUM PRIORITY";

      content += `Permit Number: ${permit.permitNumber}\n`;
      content += `Employee: ${permit.employeeName}\n`;
      content += `Expiry Date: ${permit.expiryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}\n`;
      content += `Days Until Expiry: ${permit.daysUntilExpiry >= 0 ? permit.daysUntilExpiry : "EXPIRED"}\n`;
      content += `Status: ${status}\n`;
      content += `\n`;
    }
  }

  content += `\nACTION REQUIRED:\n`;
  content += `${"=".repeat(60)}\n`;

  if (alert.severity === "critical") {
    content += `⚠️ URGENT: Immediate action required to avoid compliance violations.\n`;
    content += `- Review all expired and expiring permits immediately\n`;
    content += `- Initiate renewal process for critical cases\n`;
    content += `- Contact MHRSD/Qiwa for expedited processing if needed\n`;
  } else if (alert.severity === "high") {
    content += `Please initiate the renewal process for the listed work permits.\n`;
    content += `- Prepare required documentation\n`;
    content += `- Submit renewal applications via Qiwa platform\n`;
    content += `- Monitor application status regularly\n`;
  } else {
    content += `Plan ahead for upcoming permit renewals.\n`;
    content += `- Review employee documentation\n`;
    content += `- Prepare renewal timeline\n`;
    content += `- Budget for renewal fees\n`;
  }

  content += `\n\nCOMPLIANCE DASHBOARD:\n`;
  content += `Login to Oracle Smart Recruitment System to view detailed compliance metrics:\n`;
  content += `https://3000-idwo78zlhka3iktk6e0fw-19199da1.manus-asia.computer/compliance/dashboard\n\n`;

  content += `\nThis is an automated message. Please do not reply to this email.\n`;
  content += `For support, contact your system administrator.\n\n`;

  content += `---\n`;
  content += `Oracle Smart Recruitment System\n`;
  content += `Compliance Monitoring Service\n`;

  return content;
}

/**
 * Extract message ID from MCP output
 */
function extractMessageId(output: string): string | undefined {
  try {
    const match = output.match(/"id":\s*"([^"]+)"/);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Send bulk compliance alerts to multiple recipients
 */
export async function sendBulkComplianceAlerts(
  alerts: ComplianceEmailAlert[]
): Promise<{
  totalSent: number;
  successful: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  for (const alert of alerts) {
    const result = await sendComplianceAlertEmail(alert);
    results.push({
      email: alert.recipientEmail,
      success: result.success,
      error: result.error,
    });

    // Add delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    totalSent: alerts.length,
    successful,
    failed,
    results,
  };
}

/**
 * Test Gmail connection
 */
export async function testGmailConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const { stdout, stderr } = await execAsync(
      `manus-mcp-cli tool call gmail_search_messages --server gmail --input '{"max_results": 1}'`
    );

    if (stderr && !stderr.includes("OAuth")) {
      return {
        connected: false,
        error: stderr,
      };
    }

    return {
      connected: true,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
