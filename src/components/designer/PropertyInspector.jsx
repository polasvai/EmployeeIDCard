import React, { useRef } from 'react';
import {
  Sliders,
  Type,
  Maximize2,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { compressImageFile } from '../../utils/imageProcessor';

const FONT_GROUPS = [
  {
    label: 'Corporate & Modern Sans',
    fonts: ['Inter', 'Montserrat', 'Poppins', 'Outfit', 'Roboto', 'Open Sans', 'Raleway', 'Space Grotesk', 'Arial'],
  },
  {
    label: 'Bengali Typography (বাংলা)',
    fonts: ['Noto Sans Bengali', 'Hind Siliguri', 'Tiro Bangla', 'Anek Bangla', 'Mina', 'Galada'],
  },
  {
    label: 'Impact & Badges',
    fonts: ['Oswald', 'Bebas Neue'],
  },
  {
    label: 'Executive & Serif',
    fonts: ['Playfair Display', 'Cinzel', 'Georgia'],
  },
  {
    label: 'Monospace & Tech',
    fonts: ['Roboto Mono', 'Fira Code', 'Space Mono', 'Courier New'],
  },
];

const FONT_FAMILIES = FONT_GROUPS.flatMap((g) => g.fonts);

export default function PropertyInspector({
  selectedElement,
  onUpdateElement,
  background,
  onUpdateBackground,
}) {
  const bgFileInputRef = useRef(null);

  const handleBgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to 300 DPI canvas dimensions under reasonable size
      const { dataUrl } = await compressImageFile(file, 1011, 1011, 0.9);
      onUpdateBackground({
        ...background,
        type: 'image',
        value: dataUrl,
        opacity: background?.opacity !== undefined ? background.opacity : 1,
      });
    } catch (err) {
      console.error('Failed to load background image:', err);
    }
  };

  if (!selectedElement) {
    // Show card canvas / background properties
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 space-y-5 text-xs text-slate-300 overflow-y-auto">
        <div className="flex items-center gap-2 font-semibold text-slate-200 pb-2 border-b border-slate-800">
          <Palette className="w-4 h-4 text-indigo-400" />
          <span>Card Background</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Background Style</label>
            <select
              value={background?.type || 'color'}
              onChange={(e) => onUpdateBackground({ ...background, type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="color">Solid Color</option>
              <option value="gradient">Linear Gradient</option>
              <option value="image">Custom Uploaded Image</option>
            </select>
          </div>

          {/* Solid Color */}
          {background?.type === 'color' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background?.value || '#ffffff'}
                  onChange={(e) => onUpdateBackground({ ...background, value: e.target.value })}
                  className="w-9 h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                />
                <input
                  type="text"
                  value={background?.value || '#ffffff'}
                  onChange={(e) => onUpdateBackground({ ...background, value: e.target.value })}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Gradient */}
          {background?.type === 'gradient' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background?.value || '#ffffff'}
                    onChange={(e) => onUpdateBackground({ ...background, value: e.target.value })}
                    className="w-9 h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <input
                    type="text"
                    value={background?.value || '#ffffff'}
                    onChange={(e) => onUpdateBackground({ ...background, value: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background?.secondaryValue || '#e2e8f0'}
                    onChange={(e) => onUpdateBackground({ ...background, secondaryValue: e.target.value })}
                    className="w-9 h-8 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <input
                    type="text"
                    value={background?.secondaryValue || '#e2e8f0'}
                    onChange={(e) => onUpdateBackground({ ...background, secondaryValue: e.target.value })}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Angle ({background?.gradientAngle || 135}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={background?.gradientAngle || 135}
                  onChange={(e) => onUpdateBackground({ ...background, gradientAngle: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </>
          )}

          {/* Custom Uploaded Background Image */}
          {background?.type === 'image' && (
            <div className="space-y-3 pt-1">
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBgImageUpload}
                className="hidden"
              />

              {background?.value ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl border border-slate-700 overflow-hidden h-28 bg-slate-800 flex items-center justify-center">
                    <img
                      src={background.value}
                      alt="Background Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        onUpdateBackground({
                          ...background,
                          type: 'color',
                          value: '#ffffff',
                        })
                      }
                      title="Remove background image"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white shadow-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Replace Image</span>
                  </button>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Image Opacity ({Math.round((background.opacity ?? 1) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={background.opacity ?? 1}
                      onChange={(e) =>
                        onUpdateBackground({ ...background, opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-6 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-800/40 hover:bg-slate-800/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-indigo-400" />
                  <span className="font-medium text-slate-200">Upload Background Graphic</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, SVG template art</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed">
          💡 Click any element on the card canvas or in the layer list to inspect and adjust its properties.
        </div>
      </div>
    );
  }

  const handleChange = (key, value) => {
    onUpdateElement({ ...selectedElement, [key]: value });
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 space-y-5 text-xs text-slate-300 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="capitalize">{selectedElement.type} Inspector</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">#{selectedElement.id}</span>
      </div>

      {/* Geometry / Dimensions */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Coordinates & Size (300 DPI)</span>
        </label>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div>
            <span className="text-[10px] text-slate-400">X:</span>
            <input
              type="number"
              value={Math.round(selectedElement.x || 0)}
              onChange={(e) => handleChange('x', Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Y:</span>
            <input
              type="number"
              value={Math.round(selectedElement.y || 0)}
              onChange={(e) => handleChange('y', Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Width:</span>
            <input
              type="number"
              value={Math.round(selectedElement.width || 100)}
              onChange={(e) => handleChange('width', Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Height:</span>
            <input
              type="number"
              value={Math.round(selectedElement.height || 100)}
              onChange={(e) => handleChange('height', Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Field Key Binding */}
      {(selectedElement.type === 'dynamicText' ||
        selectedElement.type === 'qrCode' ||
        selectedElement.type === 'barcode') && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            Data Binding Key
          </label>
          <input
            type="text"
            value={selectedElement.fieldKey || ''}
            onChange={(e) => handleChange('fieldKey', e.target.value)}
            placeholder="e.g. fullName, idNumber, department"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Automatically populated from CSV roster or Firestore record.
          </p>
        </div>
      )}

      {/* Static Text Content */}
      {selectedElement.type === 'text' && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Text Content
          </label>
          <textarea
            rows={3}
            value={selectedElement.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 resize-none"
          />
        </div>
      )}

      {/* Dynamic Text Prefix / Suffix / Fallback */}
      {selectedElement.type === 'dynamicText' && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[10px] text-slate-400">Prefix (optional)</label>
            <input
              type="text"
              value={selectedElement.prefix || ''}
              onChange={(e) => handleChange('prefix', e.target.value)}
              placeholder="e.g. 'ID: '"
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400">Fallback Preview</label>
            <input
              type="text"
              value={selectedElement.fallback || ''}
              onChange={(e) => handleChange('fallback', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            />
          </div>
        </div>
      )}

      {/* Typography Controls for text elements */}
      {(selectedElement.type === 'text' || selectedElement.type === 'dynamicText') && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Type className="w-3.5 h-3.5" />
            <span>Typography</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400">Font</label>
              <select
                value={selectedElement.fontFamily || 'Inter'}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              >
                {FONT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label} className="bg-slate-900 text-slate-300 font-semibold">
                    {group.fonts.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: `"${f}", sans-serif` }}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400">Size (px)</label>
              <input
                type="number"
                value={selectedElement.fontSize || 24}
                onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onClick={() => handleChange('align', 'left')}
                className={`p-1.5 rounded ${
                  (selectedElement.align || 'left') === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleChange('align', 'center')}
                className={`p-1.5 rounded ${
                  selectedElement.align === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleChange('align', 'right')}
                className={`p-1.5 rounded ${
                  selectedElement.align === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <select
              value={selectedElement.fontStyle || 'normal'}
              onChange={(e) => handleChange('fontStyle', e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              <option value="normal">Regular</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="w-8 h-7 rounded border border-slate-700 bg-slate-800 cursor-pointer"
              />
              <input
                type="text"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Photo Frame Properties */}
      {selectedElement.type === 'photo' && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Photo Frame Styling
          </label>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">
              Corner Radius ({selectedElement.borderRadius || 0}px)
            </label>
            <input
              type="range"
              min="0"
              max="160"
              value={selectedElement.borderRadius || 0}
              onChange={(e) => handleChange('borderRadius', Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400">Border Width</label>
              <input
                type="number"
                value={selectedElement.borderWidth || 0}
                onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400">Border Color</label>
              <input
                type="color"
                value={selectedElement.borderColor || '#cbd5e1'}
                onChange={(e) => handleChange('borderColor', e.target.value)}
                className="w-full h-7 rounded border border-slate-700 bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Shape Properties */}
      {selectedElement.type === 'shape' && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Shape Styling
          </label>
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Fill Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.fill || '#1e40af'}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="w-8 h-7 rounded border border-slate-700 bg-slate-800 cursor-pointer"
              />
              <input
                type="text"
                value={selectedElement.fill || '#1e40af'}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
              />
            </div>
          </div>
          {selectedElement.shapeType === 'rect' && (
            <div>
              <label className="block text-[10px] text-slate-400">Corner Radius (px)</label>
              <input
                type="number"
                value={selectedElement.cornerRadius || 0}
                onChange={(e) => handleChange('cornerRadius', Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
