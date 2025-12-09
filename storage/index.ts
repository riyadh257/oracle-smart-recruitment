import { ENV } from "../server/_core/env";

/**
 * Upload a file to S3 storage
 * @param relKey - Relative key/path for the file
 * @param data - File data as Buffer or Uint8Array
 * @param contentType - MIME type of the file
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const apiUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!apiUrl || !apiKey) {
    throw new Error("Storage API credentials not configured");
  }

  // Convert to base64 for API transmission
  const base64Data = Buffer.from(data).toString('base64');

  const response = await fetch(`${apiUrl}/storage/put`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      key: relKey,
      data: base64Data,
      contentType: contentType || "application/octet-stream",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Storage upload failed: ${error}`);
  }

  const result = await response.json();
  return {
    key: relKey,
    url: result.url || `${apiUrl}/storage/${relKey}`,
  };
}

/**
 * Get a presigned URL for accessing a file
 * @param relKey - Relative key/path for the file
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns Object with key and presigned URL
 */
export async function storageGet(
  relKey: string,
  expiresIn: number = 3600
): Promise<{ key: string; url: string }> {
  const apiUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!apiUrl || !apiKey) {
    throw new Error("Storage API credentials not configured");
  }

  const response = await fetch(`${apiUrl}/storage/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      key: relKey,
      expiresIn,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Storage get failed: ${error}`);
  }

  const result = await response.json();
  return {
    key: relKey,
    url: result.url,
  };
}
