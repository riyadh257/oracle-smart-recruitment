/**
 * SMS Service Module
 * Supports Twilio, AWS SNS, and custom SMS providers
 */

import { getDb } from "./db";
import { smsProviderConfig, smsNotificationLog } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SMSConfig {
  provider: 'twilio' | 'aws_sns' | 'custom';
  accountSid?: string;
  authToken?: string;
  fromPhoneNumber?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  customApiUrl?: string;
  customApiKey?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  error?: string;
  cost?: number;
  segments?: number;
}

/**
 * Get active SMS provider configuration
 */
export async function getActiveSMSConfig(): Promise<SMSConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const [config] = await db
    .select()
    .from(smsProviderConfig)
    .where(eq(smsProviderConfig.isActive, 1))
    .limit(1);

  if (!config) return null;

  return {
    provider: config.provider,
    accountSid: config.accountSid || undefined,
    authToken: config.authToken || undefined,
    fromPhoneNumber: config.fromPhoneNumber || undefined,
    awsAccessKeyId: config.awsAccessKeyId || undefined,
    awsSecretAccessKey: config.awsSecretAccessKey || undefined,
    awsRegion: config.awsRegion || undefined,
    customApiUrl: config.customApiUrl || undefined,
    customApiKey: config.customApiKey || undefined,
  };
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSResult> {
  if (!config.accountSid || !config.authToken || !config.fromPhoneNumber) {
    return {
      success: false,
      status: 'failed',
      error: 'Twilio configuration incomplete',
    };
  }

  try {
    // Twilio REST API
    const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: config.fromPhoneNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        error: data.message || 'Twilio API error',
      };
    }

    return {
      success: true,
      messageId: data.sid,
      status: data.status === 'queued' || data.status === 'sent' ? 'sent' : 'pending',
      cost: data.price ? Math.abs(parseFloat(data.price)) * 100 : 0,
      segments: data.num_segments || 1,
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS via AWS SNS
 */
async function sendViaAWSSNS(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSResult> {
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsRegion) {
    return {
      success: false,
      status: 'failed',
      error: 'AWS SNS configuration incomplete',
    };
  }

  try {
    // AWS SNS SDK would be used here
    // For now, return a placeholder implementation
    // In production, install @aws-sdk/client-sns and use it
    
    return {
      success: false,
      status: 'failed',
      error: 'AWS SNS integration requires @aws-sdk/client-sns package',
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS via custom API
 */
async function sendViaCustom(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSResult> {
  if (!config.customApiUrl || !config.customApiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'Custom API configuration incomplete',
    };
  }

  try {
    const response = await fetch(config.customApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.customApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        error: data.error || 'Custom API error',
      };
    }

    return {
      success: true,
      messageId: data.messageId || data.id,
      status: 'sent',
      cost: data.cost || 0,
      segments: data.segments || 1,
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, add it
  if (!phone.startsWith('+')) {
    // If it's a 10-digit number, assume US/Canada (+1)
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // Otherwise, add + prefix
    return `+${digits}`;
  }
  
  return `+${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // E.164 format: + followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}

/**
 * Send SMS notification
 */
export async function sendSMS(
  userId: number,
  phoneNumber: string,
  message: string,
  notificationId?: number
): Promise<SMSResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      status: 'failed',
      error: 'Database not available',
    };
  }

  // Validate phone number
  if (!isValidPhoneNumber(phoneNumber)) {
    return {
      success: false,
      status: 'failed',
      error: 'Invalid phone number format',
    };
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Get active SMS configuration
  const config = await getActiveSMSConfig();
  if (!config) {
    return {
      success: false,
      status: 'failed',
      error: 'No active SMS provider configured',
    };
  }

  // Send SMS based on provider
  let result: SMSResult;
  switch (config.provider) {
    case 'twilio':
      result = await sendViaTwilio(config, formattedPhone, message);
      break;
    case 'aws_sns':
      result = await sendViaAWSSNS(config, formattedPhone, message);
      break;
    case 'custom':
      result = await sendViaCustom(config, formattedPhone, message);
      break;
    default:
      result = {
        success: false,
        status: 'failed',
        error: 'Unknown SMS provider',
      };
  }

  // Log SMS attempt
  await db.insert(smsNotificationLog).values({
    notificationId: notificationId || null,
    userId,
    phoneNumber: formattedPhone,
    message,
    provider: config.provider,
    messageId: result.messageId || null,
    status: result.status,
    deliveredAt: result.status === 'delivered' ? new Date().toISOString() : null,
    failureReason: result.error || null,
    cost: result.cost || 0,
    segments: result.segments || 1,
  });

  return result;
}

/**
 * Update SMS delivery status (webhook handler)
 */
export async function updateSMSStatus(
  messageId: string,
  status: 'delivered' | 'failed' | 'undelivered',
  failureReason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(smsNotificationLog)
    .set({
      status,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : null,
      failureReason: failureReason || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(smsNotificationLog.messageId, messageId));
}

/**
 * Get SMS usage statistics
 */
export async function getSMSUsageStats(userId?: number): Promise<{
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCost: number;
  deliveryRate: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalCost: 0,
      deliveryRate: 0,
    };
  }

  // This would use proper aggregation queries in production
  // For now, return placeholder
  return {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalCost: 0,
    deliveryRate: 0,
  };
}
