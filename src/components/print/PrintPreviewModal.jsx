import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { exportCardsPdf } from '../../utils/pdfExporter';
import {
  X,
  Printer,
  FileText,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';

export default function PrintPreviewModal({
  isOpen,
  onClose,
  records = [],
  template,
  templates = [],
  onMarkPrinted,
  onSendToPrint,
}) {
  const { isSuperAdmin } = useAuth();
  const [mode, setMode] = useState('a4'); // 'a4' | 'a3' | 'single'
  const [includeBack, setIncludeBack] = useState(true);
  const [mirrorBack, setMirrorBack] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState('assigned'); // 'assigned' or specific template ID
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0, statusText: '' });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [superAdminAutoStatus, setSuperAdminAutoStatus] = useState('printing'); // 'printing' | 'printed' | 'none'

  if (!isOpen) return null;

  const activeTemplate =
    selectedTemplateId !== 'assigned'
      ? templates.find((t) => t.id === selectedTemplateId) || template
      : template;

  const isLandscape = activeTemplate?.orientation !== 'portrait';
  const cardsPerSheet =
    mode === 'a3'
      ? 20
      : mode === 'a4'
      ? (isLandscape ? 10 : 8)
      : 1;

  const estimatedSheets = Math.ceil(records.length / cardsPerSheet);

  // Normal User Action: Send to Print Queue
  const handleSendToPrintQueue = () => {
    try {
      const recordIds = records.map((r) => r.id);
      if (onSendToPrint) {
        onSendToPrint(recordIds);
      }
      setSuccessMsg(
        `Successfully sent ${records.length} card(s) to the Print Production Queue! Super Admin will review and print.`
      );
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to send to print queue.');
    }
  };

  // Super Admin Action: Generate & Download 300 DPI PDF
  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccessMsg(null);

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

      setSuccessMsg(`PDF exported successfully! Filename: ${filename}`);

      // Update statuses if requested
      if (superAdminAutoStatus !== 'none' && onMarkPrinted) {
        onMarkPrinted(records.map((r) => r.id), superAdminAutoStatus);
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
            <h3 className="font-semibold text-slate-100 text-sm">
              {isSuperAdmin ? 'Super Admin Print Production & PDF Hub' : 'Print Preview & Queue Submission'}
            </h3>
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
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Role Status Note */}
          {isSuperAdmin ? (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-bold uppercase text-[10px]">
                Super Admin
              </span>
              <span>Full Print Master privileges enabled: 300 DPI PDF export and status advancement.</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-blue-400" />
              <span>
                <strong>Print Workflow:</strong> Preview your cards below and click <strong>&quot;Send to Print&quot;</strong>. Production and PDF export are handled by the Super Admin print team.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
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
              Select Print Imposition Sheet Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* A4 Sheet */}
              <div
                onClick={() => !generating && setMode('a4')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'a4'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>A4 Sheet</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  210 × 297 mm. {isLandscape ? '10 cards' : '8 cards'} per page with crop marks.
                </p>
              </div>

              {/* A3 Sheet */}
              <div
                onClick={() => !generating && setMode('a3')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'a3'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>A3 Sheet (Bulk)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  297 × 420 mm. 20 cards per page. Perfect for high-speed batch printing.
                </p>
              </div>

              {/* Single PVC */}
              <div
                onClick={() => !generating && setMode('single')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === 'single'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold mb-1">
                  <Copy className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Single CR80 PVC</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  85.6 × 53.98 mm. Direct PVC card printer output (Fargo, Zebra, Evolis).
                </p>
              </div>
            </div>
          </div>

          {/* Imposition Options */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-200">Include Back Side</p>
                <p className="text-[11px] text-slate-400">Renders back side elements, barcodes, and terms</p>
              </div>
              <input
                type="checkbox"
                checked={includeBack}
                onChange={(e) => setIncludeBack(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            {mode !== 'single' && includeBack && (
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

          {/* Super Admin Status Options */}
          {isSuperAdmin && (
            <div className="p-3.5 bg-purple-950/20 rounded-xl border border-purple-800/30 space-y-2">
              <label className="font-semibold text-purple-200 uppercase tracking-wider text-[11px] block">
                Update Status on Download:
              </label>
              <div className="flex items-center gap-4 text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="autoStatus"
                    value="printing"
                    checked={superAdminAutoStatus === 'printing'}
                    onChange={() => setSuperAdminAutoStatus('printing')}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>Mark as &quot;Printing in Process&quot;</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="autoStatus"
                    value="printed"
                    checked={superAdminAutoStatus === 'printed'}
                    onChange={() => setSuperAdminAutoStatus('printed')}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>Mark as &quot;Printed&quot;</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="autoStatus"
                    value="none"
                    checked={superAdminAutoStatus === 'none'}
                    onChange={() => setSuperAdminAutoStatus('none')}
                    className="text-purple-600 focus:ring-0"
                  />
                  <span>Keep Current Status</span>
                </label>
              </div>
            </div>
          )}

          {/* Imposition Summary */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-slate-400">
            <div>
              <span className="font-semibold text-slate-200">{records.length}</span> cards selected
              {mode !== 'single' && ` • ~${estimatedSheets} ${mode.toUpperCase()} sheet${estimatedSheets > 1 ? 's' : ''}`}
            </div>
            <span className="font-mono text-indigo-400 text-[11px]">300 DPI Vector Output</span>
          </div>

          {/* Progress Bar (Super Admin generating PDF) */}
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
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 text-xs">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
          >
            Close
          </button>

          {isSuperAdmin ? (
            /* Super Admin can Download PDF */
            <button
              onClick={handleGeneratePdf}
              disabled={generating || records.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generating ? 'Rendering 300 DPI PDF...' : 'Download Print PDF (Super Admin)'}</span>
            </button>
          ) : (
            /* Regular User: Sent to Print Button */
            <button
              onClick={handleSendToPrintQueue}
              disabled={records.length === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Send to Print ({records.length} Cards)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
