import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Camera,
  CheckCircle,
  Clock,
  Printer,
  UserPlus,
  User,
  Pencil,
  RotateCw,
  Truck,
  Send,
} from 'lucide-react';

export default function RecordTable({
  records,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeleteRecords,
  onOpenCropModal,
  onOpenAddModal,
  onOpenPrintModal,
  onEditRecord,
  onSendToPrint,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nameBangla?.includes(searchTerm) ||
      r.customFields?.nameBangla?.includes(searchTerm) ||
      r.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customFields?.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !r.printStatus || r.printStatus === 'pending'
        : r.printStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'sent_to_print':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
            <Clock className="w-3 h-3" />
            Sent to Print
          </span>
        );
      case 'printing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
            <RotateCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
            In Printing
          </span>
        );
      case 'printed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
            <CheckCircle className="w-3 h-3" />
            Printed
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-semibold">
            <Truck className="w-3 h-3" />
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700 text-[11px]">
            <Clock className="w-3 h-3" />
            Pending Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Filter & Action Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by name, ID number, or dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('sent_to_print')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'sent_to_print'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sent to Print ({records.filter((r) => r.printStatus === 'sent_to_print').length})
          </button>
          <button
            onClick={() => setStatusFilter('printing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'printing'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Printing ({records.filter((r) => r.printStatus === 'printing').length})
          </button>
          <button
            onClick={() => setStatusFilter('printed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'printed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Printed ({records.filter((r) => r.printStatus === 'printed').length})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'delivered'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivered ({records.filter((r) => r.printStatus === 'delivered').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({records.filter((r) => !r.printStatus || r.printStatus === 'pending').length})
          </button>
        </div>

        {/* Batch Actions & Print Button */}
        <div className="flex items-center flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <>
              <button
                onClick={() => onDeleteRecords(selectedIds)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.length})</span>
              </button>

              {onSendToPrint && (
                <button
                  onClick={() => onSendToPrint(selectedIds)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Print ({selectedIds.length})</span>
                </button>
              )}

              <button
                onClick={() => onOpenPrintModal(selectedIds)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Preview ({selectedIds.length})</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Single</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked, filtered.map((r) => r.id))}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="p-3">Person / Photo</th>
              <th className="p-3">ID / Badge Number</th>
              <th className="p-3">Department / Role</th>
              <th className="p-3">Blood Group</th>
              <th className="p-3">Print Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-8 h-8 text-slate-600" />
                    <p className="font-medium">No records match your search or filter.</p>
                    <p className="text-[11px] text-slate-500">
                      Import a CSV or click &quot;Add Single&quot; above to create ID records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const isChecked = selectedIds.includes(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isChecked ? 'bg-indigo-600/5' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleSelect(record.id)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Person / Avatar / Name */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative group w-10 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                          {record.photoUrl ? (
                            <img
                              src={record.photoUrl}
                              alt={record.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <button
                            onClick={() => onOpenCropModal(record)}
                            title="Upload / Crop Photo"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{record.fullName}</p>
                          {(record.nameBangla || record.customFields?.nameBangla) && (
                            <p
                              className="text-xs text-indigo-400 font-medium"
                              style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                            >
                              {record.nameBangla || record.customFields?.nameBangla}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            {record.customFields?.designation || record.email || 'Member'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ID Number */}
                    <td className="p-3 font-mono font-medium text-indigo-300">
                      {record.idNumber}
                    </td>

                    {/* Department / Class */}
                    <td className="p-3 text-slate-300">
                      {record.customFields?.department || '—'}
                    </td>

                    {/* Blood Group */}
                    <td className="p-3 text-slate-300">
                      {record.customFields?.bloodGroup ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[11px]">
                          {record.customFields.bloodGroup}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Print Status */}
                    <td className="p-3">{renderStatusBadge(record.printStatus)}</td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditRecord ? onEditRecord(record) : null}
                          title="Edit Full Data Record"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenPrintModal([record.id])}
                          title="Preview Card & Send to Print"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenCropModal(record)}
                          title="Set Photo"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecords([record.id])}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
