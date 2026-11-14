import React, { useState } from 'react';
import { parseSpreadsheet } from '../../utils/csvParser';
import { X, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';

const STANDARD_FIELDS = [
  { key: 'fullName', label: 'Full Name (Required)', required: true },
  { key: 'idNumber', label: 'ID / Badge Number (Required)', required: true },
  { key: 'department', label: 'Department / Class', required: false },
  { key: 'designation', label: 'Designation / Role', required: false },
  { key: 'bloodGroup', label: 'Blood Group', required: false },
  { key: 'phone', label: 'Phone / Contact', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'validThru', label: 'Valid Until / Expiry', required: false },
  { key: 'photoUrl', label: 'Photo URL (Optional)', required: false },
];

export default function BulkImportModal({
  isOpen,
  onClose,
  orgId,
  templateId,
  onImportComplete,
}) {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importProgress, setImportProgress] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setLoading(true);

    try {
      const { headers: parsedHeaders, rows, suggestedMapping } = await parseSpreadsheet(selectedFile);
      setHeaders(parsedHeaders);
      setParsedRows(rows);
      setColumnMapping(suggestedMapping);
    } catch (err) {
      setError(err.message || 'Failed to read spreadsheet file');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (fieldKey, headerName) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: headerName || undefined,
    }));
  };

  const handleCommitImport = async () => {
    if (!columnMapping.fullName || !columnMapping.idNumber) {
      setError('Both Full Name and ID Number must be mapped to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const recordsToInsert = parsedRows.map((row, index) => {
        const fullName = String(row[columnMapping.fullName] || '').trim();
        const idNumber = String(row[columnMapping.idNumber] || `ID-${index + 1}`).trim();
        const photoUrl = columnMapping.photoUrl ? String(row[columnMapping.photoUrl] || '').trim() : null;

        const customFields = {};
        for (const [key, mappedHeader] of Object.entries(columnMapping)) {
          if (!['fullName', 'idNumber', 'photoUrl'].includes(key) && mappedHeader) {
            customFields[key] = String(row[mappedHeader] || '').trim();
          }
        }

        return {
          id: `rec-${Date.now()}-${index}`,
          templateId: templateId || 'default',
          fullName,
          idNumber,
          photoUrl: photoUrl || null,
          customFields,
          printStatus: 'pending',
          createdAt: new Date().toISOString(),
        };
      }).filter((r) => r.fullName.length > 0);

      if (recordsToInsert.length === 0) {
        throw new Error('No valid rows with names found in file.');
      }

      // If Firebase Firestore is active: Execute batched writes (<= 450 per batch)
      if (isFirebaseConfigured && db && orgId) {
        const recordsCol = collection(db, 'organizations', orgId, 'records');
        const BATCH_SIZE = 400; // Under the 500 Firestore operation limit
        const totalBatches = Math.ceil(recordsToInsert.length / BATCH_SIZE);

        for (let b = 0; b < totalBatches; b++) {
          const batch = writeBatch(db);
          const chunk = recordsToInsert.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

          chunk.forEach((rec) => {
            const docRef = doc(recordsCol);
            batch.set(docRef, {
              ...rec,
              id: docRef.id,
              createdAt: serverTimestamp(),
            });
          });

          setImportProgress(`Committing batch ${b + 1} of ${totalBatches}...`);
          await batch.commit();
        }
      }

      onImportComplete(recordsToInsert);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed.');
    } finally {
      setLoading(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Bulk Import Roster (CSV / Excel)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Picker */}
          {!file ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
              <Upload className="w-8 h-8 text-indigo-400 mb-2" />
              <p className="font-medium text-slate-200">Click to upload or drag & drop</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Supports CSV, TSV, or Excel (.xlsx, .xls) up to thousands of records
              </p>
              <input
                type="file"
                accept=".csv,.tsv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-slate-200">{file.name}</span>
                  <span className="text-slate-400">({parsedRows.length} rows detected)</span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setHeaders([]);
                    setParsedRows([]);
                  }}
                  className="text-slate-400 hover:text-red-400 text-[11px]"
                >
                  Change File
                </button>
              </div>

              {/* Column Mapping Section */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Map Columns to ID Card Fields
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {STANDARD_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="bg-slate-800/40 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1"
                    >
                      <label className="text-[11px] font-medium text-slate-300">
                        {field.label}
                      </label>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-indigo-500"
                      >
                        <option value="">-- None / Skip --</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            Spreadsheet Column: {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Preview */}
              {parsedRows.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                    Preview (First 3 Rows)
                  </h4>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-800 text-slate-300">
                        <tr>
                          <th className="p-2">Full Name</th>
                          <th className="p-2">ID Number</th>
                          <th className="p-2">Dept / Class</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {parsedRows.slice(0, 3).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="p-2 font-medium">
                              {columnMapping.fullName ? r[columnMapping.fullName] || '—' : '—'}
                            </td>
                            <td className="p-2 font-mono text-indigo-400">
                              {columnMapping.idNumber ? r[columnMapping.idNumber] || '—' : '—'}
                            </td>
                            <td className="p-2">
                              {columnMapping.department ? r[columnMapping.department] || '—' : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 text-xs">
          <span className="text-slate-400">
            {importProgress || (parsedRows.length > 0 ? `${parsedRows.length} rows ready` : '')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitImport}
              disabled={loading || parsedRows.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Importing...' : `Import ${parsedRows.length} Records`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
