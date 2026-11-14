import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

/**
 * Generate a high-resolution QR code Data URL.
 * @param {string} text - Payload to encode in QR code
 * @param {object} options - Optional styling parameters
 * @returns {Promise<string>} Data URL string
 */
export async function generateQrCodeDataUrl(text, options = {}) {
  if (!text || typeof text !== 'string') {
    text = 'SAMPLE-QR';
  }
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      margin: options.margin !== undefined ? options.margin : 1,
      width: options.width || 400,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code data URL:', err);
    return null;
  }
}

/**
 * Generate a high-resolution 1D Barcode (e.g. CODE128) Data URL via an offscreen HTML5 canvas.
 * @param {string} text - Text/ID to encode in barcode
 * @param {object} options - Format and appearance options
 * @returns {string|null} Data URL string
 */
export function generateBarcodeDataUrl(text, options = {}) {
  if (!text || typeof text !== 'string') {
    text = '1234567890';
  }

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: options.format || 'CODE128',
      lineColor: options.lineColor || '#000000',
      background: options.background || '#ffffff',
      width: options.width || 2,
      height: options.height || 60,
      displayValue: options.displayValue !== undefined ? options.displayValue : true,
      font: options.font || 'Roboto Mono, monospace',
      fontSize: options.fontSize || 14,
      fontOptions: 'bold',
      textMargin: 4,
      margin: options.margin !== undefined ? options.margin : 8,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate Barcode data URL:', err);
    return null;
  }
}
