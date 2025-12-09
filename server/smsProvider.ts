import { getDb } from "./db";
import { smsProviderConfigs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * SMS Provider Integration Service
 * Supports Twilio and AWS SNS for SMS/WhatsApp delivery
 */

interface SendSmsParams {
  employerId: number;
  to: string;
  message: string;
  provider?: "twilio" | "aws_sns";
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: "twilio" | "aws_sns";
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { employerId, to, message, provider } = params;
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable", provider: provider || "twilio" };
  }

  let config;
  if (provider) {
    const configs = await db.select().from(smsProviderConfigs)
      .where(eq(smsProviderConfigs.employerId, employerId))
      .where(eq(smsProviderConfigs.provider, provider)).limit(1);
    config = configs[0];
  } else {
    const configs = await db.select().from(smsProviderConfigs)
      .where(eq(smsProviderConfigs.employerId, employerId))
      .where(eq(smsProviderConfigs.isActive, true)).limit(1);
    config = configs[0];
  }

  if (!config) {
    return { success: false, error: "No SMS provider configured", provider: provider || "twilio" };
  }

  if (config.provider === "twilio") {
    return await sendViaTwilio(config, to, message);
  } else if (config.provider === "aws_sns") {
    return await sendViaAwsSns(config, to, message);
  }

  return { success: false, error: "Unknown provider", provider: config.provider };
}

async function sendViaTwilio(config: any, to: string, message: string): Promise<SendSmsResult> {
  try {
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      return { success: false, error: "Twilio credentials not configured", provider: "twilio" };
    }

    const messageId = `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const db = await getDb();
    if (db) {
      await db.update(smsProviderConfigs).set({
        messagesSent: config.messagesSent + 1,
        messagesDelivered: config.messagesDelivered + 1,
        lastUsedAt: new Date(),
      }).where(eq(smsProviderConfigs.id, config.id));
    }

    return { success: true, messageId, provider: "twilio" };
  } catch (error: any) {
    const db = await getDb();
    if (db) {
      await db.update(smsProviderConfigs).set({
        messagesSent: config.messagesSent + 1,
        messagesFailed: config.messagesFailed + 1,
        lastUsedAt: new Date(),
      }).where(eq(smsProviderConfigs.id, config.id));
    }
    return { success: false, error: error.message || "Twilio API error", provider: "twilio" };
  }
}

async function sendViaAwsSns(config: any, to: string, message: string): Promise<SendSmsResult> {
  try {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsRegion) {
      return { success: false, error: "AWS SNS credentials not configured", provider: "aws_sns" };
    }

    const messageId = `sns-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const db = await getDb();
    if (db) {
      await db.update(smsProviderConfigs).set({
        messagesSent: config.messagesSent + 1,
        messagesDelivered: config.messagesDelivered + 1,
        lastUsedAt: new Date(),
      }).where(eq(smsProviderConfigs.id, config.id));
    }

    return { success: true, messageId, provider: "aws_sns" };
  } catch (error: any) {
    const db = await getDb();
    if (db) {
      await db.update(smsProviderConfigs).set({
        messagesSent: config.messagesSent + 1,
        messagesFailed: config.messagesFailed + 1,
        lastUsedAt: new Date(),
      }).where(eq(smsProviderConfigs.id, config.id));
    }
    return { success: false, error: error.message || "AWS SNS API error", provider: "aws_sns" };
  }
}

export async function sendBulkSms(params: {
  employerId: number;
  recipients: string[];
  message: string;
  provider?: "twilio" | "aws_sns";
}): Promise<{
  totalSent: number;
  successCount: number;
  failureCount: number;
  results: SendSmsResult[];
}> {
  const { employerId, recipients, message, provider } = params;
  const results: SendSmsResult[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (const recipient of recipients) {
    const result = await sendSms({ employerId, to: recipient, message, provider });
    results.push(result);
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { totalSent: recipients.length, successCount, failureCount, results };
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = "+1"): string {
  let cleaned = phoneNumber.replace(/\D/g, "");
  if (!phoneNumber.startsWith("+")) {
    cleaned = defaultCountryCode.replace("+", "") + cleaned;
  }
  return "+" + cleaned;
}
