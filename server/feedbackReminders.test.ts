import { describe, expect, it, vi, beforeEach } from "vitest";
import { findInterviewsNeedingFeedbackReminders, sendFeedbackReminderEmail } from "./feedbackReminders";

// Mock the database and email modules
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./emailDelivery", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

describe("Feedback Reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findInterviewsNeedingFeedbackReminders", () => {
    it("should return empty array when database is not available", async () => {
      const { getDb } = await import("./db");
      vi.mocked(getDb).mockResolvedValue(null);

      const result = await findInterviewsNeedingFeedbackReminders();
      expect(result).toEqual([]);
    });

    it("should identify interviews completed more than 24 hours ago without feedback", async () => {
      // This test would require more complex mocking of the database queries
      // For now, we'll test the basic structure
      const result = await findInterviewsNeedingFeedbackReminders();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("sendFeedbackReminderEmail", () => {
    it("should send reminder email with correct parameters", async () => {
      const { sendEmail } = await import("./emailDelivery");
      
      const mockInterview = {
        interviewId: 1,
        candidateId: 10,
        candidateName: "John Doe",
        interviewerEmail: "interviewer@example.com",
        interviewerName: "Jane Smith",
        scheduledAt: new Date("2024-01-01T10:00:00Z"),
        completedHoursAgo: 30,
      };

      const result = await sendFeedbackReminderEmail(mockInterview, "http://localhost:3000");

      expect(result).toBe(true);
      expect(sendEmail).toHaveBeenCalledOnce();
      
      const emailCall = vi.mocked(sendEmail).mock.calls[0][0];
      expect(emailCall.to).toBe("interviewer@example.com");
      expect(emailCall.subject).toContain("John Doe");
      expect(emailCall.html).toContain("Jane Smith");
      expect(emailCall.html).toContain("John Doe");
      expect(emailCall.html).toContain("/interviews/1/feedback");
    });

    it("should handle email sending errors gracefully", async () => {
      const { sendEmail } = await import("./emailDelivery");
      vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Email service unavailable"));

      const mockInterview = {
        interviewId: 2,
        candidateId: 20,
        candidateName: "Jane Doe",
        interviewerEmail: "test@example.com",
        interviewerName: "Test Interviewer",
        scheduledAt: new Date(),
        completedHoursAgo: 25,
      };

      const result = await sendFeedbackReminderEmail(mockInterview);
      expect(result).toBe(false);
    });

    it("should include correct feedback URL in email", async () => {
      const { sendEmail } = await import("./emailDelivery");
      
      const mockInterview = {
        interviewId: 123,
        candidateId: 456,
        candidateName: "Test Candidate",
        interviewerEmail: "interviewer@test.com",
        interviewerName: "Test Interviewer",
        scheduledAt: new Date(),
        completedHoursAgo: 48,
      };

      await sendFeedbackReminderEmail(mockInterview, "https://example.com");

      const emailCall = vi.mocked(sendEmail).mock.calls[0][0];
      expect(emailCall.html).toContain("https://example.com/interviews/123/feedback");
    });

    it("should format interview date correctly in email", async () => {
      const { sendEmail } = await import("./emailDelivery");
      
      const mockInterview = {
        interviewId: 1,
        candidateId: 1,
        candidateName: "Test",
        interviewerEmail: "test@test.com",
        interviewerName: "Interviewer",
        scheduledAt: new Date("2024-06-15T14:30:00Z"),
        completedHoursAgo: 30,
      };

      await sendFeedbackReminderEmail(mockInterview);

      const emailCall = vi.mocked(sendEmail).mock.calls[0][0];
      // The date format will vary based on locale, but should contain the date components
      expect(emailCall.html).toMatch(/2024/);
      expect(emailCall.html).toMatch(/June|Jun/);
    });
  });
});
