/**
 * Storage Service for ID Card Studio
 * Supports:
 * 1. Cloudflare R2 (via Cloudflare Worker / Presigned Endpoint) - Primary Picture Storage
 * 2. Google Firebase Storage - Fallback Cloud Storage
 * 3. Local Base64 Data URL - Client-side fallback
 */

import { storage, isFirebaseConfigured } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CF_WORKER_UPLOAD_URL = import.meta.env.VITE_CLOUDFLARE_WORKER_UPLOAD_URL;
const CF_R2_PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL;
const CF_UPLOAD_SECRET = import.meta.env.VITE_CLOUDFLARE_UPLOAD_SECRET || '';

/**
 * Checks if Cloudflare R2 storage is configured via environment variables
 */
export const isCloudflareStorageConfigured = Boolean(
  CF_WORKER_UPLOAD_URL &&
  !CF_WORKER_UPLOAD_URL.includes('your-worker') &&
  !CF_WORKER_UPLOAD_URL.includes('placeholder')
);

/**
 * Returns the current active storage provider name
 */
export function getActiveStorageProvider() {
  if (isCloudflareStorageConfigured) return 'Cloudflare R2';
  if (isFirebaseConfigured && storage) return 'Google Firebase Storage';
  return 'Local Client-Side (Base64)';
}

/**
 * Upload a portrait photo to the configured storage backend
 * @param {Blob} blob - Compressed JPEG image blob (300x360px < 40KB)
 * @param {string} dataUrl - Fallback base64 data url
 * @param {string} recordId - Unique ID of the cardholder
 * @param {string} orgId - Organization ID
 * @returns {Promise<{ url: string, provider: string }>}
 */
export async function uploadPortraitPhoto({ blob, dataUrl, recordId = 'temp', orgId = 'default' }) {
  const safeFilename = `${orgId}_${recordId}_${Date.now()}.jpg`;

  // 1. Cloudflare R2 Storage (Direct or via Cloudflare Worker)
  if (isCloudflareStorageConfigured && blob) {
    try {
      const formData = new FormData();
      formData.append('file', blob, safeFilename);
      formData.append('recordId', recordId);
      formData.append('orgId', orgId);

      const headers = {};
      if (CF_UPLOAD_SECRET) {
        headers['X-Upload-Secret'] = CF_UPLOAD_SECRET;
      }

      const response = await fetch(CF_WORKER_UPLOAD_URL, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Cloudflare upload failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const photoUrl = data.url || (CF_R2_PUBLIC_URL ? `${CF_R2_PUBLIC_URL}/${safeFilename}` : null);

      if (photoUrl) {
        return {
          url: photoUrl,
          provider: 'Cloudflare R2',
        };
      }
    } catch (err) {
      console.warn('Cloudflare R2 upload error, attempting fallback:', err);
    }
  }

  // 2. Google Firebase Storage
  if (isFirebaseConfigured && storage && blob && recordId) {
    try {
      const photoRef = ref(storage, `organizations/${orgId}/photos/${safeFilename}`);
      await uploadBytes(photoRef, blob, {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });
      const downloadUrl = await getDownloadURL(photoRef);
      return {
        url: downloadUrl,
        provider: 'Google Firebase Storage',
      };
    } catch (err) {
      console.warn('Firebase Storage upload error, falling back to dataUrl:', err);
    }
  }

  // 3. Local Data URL Fallback
  return {
    url: dataUrl,
    provider: 'Local Storage',
  };
}
