import type { Employee } from '../types/database';
import { createQRPayload, getInitials } from './qr';
import { generateBrandedQrDataUrl } from './brandedQr';

/**
 * Generates the standardized pass download filename:
 * <employee_id>-<name-slug>-pass.png (e.g. KM100-001-jameston-molejon-pass.png)
 */
export function getPassFilename(employee: { employee_code: string; full_name: string }): string {
  const code = (employee.employee_code || 'KM100').trim().toUpperCase();
  const nameSlug = (employee.full_name || 'staff')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'staff';
  return `${code}-${nameSlug}-pass.png`;
}

/**
 * Safely loads an image for HTML5 Canvas rendering.
 * Applies crossOrigin = "anonymous" to remote URLs, skipping data: and blob: URLs.
 * If the image fails or encounters CORS restrictions, resolves gracefully to null.
 */
export function loadImageSafely(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const isDataOrBlob = url.startsWith('data:') || url.startsWith('blob:');
    if (!isDataOrBlob) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Graceful fallback for broken links or strict CORS policies
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Helper to draw a rounded rectangle path on canvas.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Renders the FULL KM100 ID pass card onto an offscreen 2x-resolution HTML5 <canvas> (680 x 1060 px).
 */
export async function renderPassToCanvas(employee: Employee): Promise<HTMLCanvasElement> {
  const CARD_WIDTH = 340;
  const CARD_HEIGHT = 530;
  const SCALE = 2;

  const WIDTH = CARD_WIDTH * SCALE; // 680px
  const HEIGHT = CARD_HEIGHT * SCALE; // 1060px

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas rendering context.');
  }

  // Pre-load all assets concurrently: KM100 logo, TESDA logo, QR code, employee photo
  const qrPayload = createQRPayload(employee);
  const [km100Logo, tesdaLogo, qrDataUrl, employeePhoto] = await Promise.all([
    loadImageSafely('/km100-logo.png'),
    loadImageSafely('/tesda-logo.png'),
    generateBrandedQrDataUrl(qrPayload, 560),
    loadImageSafely(employee.photo_url),
  ]);

  const qrImage = await loadImageSafely(qrDataUrl);

  // 1. Card Base Background & Rounded Clipping (Corner radius: 32px at 2x)
  const cardRadius = 32;
  const cardBorderWidth = 4;

  ctx.save();
  drawRoundedRect(ctx, cardBorderWidth / 2, cardBorderWidth / 2, WIDTH - cardBorderWidth, HEIGHT - cardBorderWidth, cardRadius);
  ctx.clip();

  // Pure white card background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Top Header Container (Background: #FFFFFF, Height: 140px)
  const headerHeight = 140;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, WIDTH, headerHeight);

  // Lanyard slot cutout simulation (48x8 at 1x -> 96x16 at 2x, radius 8px)
  const slotW = 96;
  const slotH = 16;
  const slotX = (WIDTH - slotW) / 2;
  const slotY = 24;
  drawRoundedRect(ctx, slotX, slotY, slotW, slotH, 8);
  ctx.fillStyle = '#E2E8F0'; // slate-200
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1'; // slate-300
  ctx.lineWidth = 2;
  ctx.stroke();

  // Logos and Company Name Row (Y: 54px to 126px, height: 72px)
  const logoSize = 72;
  const logoPaddingX = 28;
  const logoY = 54;

  // Left: KM100 Circular Logo
  const km100X = logoPaddingX;
  if (km100Logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(km100X + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(km100Logo, km100X, logoY, logoSize, logoSize);
    ctx.restore();
  }

  // Right: Official TESDA Circular Logo
  const tesdaX = WIDTH - logoPaddingX - logoSize;
  if (tesdaLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(tesdaX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(tesdaLogo, tesdaX, logoY, logoSize, logoSize);
    ctx.restore();
  }

  // Center: 1-line Black Company Name
  const centerTextX = WIDTH / 2;
  const centerTextY = logoY + logoSize / 2;
  const maxCompanyWidth = tesdaX - (km100X + logoSize) - 24;

  let companyFontSize = 19;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000';
  ctx.font = `900 ${companyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const companyText = 'KM100 SKILLS & TRAINING CENTER, INC.';
  while (ctx.measureText(companyText).width > maxCompanyWidth && companyFontSize > 12) {
    companyFontSize -= 1;
    ctx.font = `900 ${companyFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  }
  ctx.fillText(companyText, centerTextX, centerTextY);

  // Header bottom border
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(WIDTH, headerHeight);
  ctx.stroke();

  // 3. KM100 Brand Accent Stripe (Orange 600, height: 10px)
  const stripeHeight = 10;
  ctx.fillStyle = '#EA580C';
  ctx.fillRect(0, headerHeight, WIDTH, stripeHeight);

  // 4. Main Body: 2x2 Square Photo
  // Dimensions at 2x: 256 x 256 px (128 at 1x)
  const photoSize = 256;
  const photoX = (WIDTH - photoSize) / 2; // 212px
  const photoY = headerHeight + stripeHeight + 26; // 176px

  // Flat square border (No border-radius as requested)
  ctx.save();
  if (employeePhoto) {
    // Center crop cover
    const imgW = employeePhoto.naturalWidth || employeePhoto.width;
    const imgH = employeePhoto.naturalHeight || employeePhoto.height;
    let sx = 0;
    let sy = 0;
    let sw = imgW;
    let sh = imgH;

    if (imgW > imgH) {
      sw = imgH;
      sx = (imgW - imgH) / 2;
    } else if (imgH > imgW) {
      sh = imgW;
      sy = (imgH - imgW) / 2;
    }

    ctx.drawImage(employeePhoto, sx, sy, sw, sh, photoX, photoY, photoSize, photoSize);
  } else {
    // Graceful fallback to Initials Avatar Placeholder (slate-100 bg, slate-700 text)
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    const initials = getInitials(employee.full_name);
    ctx.fillStyle = '#334155';
    ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2);
  }

  // Draw crisp photo border
  ctx.strokeStyle = '#CBD5E1'; // slate-300
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoSize, photoSize);
  ctx.restore();

  // 5. QR Code Container & QR Code (Positioned at bottom with 32px bottom margin)
  // Container size at 2x: 312 x 312 px (156 at 1x)
  const qrContainerSize = 312;
  const qrContainerX = (WIDTH - qrContainerSize) / 2; // 184px
  const qrContainerY = HEIGHT - 32 - qrContainerSize; // 716px

  // QR Container background & rounded border
  drawRoundedRect(ctx, qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw crisp QR code inside container (280 x 280 px)
  const qrInnerSize = 280;
  const qrInnerX = qrContainerX + (qrContainerSize - qrInnerSize) / 2; // 200px
  const qrInnerY = qrContainerY + (qrContainerSize - qrInnerSize) / 2; // 732px

  if (qrImage) {
    ctx.save();
    drawRoundedRect(ctx, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize, 16);
    ctx.clip();
    ctx.drawImage(qrImage, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);
    ctx.restore();
  }

  // 6. Employee Details: Full Name & Employee Code
  // Vertically centered between Photo bottom (432px) and QR container top (716px)
  const photoBottom = photoY + photoSize; // 432px
  const detailsCenterY = photoBottom + (qrContainerY - photoBottom) / 2; // 574px

  // Full Name (bold slate-900)
  let nameFontSize = 34;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0F172A';
  ctx.font = `900 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const fullNameText = employee.full_name || 'Staff Member';
  const maxNameWidth = WIDTH - 64; // 616px
  while (ctx.measureText(fullNameText).width > maxNameWidth && nameFontSize > 22) {
    nameFontSize -= 1;
    ctx.font = `900 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  }
  ctx.fillText(fullNameText, WIDTH / 2, detailsCenterY - 18);

  // Employee Code (monospace bold slate-700)
  ctx.fillStyle = '#334155';
  ctx.font = '700 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(employee.employee_code || 'KM100', WIDTH / 2, detailsCenterY + 24);

  ctx.restore(); // Restore base clip

  // 7. Outer Card Border (slate-200, 4px at 2x)
  drawRoundedRect(ctx, cardBorderWidth / 2, cardBorderWidth / 2, WIDTH - cardBorderWidth, HEIGHT - cardBorderWidth, cardRadius);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = cardBorderWidth;
  ctx.stroke();

  return canvas;
}

/**
 * Executes the full "Download Pass" action:
 * - Renders the card at 2x scale onto an offscreen canvas
 * - Exports as image/png via canvas.toBlob() with canvas.toDataURL() fallback
 * - Triggers download named <employee_id>-<name-slug>-pass.png
 * - Automatically revokes and cleans up temporary object URLs
 */
export async function downloadPassPng(employee: Employee): Promise<void> {
  let objectUrl: string | null = null;
  try {
    const canvas = await renderPassToCanvas(employee);
    const filename = getPassFilename(employee);

    await new Promise<void>((resolve, reject) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve();
          } else {
            // Fallback to toDataURL
            try {
              const dataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              resolve();
            } catch (fallbackErr) {
              reject(fallbackErr);
            }
          }
        }, 'image/png');
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve();
      }
    });
  } catch (err) {
    console.error('Full badge PNG export error:', err);
    throw err;
  } finally {
    if (objectUrl) {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl!);
        } catch {
          // ignore cleanup errors
        }
      }, 1000);
    }
  }
}
