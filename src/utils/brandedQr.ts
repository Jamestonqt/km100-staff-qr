import QRCode from 'qrcode';

/**
 * Generates a high-fidelity QR code PNG data URL with:
 * - High error correction (Level "H")
 * - Dark modules in #0F172A on pure #FFFFFF background
 * - Quiet-zone margin of 3
 * - Clean, pure optical modules (no center logo overlay) for maximum scanning reliability
 */
export async function generateBrandedQrDataUrl(
  payload: string,
  size: number = 360
): Promise<string> {
  const targetSize = Math.max(120, size);

  if (typeof document === 'undefined') {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 3,
      width: targetSize,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;

  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: 'H',
    margin: 3,
    width: targetSize,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  return canvas.toDataURL('image/png');
}
