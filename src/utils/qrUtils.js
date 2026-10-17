import QRCode from 'qrcode';
import jsQR from 'jsqr';

/**
 * Generates a data URL for a given text or JSON payload using QRCode
 */
export async function generateQrDataUrl(data, options = {}) {
  try {
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return await QRCode.toDataURL(text, {
      width: options.width || 280,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#1a1a2e',
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
      ...options,
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return null;
  }
}

/**
 * Decodes an ImageData buffer using jsQR
 */
export function decodeQrFromImageData(imageData) {
  if (!imageData) return null;
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    return code ? code.data : null;
  } catch (err) {
    console.error('Failed to decode QR code', err);
    return null;
  }
}

/**
 * Decodes a File or Blob image object using jsQR
 */
export function decodeQrFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const result = decodeQrFromImageData(imageData);
        resolve(result);
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Play pleasant synthesizer audio feedback on successful QR scan
 */
export function playScanSuccessSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}
