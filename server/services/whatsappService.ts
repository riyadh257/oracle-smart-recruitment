import { ENV } from '../_core/env';

interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +966501234567)
  body: string;
  mediaUrl?: string; // Optional image/document URL
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  templateParams: string[];
}

/**
 * WhatsApp Business API Service using Twilio
 * Sends instant mobile notifications to HR managers for critical compliance events
 */
export class WhatsAppService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioWhatsAppNumber: string;

  constructor() {
    this.twilioAccountSid = ENV.twilioAccountSid;
    this.twilioAuthToken = ENV.twilioAuthToken;
    this.twilioWhatsAppNumber = ENV.twilioFromNumber;

    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioWhatsAppNumber) {
      console.warn('[WhatsApp] Twilio credentials not configured. WhatsApp notifications will be disabled.');
    }
  }

  /**
   * Send a simple WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twilio not configured' };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: `whatsapp:${this.twilioWhatsAppNumber}`,
            To: `whatsapp:${message.to}`,
            Body: message.body,
            ...(message.mediaUrl && { MediaUrl: message.mediaUrl }),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[WhatsApp] Failed to send message:', error);
        return { success: false, error };
      }

      const data = await response.json();
      console.log(`[WhatsApp] Message sent successfully: ${data.sid}`);
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send work permit expiry alert to HR manager
   */
  async sendPermitExpiryAlert(params: {
    to: string;
    candidateName: string;
    permitNumber: string;
    expiryDate: Date;
    daysRemaining: number;
  }): Promise<{ success: boolean; messageId?: string }> {
    const urgencyLevel = params.daysRemaining <= 7 ? '🚨 URGENT' : params.daysRemaining <= 30 ? '⚠️ WARNING' : '📋 NOTICE';
    
    const message = `${urgencyLevel}: Work Permit Expiring

👤 Employee: ${params.candidateName}
📄 Permit #: ${params.permitNumber}
📅 Expiry Date: ${params.expiryDate.toLocaleDateString('en-SA')}
⏰ Days Remaining: ${params.daysRemaining}

${params.daysRemaining <= 7 ? '⚠️ IMMEDIATE ACTION REQUIRED - Initiate renewal process now to avoid compliance violations!' : 'Please initiate renewal process soon.'}

Oracle Smart Recruitment System`;

    return this.sendMessage({
      to: params.to,
      body: message,
    });
  }

  /**
   * Send Saudization compliance alert
   */
  async sendSaudizationAlert(params: {
    to: string;
    currentBand: string;
    targetBand: string;
    saudiHiresNeeded: number;
    currentPercentage: number;
    targetPercentage: number;
  }): Promise<{ success: boolean; messageId?: string }> {
    const message = `🇸🇦 Saudization Compliance Alert

Current Nitaqat Band: ${params.currentBand.toUpperCase()}
Target Band: ${params.targetBand.toUpperCase()}

📊 Current Saudization: ${params.currentPercentage.toFixed(1)}%
🎯 Target: ${params.targetPercentage.toFixed(1)}%

👥 Saudi Hires Needed: ${params.saudiHiresNeeded}

Take action to improve your Nitaqat status and access benefits.

Oracle Smart Recruitment System`;

    return this.sendMessage({
      to: params.to,
      body: message,
    });
  }

  /**
   * Send bulk notification to multiple HR managers
   */
  async sendBulkNotifications(
    recipients: string[],
    messageGenerator: (recipient: string) => WhatsAppMessage
  ): Promise<{ sent: number; failed: number; results: Array<{ to: string; success: boolean; messageId?: string }> }> {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const message = messageGenerator(recipient);
      const result = await this.sendMessage(message);
      
      results.push({
        to: recipient,
        success: result.success,
        messageId: result.messageId,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting: Wait 1 second between messages to avoid Twilio throttling
      if (recipients.indexOf(recipient) < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[WhatsApp] Bulk send complete: ${sent} sent, ${failed} failed`);
    return { sent, failed, results };
  }

  /**
   * Send compliance violation alert
   */
  async sendComplianceViolationAlert(params: {
    to: string;
    violationType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    actionRequired: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const severityEmoji = {
      low: '📌',
      medium: '⚠️',
      high: '🚨',
      critical: '🔴',
    };

    const message = `${severityEmoji[params.severity]} Compliance Alert

Type: ${params.violationType}
Severity: ${params.severity.toUpperCase()}

${params.description}

Action Required:
${params.actionRequired}

Oracle Smart Recruitment System`;

    return this.sendMessage({
      to: params.to,
      body: message,
    });
  }

  /**
   * Send daily compliance summary to HR managers
   */
  async sendDailyComplianceSummary(params: {
    to: string;
    expiringPermitsCount: number;
    complianceViolations: number;
    saudizationStatus: string;
    actionItems: string[];
  }): Promise<{ success: boolean; messageId?: string }> {
    const actionItemsList = params.actionItems.length > 0 
      ? params.actionItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
      : 'No pending actions';

    const message = `📊 Daily Compliance Summary

🔔 Expiring Permits: ${params.expiringPermitsCount}
⚠️ Compliance Issues: ${params.complianceViolations}
🇸🇦 Saudization: ${params.saudizationStatus}

Action Items:
${actionItemsList}

Oracle Smart Recruitment System`;

    return this.sendMessage({
      to: params.to,
      body: message,
    });
  }

  /**
   * Check if Twilio is properly configured
   */
  private isConfigured(): boolean {
    return !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioWhatsAppNumber);
  }

  /**
   * Validate phone number format (E.164)
   */
  static validatePhoneNumber(phone: string): boolean {
    // E.164 format: +[country code][number] (e.g., +966501234567)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format Saudi phone number to E.164
   */
  static formatSaudiNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If starts with 966, add +
    if (digits.startsWith('966')) {
      return '+' + digits;
    }
    
    // If starts with 0, replace with +966
    if (digits.startsWith('0')) {
      return '+966' + digits.substring(1);
    }
    
    // If just the number without country code, add +966
    if (digits.length === 9) {
      return '+966' + digits;
    }
    
    return phone; // Return as-is if format is unclear
  }
}

export const whatsappService = new WhatsAppService();
