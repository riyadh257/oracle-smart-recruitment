import { describe, it, expect } from "vitest";
import { getActiveSMSConfig, isValidPhoneNumber, formatPhoneNumber } from "./smsService";

describe("SMS Service", () => {
  it("validates phone number format correctly", () => {
    // Valid formats
    expect(isValidPhoneNumber("+966501234567")).toBe(true);
    expect(isValidPhoneNumber("+15551234567")).toBe(true);
    expect(isValidPhoneNumber("5551234567")).toBe(true); // Will be formatted to +15551234567
    
    // Invalid formats
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("123")).toBe(false);
  });

  it("formats phone numbers to E.164 correctly", () => {
    expect(formatPhoneNumber("+966501234567")).toBe("+966501234567");
    expect(formatPhoneNumber("966501234567")).toBe("+966501234567");
    expect(formatPhoneNumber("5551234567")).toBe("+15551234567");
    expect(formatPhoneNumber("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("checks Twilio credentials are configured", async () => {
    // Check environment variables are set
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    expect(accountSid).toBeDefined();
    expect(accountSid).not.toBe("");
    expect(authToken).toBeDefined();
    expect(authToken).not.toBe("");
    expect(fromNumber).toBeDefined();
    expect(fromNumber).not.toBe("");

    // Validate format of credentials
    expect(accountSid?.startsWith("AC")).toBe(true); // Twilio Account SIDs start with AC
    expect(accountSid?.length).toBe(34); // Twilio Account SIDs are 34 characters
    expect(authToken?.length).toBe(32); // Twilio Auth Tokens are 32 characters
    expect(isValidPhoneNumber(fromNumber || "")).toBe(true); // Phone number must be valid E.164
  });

  it("validates Twilio credentials by checking account info", async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    // Make a lightweight API call to verify credentials
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    expect(response.ok).toBe(true);
    
    if (response.ok) {
      const data = await response.json();
      expect(data.sid).toBe(accountSid);
      expect(data.status).toBeDefined();
      console.log(`✓ Twilio account verified: ${data.friendly_name || data.sid}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Type: ${data.type}`);
    } else {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || "Unknown error"}`);
    }
  });
});
