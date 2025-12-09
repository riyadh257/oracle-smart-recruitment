import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "../realtimeNotifications";
import { initializeScheduledJobs } from "../scheduledJobs";
import { initializeScheduledJobs as initJobRunner } from "../scheduledJobRunner";
import { initializeExportScheduler } from "../services/exportScheduler";
import { initializeScheduledComplianceChecks } from "../scheduledComplianceChecks";
import { initializeComplianceScheduler } from "../complianceScheduledJobs";
import { registerEmailTrackingRoutes } from "../emailTrackingRoutes";
import { initializeScheduledJobs as initAbTestScheduler } from "../jobs/scheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Email tracking routes (open pixel and click redirects)
  registerEmailTrackingRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Initialize WebSocket for real-time notifications
  initializeWebSocket(server);
  
  // Initialize scheduled jobs
  initializeScheduledJobs();
  
  // Initialize scheduled job runner for automated tasks
  initJobRunner();
  
  // Initialize export scheduler for recurring exports
  // initializeExportScheduler(); // Temporarily disabled - missing scheduledExports table
  
  // Initialize scheduled compliance checks
  initializeScheduledComplianceChecks();
  
  // Initialize visa compliance scheduler
  initializeComplianceScheduler();
  
  // Initialize A/B test auto-analysis scheduler
  initAbTestScheduler();
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Scheduler initialization removed for Oracle Smart Recruitment
  });
}

startServer().catch(console.error);
