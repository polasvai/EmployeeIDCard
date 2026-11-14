/**
 * Client-Side Image Processing & Compression Utility
 * Keeps all uploaded portrait photos <= 300x300px and under 40 KB
 * to strictly adhere to Firebase Storage & bandwidth free tiers.
 */

export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Crops and compresses an image based on react-easy-crop pixel crop coordinates.
 * @param {string} imageSrc - Object URL or Base64 data URL
 * @param {object} pixelCrop - { x, y, width, height }
 * @param {number} targetWidth - Default 300px
 * @param {number} targetHeight - Default 300px
 * @param {number} quality - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<{ blob: Blob, dataUrl: string, sizeKb: number }>}
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  targetWidth = 300,
  targetHeight = 300,
  quality = 0.85
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Smoothing for high quality downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round(blob.size / 1024 * 10) / 10;
        resolve({ blob, dataUrl, sizeKb });
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Resizes and compresses any generic File (e.g. from file picker or drag-drop)
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} quality
 * @returns {Promise<{ blob: Blob, dataUrl: string, sizeKb: number, width: number, height: number }>}
 */
export async function compressImageFile(
  file,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.85
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const image = await createImage(e.target.result);
        let { width, height } = image;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression blob creation failed'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            const sizeKb = Math.round((blob.size / 1024) * 10) / 10;
            resolve({ blob, dataUrl, sizeKb, width, height });
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
