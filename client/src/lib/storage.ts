// Storage helper for uploading files to S3
export async function storagePut(
  key: string,
  data: Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  // For now, we'll use a simple approach - convert to base64 and send to server
  // In production, you'd want to use presigned URLs for direct S3 upload
  
  const base64 = btoa(String.fromCharCode(...Array.from(data)));
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: base64,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
}
