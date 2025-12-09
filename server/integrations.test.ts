import { describe, expect, it } from "vitest";
import { runAbTestAutoAnalysis } from "./jobs/abTestAutoAnalysis";

describe("Phase 2 Integration Enhancements", () => {
  describe("A/B Test Auto-Analysis Job", () => {
    it("should run without errors", async () => {
      const result = await runAbTestAutoAnalysis();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
      
      if (result.success) {
        expect(result).toHaveProperty("testsAnalyzed");
        expect(result).toHaveProperty("winnersFound");
        expect(typeof result.testsAnalyzed).toBe("number");
        expect(typeof result.winnersFound).toBe("number");
        expect(result.testsAnalyzed).toBeGreaterThanOrEqual(0);
        expect(result.winnersFound).toBeGreaterThanOrEqual(0);
        expect(result.winnersFound).toBeLessThanOrEqual(result.testsAnalyzed);
      } else {
        expect(result).toHaveProperty("error");
        expect(typeof result.error).toBe("string");
      }
    });

    it("should handle empty test database gracefully", async () => {
      // This test verifies the job doesn't crash when no tests exist
      const result = await runAbTestAutoAnalysis();
      
      // Should succeed even with no tests
      expect(result.success).toBe(true);
      expect(result.testsAnalyzed).toBe(0);
      expect(result.winnersFound).toBe(0);
    });
  });

  describe("Smart Send Time Optimizer Integration", () => {
    it("should be importable without errors", () => {
      // Test that the component can be imported
      // This verifies there are no syntax errors in the integration
      expect(() => {
        require("../client/src/components/SmartSendTimeOptimizer");
      }).not.toThrow();
    });
  });

  describe("A/B Test Dashboard", () => {
    it("should be importable without errors", () => {
      // Test that the dashboard page can be imported
      expect(() => {
        require("../client/src/pages/ABTestDashboard");
      }).not.toThrow();
    });
  });

  describe("Job Scheduler", () => {
    it("should export initialization function", () => {
      const scheduler = require("./jobs/scheduler");
      
      expect(scheduler).toHaveProperty("initializeScheduledJobs");
      expect(typeof scheduler.initializeScheduledJobs).toBe("function");
      expect(scheduler).toHaveProperty("stopScheduledJobs");
      expect(typeof scheduler.stopScheduledJobs).toBe("function");
    });

    it("should have valid cron schedule configuration", () => {
      const { AB_TEST_AUTO_ANALYSIS_SCHEDULE } = require("./jobs/abTestAutoAnalysis");
      
      expect(AB_TEST_AUTO_ANALYSIS_SCHEDULE).toBeDefined();
      expect(AB_TEST_AUTO_ANALYSIS_SCHEDULE).toHaveProperty("cron");
      expect(AB_TEST_AUTO_ANALYSIS_SCHEDULE).toHaveProperty("timezone");
      expect(AB_TEST_AUTO_ANALYSIS_SCHEDULE).toHaveProperty("description");
      
      // Verify cron expression format (6 fields for node-cron)
      const cronParts = AB_TEST_AUTO_ANALYSIS_SCHEDULE.cron.split(" ");
      expect(cronParts.length).toBe(6);
      
      // Verify timezone is UTC
      expect(AB_TEST_AUTO_ANALYSIS_SCHEDULE.timezone).toBe("UTC");
    });
  });

  describe("Email Campaign Builder Integration", () => {
    it("should import SmartSendTimeOptimizer component", () => {
      // Verify the integration is properly imported
      const fs = require("fs");
      const path = require("path");
      
      const builderPath = path.join(
        __dirname,
        "../client/src/components/EmailCampaignBuilder.tsx"
      );
      
      const content = fs.readFileSync(builderPath, "utf-8");
      
      // Check for import statement
      expect(content).toContain("import { SmartSendTimeOptimizer }");
      
      // Check for state management
      expect(content).toContain("showSendTimeOptimizer");
      
      // Check for dialog component
      expect(content).toContain("<SmartSendTimeOptimizer");
    });

    it("should have send time optimization card", () => {
      const fs = require("fs");
      const path = require("path");
      
      const builderPath = path.join(
        __dirname,
        "../client/src/components/EmailCampaignBuilder.tsx"
      );
      
      const content = fs.readFileSync(builderPath, "utf-8");
      
      // Check for optimization card
      expect(content).toContain("Smart Send Time Optimization");
      expect(content).toContain("AI-powered recommendations");
      expect(content).toContain("View Send Time Recommendations");
    });
  });

  describe("App Routing", () => {
    it("should have A/B test dashboard route registered", () => {
      const fs = require("fs");
      const path = require("path");
      
      const appPath = path.join(__dirname, "../client/src/App.tsx");
      const content = fs.readFileSync(appPath, "utf-8");
      
      // Check for import
      expect(content).toContain("import ABTestDashboard from");
      
      // Check for route
      expect(content).toContain('/ab-testing/dashboard');
      expect(content).toContain('component={ABTestDashboard}');
    });
  });

  describe("Server Initialization", () => {
    it("should initialize A/B test scheduler on startup", () => {
      const fs = require("fs");
      const path = require("path");
      
      const serverPath = path.join(__dirname, "_core/index.ts");
      const content = fs.readFileSync(serverPath, "utf-8");
      
      // Check for scheduler import
      expect(content).toContain("import { initializeScheduledJobs as initAbTestScheduler }");
      expect(content).toContain('from "../jobs/scheduler"');
      
      // Check for initialization call
      expect(content).toContain("initAbTestScheduler()");
      
      // Check for comment
      expect(content).toContain("Initialize A/B test auto-analysis scheduler");
    });
  });
});
