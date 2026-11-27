import QRCode from 'qrcode';

// Cache the loaded KM100 logo in memory across repeated QR renders
let cachedLogoImage: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

function loadKm100Logo(): Promise<HTMLImageElement> {
  if (cachedLogoImage && cachedLogoImage.complete && cachedLogoImage.naturalWidth > 0) {
    return Promise.resolve(cachedLogoImage);
  }
  if (logoLoadPromise) {
    return logoLoadPromise;
  }

  logoLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window context not available for logo loading.'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedLogoImage = img;
      resolve(img);
    };
    img.onerror = (err) => {
      logoLoadPromise = null;
      reject(new Error('Failed to load KM100 logo from /km100-logo.png: ' + String(err)));
    };
    img.src = '/km100-logo.png';
  });

  return logoLoadPromise;
}

/**
 * Generates a high-fidelity branded QR code PNG data URL with:
 * - High error correction (Level "H")
 * - Dark modules in #0F172A on pure #FFFFFF background
 * - Quiet-zone margin of 3
 * - The circular KM100 logo drawn in the exact center (~20% width)
 * - Clean white circular cutout (excavate padding) so modules do not overlap logo edges
 */
export async function generateBrandedQrDataUrl(
  payload: string,
  size: number = 360
): Promise<string> {
  const targetSize = Math.max(120, size);

  if (typeof document === 'undefined') {
    // Fallback for non-DOM environments
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

  // 1. Draw base high-correction QR code
  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: 'H',
    margin: 3,
    width: targetSize,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL('image/png');
  }

  const centerX = targetSize / 2;
  const centerY = targetSize / 2;

  // Exact ~20% width circular logo sizing
  const logoSize = Math.round(targetSize * 0.20);
  const logoRadius = logoSize / 2;

  // Clean white circular cutout (excavate effect) with padding
  const cutoutPadding = Math.max(3, Math.round(logoSize * 0.14));
  const cutoutRadius = logoRadius + cutoutPadding;

  // 2. Draw white circular cutout behind the logo to clear QR modules
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, cutoutRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Subtle clean border for the white circular pad to ensure razor-sharp separation
  ctx.lineWidth = Math.max(1, Math.round(targetSize * 0.005));
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.restore();

  // 3. Draw circular clipped KM100 logo
  try {
    const logo = await loadKm100Logo();
    if (logo) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        logo,
        centerX - logoRadius,
        centerY - logoRadius,
        logoSize,
        logoSize
      );
      ctx.restore();

      // Hairline accent stroke around circular logo edge for crisp presentation
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, Math.round(targetSize * 0.004));
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.45)'; // KM100 Orange brand accent
      ctx.stroke();
      ctx.restore();
    }
  } catch (err) {
    console.warn('KM100 logo rendering in QR skipped:', err);
  }

  return canvas.toDataURL('image/png');
}
