import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/imageProcessor';
import { X, ZoomIn, Check, RotateCw } from 'lucide-react';
import { uploadPortraitPhoto, getActiveStorageProvider } from '../../services/storageService';

export default function PhotoCropModal({
  isOpen,
  onClose,
  imageSrc,
  record,
  orgId,
  onPhotoSaved,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  if (!isOpen || !imageSrc) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Crop and compress client-side strictly to 300x360 JPEG under 40 KB
      const { blob, dataUrl, sizeKb } = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        300,
        360,
        0.85
      );

      // Upload to Cloudflare R2 / Firebase Storage / Local Fallback
      const uploadResult = await uploadPortraitPhoto({
        blob,
        dataUrl,
        recordId: record?.id || `rec-${Date.now()}`,
        orgId: orgId || 'default-org',
      });

      onPhotoSaved(uploadResult.url, sizeKb);
      onClose();
    } catch (err) {
      console.error('Failed to crop or upload image:', err);
      setError(err.message || 'Failed to process cropped photo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Crop & Optimize Portrait</h3>
            <p className="text-xs text-slate-400">
              For {record?.fullName || 'Record'} • Storage: <span className="text-indigo-400 font-medium">{getActiveStorageProvider()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-80 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={250 / 320} // Portrait card photo aspect ratio
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 bg-slate-900/90 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <span className="font-mono text-slate-400 text-[11px] w-8">
              {zoom.toFixed(1)}x
            </span>

            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90°"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-2"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Compressing...' : 'Save & Attach Photo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
