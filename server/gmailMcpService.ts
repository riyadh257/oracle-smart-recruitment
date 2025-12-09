/**
 * Gmail MCP Service - Integration with Gmail via MCP
 * Provides email sending functionality using the Gmail MCP server
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface EmailMessage {
  to: string[];
  subject: string;
  content: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email via Gmail MCP
 */
export async function sendEmailViaGmail(
  message: EmailMessage
): Promise<SendEmailResult> {
  try {
    const input = JSON.stringify({
      messages: [
        {
          to: message.to,
          subject: message.subject,
          content: message.content,
          cc: message.cc,
          bcc: message.bcc,
          attachments: message.attachments,
        },
      ],
    });

    const command = `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${input.replace(/'/g, "'\\''")}'`;

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (stderr && !stderr.includes("Tool call saved")) {
      console.error("Gmail MCP stderr:", stderr);
    }

    // Parse the output to check for success
    // The MCP CLI returns JSON with the result
    try {
      const result = JSON.parse(stdout);
      if (result.content && Array.isArray(result.content)) {
        const textContent = result.content.find((c: any) => c.type === "text");
        if (textContent) {
          // Check if the text indicates success
          const text = textContent.text;
          if (text.includes("successfully sent") || text.includes("Message sent")) {
            return {
              success: true,
              messageId: extractMessageId(text),
            };
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Gmail MCP response:", parseError);
    }

    return {
      success: true, // Assume success if no error was thrown
    };
  } catch (error) {
    console.error("Failed to send email via Gmail MCP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send multiple emails in batch via Gmail MCP
 * Note: Gmail MCP supports up to 100 messages per call
 */
export async function sendBulkEmailsViaGmail(
  messages: EmailMessage[]
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];
  
  // Process in batches of 100 (Gmail MCP limit)
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    try {
      const input = JSON.stringify({
        messages: batch.map(msg => ({
          to: msg.to,
          subject: msg.subject,
          content: msg.content,
          cc: msg.cc,
          bcc: msg.bcc,
          attachments: msg.attachments,
        })),
      });

      const command = `manus-mcp-cli tool call gmail_send_messages --server gmail --input '${input.replace(/'/g, "'\\''")}'`;

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes("Tool call saved")) {
        console.error("Gmail MCP stderr:", stderr);
      }

      // Add success results for each message in the batch
      for (let j = 0; j < batch.length; j++) {
        results.push({
          success: true,
          messageId: `batch-${i + j}`,
        });
      }
    } catch (error) {
      console.error("Failed to send batch via Gmail MCP:", error);
      // Add failure results for each message in the batch
      for (let j = 0; j < batch.length; j++) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  
  return results;
}

/**
 * Extract message ID from Gmail MCP response text
 */
function extractMessageId(text: string): string | undefined {
  const match = text.match(/Message ID: ([a-zA-Z0-9]+)/);
  return match ? match[1] : undefined;
}
