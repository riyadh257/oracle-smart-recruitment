import { ENV } from "./_core/env";
import { createWhatsappLog, updateWhatsappLogStatus } from "./visaComplianceDb";

interface SendWhatsAppMessageParams {
  to: string;
  message: string;
  messageType: 'daily_summary' | 'critical_alert' | 'weekly_report' | 'test_message' | 'compliance_reminder';
  userId: number;
}

export async function sendWhatsAppMessage(params: SendWhatsAppMessageParams): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  const { to, message, messageType, userId } = params;
  
  // Create log entry
  const logEntry = await createWhatsappLog({
    userId,
    phoneNumber: to,
    messageType,
    messageContent: message,
    status: 'pending',
  });
  
  try {
    // Check if Twilio credentials are available
    if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioFromNumber) {
      throw new Error("Twilio credentials not configured");
    }
    
    // Prepare Twilio API request
    const accountSid = ENV.twilioAccountSid;
    const authToken = ENV.twilioAuthToken;
    const fromNumber = ENV.twilioFromNumber;
    
    // Format the "to" number for WhatsApp (must include whatsapp: prefix)
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    
    // Make request to Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: whatsappFrom,
          To: whatsappTo,
          Body: message,
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send WhatsApp message');
    }
    
    const data = await response.json();
    
    // Update log with success
    await updateWhatsappLogStatus(logEntry.id, 'sent');
    
    return {
      success: true,
      messageSid: data.sid,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update log with failure
    await updateWhatsappLogStatus(logEntry.id, 'failed', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export function formatComplianceSummary(data: {
  totalEmployees: number;
  expiringSoon: number;
  expired: number;
  criticalAlerts: number;
  warningAlerts: number;
}): string {
  return `
📊 *Compliance Summary*

👥 Total Employees: ${data.totalEmployees}
⚠️ Expiring Soon: ${data.expiringSoon}
❌ Expired: ${data.expired}
🚨 Critical Alerts: ${data.criticalAlerts}
⚡ Warning Alerts: ${data.warningAlerts}

_Oracle Smart Recruitment System_
`.trim();
}

export function formatCriticalAlert(data: {
  employeeName: string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
}): string {
  return `
🚨 *CRITICAL COMPLIANCE ALERT*

Employee: ${data.employeeName}
Document: ${data.documentType}
Expires: ${new Date(data.expiryDate).toLocaleDateString()}
Days Remaining: ${data.daysRemaining}

⚠️ Immediate action required!

_Oracle Smart Recruitment System_
`.trim();
}
