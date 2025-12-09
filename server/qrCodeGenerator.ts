import QRCode from 'qrcode';

/**
 * Generate QR code for mobile feedback access
 * @param interviewId - The interview ID
 * @param baseUrl - Base URL of the application (e.g., https://example.com)
 * @returns Data URL of the QR code image
 */
export async function generateFeedbackQRCode(
  interviewId: number,
  baseUrl: string
): Promise<string> {
  // Construct the mobile feedback URL
  const feedbackUrl = `${baseUrl}/mobile/feedback/${interviewId}`;
  
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(feedbackUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[QRCode] Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as buffer for storage
 * @param interviewId - The interview ID
 * @param baseUrl - Base URL of the application
 * @returns Buffer containing the QR code image
 */
export async function generateFeedbackQRCodeBuffer(
  interviewId: number,
  baseUrl: string
): Promise<Buffer> {
  const feedbackUrl = `${baseUrl}/mobile/feedback/${interviewId}`;
  
  try {
    const buffer = await QRCode.toBuffer(feedbackUrl, {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      width: 300,
    });
    
    return buffer;
  } catch (error) {
    console.error('[QRCode] Failed to generate QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Generate QR code with custom branding/styling
 * @param interviewId - The interview ID
 * @param baseUrl - Base URL of the application
 * @param options - Custom styling options
 * @returns Data URL of the QR code image
 */
export async function generateBrandedFeedbackQRCode(
  interviewId: number,
  baseUrl: string,
  options?: {
    darkColor?: string;
    lightColor?: string;
    width?: number;
  }
): Promise<string> {
  const feedbackUrl = `${baseUrl}/mobile/feedback/${interviewId}`;
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(feedbackUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: options?.width || 300,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#FFFFFF',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[QRCode] Failed to generate branded QR code:', error);
    throw new Error('Failed to generate branded QR code');
  }
}
