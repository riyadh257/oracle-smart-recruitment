import { describe, expect, it } from "vitest";
import { convertToCSV, generateAnalyticsPDFHTML, generateCandidatesPDFHTML } from "./exportUtils";

describe("Export Utilities", () => {
  describe("convertToCSV", () => {
    it("should convert array of objects to CSV format", () => {
      const data = [
        { name: "John Doe", age: 30, city: "New York" },
        { name: "Jane Smith", age: 25, city: "Los Angeles" },
      ];

      const csv = convertToCSV(data);
      const lines = csv.split("\n");

      expect(lines.length).toBe(3); // Header + 2 data rows
      expect(lines[0]).toBe("name,age,city");
      expect(lines[1]).toBe("John Doe,30,New York");
      expect(lines[2]).toBe("Jane Smith,25,Los Angeles");
    });

    it("should handle empty arrays", () => {
      const csv = convertToCSV([]);
      expect(csv).toBe("");
    });

    it("should escape commas in values", () => {
      const data = [{ name: "Doe, John", company: "Tech, Inc." }];
      const csv = convertToCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe('"Doe, John","Tech, Inc."');
    });

    it("should handle null and undefined values", () => {
      const data = [{ name: "John", age: null, city: undefined }];
      const csv = convertToCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe("John,,");
    });

    it("should use custom headers when provided", () => {
      const data = [
        { firstName: "John", lastName: "Doe", age: 30 },
        { firstName: "Jane", lastName: "Smith", age: 25 },
      ];

      const csv = convertToCSV(data, ["firstName", "age"]);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("firstName,age");
      expect(lines[1]).toBe("John,30");
      expect(lines[2]).toBe("Jane,25");
    });
  });

  describe("generateAnalyticsPDFHTML", () => {
    it("should generate valid HTML for analytics PDF", () => {
      const html = generateAnalyticsPDFHTML({
        title: "Test Analytics Report",
        generatedAt: "2024-01-01 12:00:00",
        metrics: [
          { label: "Total Candidates", value: 150 },
          { label: "Active Jobs", value: 25 },
        ],
        charts: [
          {
            title: "Applications Over Time",
            description: "Monthly application trends",
          },
        ],
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Test Analytics Report");
      expect(html).toContain("2024-01-01 12:00:00");
      expect(html).toContain("Total Candidates");
      expect(html).toContain("150");
      expect(html).toContain("Applications Over Time");
    });

    it("should handle empty charts array", () => {
      const html = generateAnalyticsPDFHTML({
        title: "Simple Report",
        generatedAt: "2024-01-01",
        metrics: [{ label: "Test", value: 100 }],
      });

      expect(html).toContain("Simple Report");
      expect(html).not.toContain("Visualizations");
    });
  });

  describe("generateCandidatesPDFHTML", () => {
    it("should generate valid HTML for candidates PDF", () => {
      const html = generateCandidatesPDFHTML({
        title: "Candidates Report",
        generatedAt: "2024-01-01 12:00:00",
        candidates: [
          {
            name: "John Doe",
            email: "john@example.com",
            skills: ["JavaScript", "React", "Node.js"],
            experience: 5,
            location: "New York",
            status: "Active",
          },
          {
            name: "Jane Smith",
            email: "jane@example.com",
            skills: ["Python", "Django"],
            experience: 3,
            location: "San Francisco",
            status: "Inactive",
          },
        ],
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Candidates Report");
      expect(html).toContain("Total Candidates: 2");
      expect(html).toContain("John Doe");
      expect(html).toContain("john@example.com");
      expect(html).toContain("JavaScript, React, Node.js");
      expect(html).toContain("5 years");
      expect(html).toContain("Jane Smith");
    });

    it("should truncate skills list when more than 3 skills", () => {
      const html = generateCandidatesPDFHTML({
        title: "Test",
        generatedAt: "2024-01-01",
        candidates: [
          {
            name: "John Doe",
            email: "john@example.com",
            skills: ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
            experience: 5,
            location: "NYC",
            status: "Active",
          },
        ],
      });

      expect(html).toContain("Skill1, Skill2, Skill3...");
      expect(html).not.toContain("Skill4");
    });
  });
});
