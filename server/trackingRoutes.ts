import { Router, Request, Response } from "express";
import { trackEmailOpen, trackEmailClick, getTrackingPixelImage } from "./emailTracking";

const router = Router();

/**
 * Tracking pixel endpoint for email opens
 * GET /api/track/open/:trackingId
 */
router.get("/open/:trackingId", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  
  try {
    // Track the open event asynchronously
    trackEmailOpen(trackingId).catch(err => {
      console.error("[Tracking Route] Error tracking open:", err);
    });
    
    // Immediately return the 1x1 transparent pixel
    const pixel = getTrackingPixelImage();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.send(pixel);
  } catch (error) {
    console.error("[Tracking Route] Error in open endpoint:", error);
    // Still return pixel even if tracking fails
    const pixel = getTrackingPixelImage();
    res.setHeader("Content-Type", "image/png");
    res.send(pixel);
  }
});

/**
 * Click tracking endpoint with redirect
 * GET /api/track/click/:trackingId?url=<encoded_target_url>
 */
router.get("/click/:trackingId", async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  const targetUrl = req.query.url as string;
  
  if (!targetUrl) {
    return res.status(400).send("Missing target URL");
  }
  
  try {
    // Decode the target URL
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Track the click event asynchronously
    trackEmailClick(trackingId, decodedUrl).catch(err => {
      console.error("[Tracking Route] Error tracking click:", err);
    });
    
    // Redirect to the target URL immediately
    res.redirect(302, decodedUrl);
  } catch (error) {
    console.error("[Tracking Route] Error in click endpoint:", error);
    // Still redirect even if tracking fails
    try {
      const decodedUrl = decodeURIComponent(targetUrl);
      res.redirect(302, decodedUrl);
    } catch (decodeError) {
      res.status(400).send("Invalid target URL");
    }
  }
});

export default router;
