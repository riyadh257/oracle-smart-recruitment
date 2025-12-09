import { Express, Request, Response } from "express";
import { trackEmailOpen, trackEmailClick, getTrackingPixelImage } from "./emailTracking";

/**
 * Email Tracking HTTP Routes
 * Handles tracking pixel and click redirect endpoints
 */

export function registerEmailTrackingRoutes(app: Express) {
  /**
   * Tracking pixel endpoint for email opens
   * Returns a 1x1 transparent GIF
   */
  app.get("/api/email/track/open/:trackingId", async (req: Request, res: Response) => {
    const { trackingId } = req.params;

    // Track the open event (fire and forget)
    trackEmailOpen(trackingId).catch((error: any) => {
      console.error("[Email Tracking] Failed to track open:", error);
    });

    // Return a 1x1 transparent PNG
    const pixel = getTrackingPixelImage();

    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": pixel.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end(pixel);
  });

  /**
   * Click tracking endpoint with redirect
   * Tracks the click and redirects to the target URL
   */
  app.get("/api/email/track/click/:trackingId", async (req: Request, res: Response) => {
    const { trackingId } = req.params;
    const targetUrl = req.query.url as string;

    if (!targetUrl) {
      return res.status(400).send("Missing target URL");
    }

    // Decode the target URL
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Track the click event (fire and forget)
    trackEmailClick(trackingId, decodedUrl).catch((error: any) => {
      console.error("[Email Tracking] Failed to track click:", error);
    });

    // Redirect to the target URL
    res.redirect(302, decodedUrl);
  });

  console.log("[Email Tracking] Routes registered successfully");
}
