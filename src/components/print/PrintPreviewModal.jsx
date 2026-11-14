import React, { useState } from 'react';
import { exportCardsPdf } from '../../utils/pdfExporter';
import {
  X,
  Printer,
  FileText,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';

export default function PrintPreviewModal({
  isOpen,
  onClose,
  records,
  template,
  templates = [],
  onMarkPrinted,
}) {
  const [mode, setMode] = useState('a4'); // 'a4' | 'single'
  const [includeBack, setIncludeBack] = useState(true);
  const [mirrorBack, setMirrorBack] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('assigned'); // 'assigned' or specific template ID
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0, statusText: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const activeTemplate =
    selectedTemplateId !== 'assigned'
      ? templates.find((t) => t.id === selectedTemplateId) || template
      : template;

  const isLandscape = activeTemplate?.orientation !== 'portrait';
  const cardsPerSheet = isLandscape ? 10 : 8;
  const estimatedSheets = Math.ceil(records.length / cardsPerSheet);

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(false);

      const result = await exportCardsPdf({
        template: activeTemplate,
        templates,
        records: selectedTemplateId === 'assigned'
          ? records
          : records.map((r) => ({ ...r, templateId: selectedTemplateId })),
        mode,
        includeBack,
        mirrorBack,
        onProgress: (p) => setProgress(p),
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `ID_Cards_${mode.toUpperCase()}_${dateStr}.pdf`;
      result.download(filename);

      setSuccess(true);
      if (onMarkPrinted) {
        onMarkPrinted(records.map((r) => r.id));
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setError(err.message || 'Failed to generate PDF.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Print & PDF Imposition Center</h3>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>PDF generated and downloaded successfully! Records marked as printed.</span>
            </div>
          )}

          {/* Template Selection */}
          {templates && templates.length > 1 && (
            <div className="space-y-1.5 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                Card Design Template:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 text-xs"
              >
                <option value="assigned">
                  ⚡ Use Each Member&apos;s Assigned Department Template (Automatic)
                </option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    Override: Apply &quot;{tpl.name}&quot; ({tpl.department || 'All'} - {tpl.orientation})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Selection Cards */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Select Output Format:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => !generating && setMode('a4')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'a4'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>A4 Sheet Imposition</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {cardsPerSheet} cards per A4 page with hairline crop marks. Perfect for standard laser/inkjet sheet printing.
                </p>
              </div>

              <div
                onClick={() => !generating && setMode('single')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'single'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Single CR80 PVC</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Strict 85.6 × 53.98 mm page size. Designed for direct thermal PVC card printers (Fargo, Evolis, Zebra).
                </p>
              </div>
            </div>
          </div>

          {/* Imposition Options */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Include Back Side</p>
                <p className="text-[11px] text-slate-400">Renders back side elements and barcodes</p>
              </div>
              <input
                type="checkbox"
                checked={includeBack}
                onChange={(e) => setIncludeBack(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            {mode === 'a4' && includeBack && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <p className="font-medium text-slate-200">Duplex Mirroring</p>
                  <p className="text-[11px] text-slate-400">
                    Horizontally flips back-side card positions for perfect two-sided alignment
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mirrorBack}
                  onChange={(e) => setMirrorBack(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-400">
            <div>
              <span className="font-semibold text-slate-200">{records.length}</span> cards selected
              {mode === 'a4' && ` • ~${estimatedSheets} A4 sheet${estimatedSheets > 1 ? 's' : ''}`}
            </div>
            <span className="font-mono text-indigo-400 text-[11px]">300 DPI Vector PDF</span>
          </div>

          {/* Progress Bar */}
          {generating && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[320px]">{progress.statusText || 'Preparing PDF...'}</span>
                <span className="font-mono">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-900 text-xs">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Close
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={generating || records.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generating ? 'Generating 300 DPI PDF...' : 'Download Print PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
