export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Jusoor Altaskeen";

export const APP_LOGO = "/jt-logo.png";

// Company Information
export const COMPANY_NAME = "Jusoor Altaskeen";
export const COMPANY_EMAIL = "info@jt.com.sa";
export const COMPANY_ADDRESS = "Al Malqa District, Riyadh 13525, Saudi Arabia";

// Brand Colors
export const BRAND_COLORS = {
  primary: "#1F233E",      // JT Blue (dark navy)
  secondary: "#04DBFA",    // Vivid Sky Blue (bright cyan)
  accent: "#00E3B5",       // Robin Egg Blue (turquoise)
  white: "#FFFFFF",
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
