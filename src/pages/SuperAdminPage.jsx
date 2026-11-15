import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import PrintPreviewModal from '../components/print/PrintPreviewModal';
import { DEFAULT_TEMPLATES } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
} from 'firebase/firestore';
import {
  ShieldCheck,
  Building2,
  Building,
  Printer,
  Users,
  User,
  Search,
  CheckCircle,
  Clock,
  Truck,
  RotateCw,
  Download,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Filter,
  Layers,
  ChevronDown,
  Sparkles,
  Eye,
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  PenTool,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_RECORDS = 'id_studio_records';

const MOCK_GLOBAL_RECORDS = [];

export default function SuperAdminPage() {
  const { currentUser, isSuperAdmin, allOrganizations, allUsers, toggleDesignerForOrg } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'queue'; // 'queue' | 'organizations' | 'users'
  const setActiveTab = (tab) => setSearchParams({ tab });

  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedOrgModal, setSelectedOrgModal] = useState(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetCards, setPrintTargetCards] = useState([]);

  // Load records
  useEffect(() => {
    async function loadAllRecords() {
      if (isFirebaseConfigured && db) {
        try {
          const orgsCol = collection(db, 'organizations');
          const orgsSnap = await getDocs(orgsCol);
          let allRecs = [];
          for (const orgDoc of orgsSnap.docs) {
            const orgData = orgDoc.data();
            const recsCol = collection(db, 'organizations', orgDoc.id, 'records');
            const recsSnap = await getDocs(recsCol);
            recsSnap.docs.forEach((d) => {
              allRecs.push({
                id: d.id,
                orgId: orgDoc.id,
                orgName: orgData.name || 'Organization',
                ...d.data(),
              });
            });
          }
          setRecords(allRecs);
          localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(allRecs));
          return;
        } catch (e) {
          console.warn('Firestore loadAllRecords error:', e);
        }
      }

      // Local storage fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
    }

    loadAllRecords();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveRecords = (newRecords) => {
    setRecords(newRecords);
    localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
  };

  // Status Updater
  const handleUpdateStatus = async (recordIds, newStatus) => {
    const updated = records.map((r) =>
      recordIds.includes(r.id) ? { ...r, printStatus: newStatus } : r
    );
    saveRecords(updated);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const batch = writeBatch(db);
        recordIds.forEach((id) => {
          const docRef = doc(db, 'organizations', currentUser.uid, 'records', id);
          batch.update(docRef, { printStatus: newStatus });
        });
        await batch.commit();
      } catch (err) {
        console.warn('Firestore update warning:', err);
      }
    }

    const readableStatus =
      newStatus === 'sent_to_print'
        ? 'Sent to Print'
        : newStatus === 'printing'
        ? 'Printing in Process'
        : newStatus === 'printed'
        ? 'Printed'
        : newStatus === 'delivered'
        ? 'Delivered'
        : 'Pending';

    showToast(`Updated ${recordIds.length} card(s) to "${readableStatus}".`);
  };

  // Open Print Modal for super admin
  const handleOpenPrintModal = (cardsToPrint) => {
    setPrintTargetCards(cardsToPrint);
    setIsPrintModalOpen(true);
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked, ids) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
    } else {
      setSelectedIds(selectedIds.filter((id) => !ids.includes(id)));
    }
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nameBangla?.includes(searchTerm) ||
      r.idNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customFields?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orgName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : r.printStatus === statusFilter;

    const matchesOrg =
      orgFilter === 'all' ? true : r.orgId === orgFilter;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  // Filter organizations
  const filteredOrgs = (allOrganizations || []).filter((org) => {
    const term = orgSearchTerm.toLowerCase();
    return (
      org.name?.toLowerCase().includes(term) ||
      org.nameBangla?.includes(orgSearchTerm) ||
      org.ownerEmail?.toLowerCase().includes(term) ||
      org.address?.toLowerCase().includes(term)
    );
  });

  // Filter users
  const filteredUsers = (allUsers || []).filter((user) => {
    const term = userSearchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.displayName?.toLowerCase().includes(term) ||
      user.orgName?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    );
  });

  // Calculate queue statistics
  const countSentToPrint = records.filter((r) => r.printStatus === 'sent_to_print').length;
  const countPrinting = records.filter((r) => r.printStatus === 'printing').length;
  const countPrinted = records.filter((r) => r.printStatus === 'printed').length;
  const countDelivered = records.filter((r) => r.printStatus === 'delivered').length;
  const countPending = records.filter((r) => !r.printStatus || r.printStatus === 'pending').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400 text-xs animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Master Authority
            </span>
            <span className="text-xs text-slate-400">• High-Volume Production Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Super Administrator Command Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage client organizations, control Card Designer permissions, process incoming print jobs, and export 300 DPI vector PDFs.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPrintModal(records)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Master PDF Imposition ({records.length})</span>
          </button>
        </div>
      </div>

      {/* Top Lifecycle Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Sent to Print */}
        <div
          onClick={() => {
            setActiveTab('queue');
            setStatusFilter('sent_to_print');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'sent_to_print'
              ? 'bg-blue-600/20 border-blue-500 text-blue-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">1. Sent to Print</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{countSentToPrint}</p>
          <p className="text-[10px] text-blue-400 mt-1">Awaiting batch imposition</p>
        </div>

        {/* Printing in Process */}
        <div
          onClick={() => {
            setActiveTab('queue');
            setStatusFilter('printing');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'printing'
              ? 'bg-amber-600/20 border-amber-500 text-amber-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">2. In Printing</span>
            <RotateCw className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{countPrinting}</p>
          <p className="text-[10px] text-amber-400 mt-1">On press / cutter</p>
        </div>

        {/* Printed */}
        <div
          onClick={() => {
            setActiveTab('queue');
            setStatusFilter('printed');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'printed'
              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">3. Printed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{countPrinted}</p>
          <p className="text-[10px] text-emerald-400 mt-1">Laminated & quality checked</p>
        </div>

        {/* Delivered */}
        <div
          onClick={() => {
            setActiveTab('queue');
            setStatusFilter('delivered');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'delivered'
              ? 'bg-purple-600/20 border-purple-500 text-purple-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">4. Delivered</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{countDelivered}</p>
          <p className="text-[10px] text-purple-400 mt-1">Dispatched to client</p>
        </div>

        {/* Draft / Pending */}
        <div
          onClick={() => {
            setActiveTab('queue');
            setStatusFilter('pending');
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'bg-slate-800 border-slate-600 text-slate-200'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Draft / Pending</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{countPending}</p>
          <p className="text-[10px] text-slate-500 mt-1">Not yet submitted</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Print Production Queue ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('organizations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'organizations'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organizations ({allOrganizations?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users Directory ({allUsers?.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: PRINT PRODUCTION QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Queue Filter & Controls Bar */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search card jobs by person name, NID, dept, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setStatusFilter('sent_to_print')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'sent_to_print'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sent to Print ({countSentToPrint})
              </button>
              <button
                onClick={() => setStatusFilter('printing')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'printing'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                In Printing ({countPrinting})
              </button>
              <button
                onClick={() => setStatusFilter('printed')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'printed'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Printed ({countPrinted})
              </button>
              <button
                onClick={() => setStatusFilter('delivered')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'delivered'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Delivered ({countDelivered})
              </button>
            </div>

            {/* Batch Status & Print Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="font-semibold text-slate-300">
                  {selectedIds.length} Selected:
                </span>

                {/* Batch Set Status Dropdown */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleUpdateStatus(selectedIds, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Change Status To...
                  </option>
                  <option value="sent_to_print">Sent to Print</option>
                  <option value="printing">Printing in Process</option>
                  <option value="printed">Printed</option>
                  <option value="delivered">Delivered</option>
                  <option value="pending">Draft / Pending</option>
                </select>

                {/* Super Admin PDF Imposition Button */}
                <button
                  onClick={() => {
                    const selectedCards = records.filter((r) =>
                      selectedIds.includes(r.id)
                    );
                    handleOpenPrintModal(selectedCards);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={(e) =>
                        handleSelectAll(
                          e.target.checked,
                          filteredRecords.map((r) => r.id)
                        )
                      }
                      className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Cardholder / Photo</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">ID / Badge</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Print Status Lifecycle</th>
                  <th className="p-3 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Printer className="w-8 h-8 text-slate-600" />
                        <p className="font-medium">No print jobs match your criteria.</p>
                        <p className="text-[11px] text-slate-500">
                          Try clearing search filters or check another status tab.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const isChecked = selectedIds.includes(record.id);

                    // Badge renderer
                    const renderStatusBadge = () => {
                      switch (record.printStatus) {
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
                              Printing in Process
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
                              Pending Draft
                            </span>
                          );
                      }
                    };

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
                            onChange={() => handleToggleSelect(record.id)}
                            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Person */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                              {record.photoUrl ? (
                                <img
                                  src={record.photoUrl}
                                  alt={record.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Users className="w-5 h-5" />
                                </div>
                              )}
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
                                {record.customFields?.designation || 'Member'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Org Name */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{record.orgName || 'Acme Academy'}</span>
                          </div>
                        </td>

                        {/* ID Number */}
                        <td className="p-3 font-mono font-medium text-indigo-300">
                          {record.idNumber}
                        </td>

                        {/* Department */}
                        <td className="p-3 text-slate-300">
                          {record.customFields?.department || '—'}
                        </td>

                        {/* Print Status Badge */}
                        <td className="p-3">{renderStatusBadge()}</td>

                        {/* Fulfillment Action & Status Changer */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Fast Status Selector */}
                            <select
                              value={record.printStatus || 'pending'}
                              onChange={(e) =>
                                handleUpdateStatus([record.id], e.target.value)
                              }
                              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:border-indigo-500 font-medium cursor-pointer"
                            >
                              <option value="sent_to_print">Sent to Print</option>
                              <option value="printing">Printing in Process</option>
                              <option value="printed">Printed</option>
                              <option value="delivered">Delivered</option>
                              <option value="pending">Pending</option>
                            </select>

                            {/* Single Print Modal Trigger */}
                            <button
                              onClick={() => handleOpenPrintModal([record])}
                              title="Generate & Download PDF for this card"
                              className="p-1.5 text-slate-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-purple-300" />
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
      )}

      {/* TAB 2: ORGANIZATIONS DIRECTORY WITH REAL-TIME CARD STATUS METRICS */}
      {activeTab === 'organizations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/80">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search organizations by English/Bangla name, email, or address..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>

            <div className="text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Total <strong>{filteredOrgs.length}</strong> Registered Client Organizations
              </span>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Organization & Brand</th>
                  <th className="p-3.5">Admin & Contact</th>
                  <th className="p-3.5 text-center">Employee Count</th>
                  <th className="p-3.5">ID Card Print Status</th>
                  <th className="p-3.5">Card Designer</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No organizations found matching "{orgSearchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => {
                    const isEnabled = org.designerEnabled !== false;

                    // Calculate live card metrics for this organization
                    const orgCards = records.filter((r) => r.orgId === org.id);
                    const orgPending = orgCards.filter((r) => !r.printStatus || r.printStatus === 'pending').length;
                    const orgSent = orgCards.filter((r) => r.printStatus === 'sent_to_print').length;
                    const orgPrinting = orgCards.filter((r) => r.printStatus === 'printing').length;
                    const orgPrinted = orgCards.filter((r) => r.printStatus === 'printed').length;
                    const orgDelivered = orgCards.filter((r) => r.printStatus === 'delivered').length;
                    const employeeCount = orgCards.length || org.recordsCount || 0;

                    return (
                      <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Name & Logo */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow">
                              {org.logoUrl ? (
                                <img
                                  src={org.logoUrl}
                                  alt={org.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-indigo-400" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-bold text-white text-sm">{org.name}</p>
                              {org.nameBangla && (
                                <p
                                  className="text-xs text-slate-300 font-medium"
                                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                                >
                                  {org.nameBangla}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500 font-mono">
                                ID: {org.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Admin & Contact */}
                        <td className="p-3.5 text-slate-300">
                          <div className="space-y-0.5">
                            <p className="font-mono text-xs text-slate-200">{org.ownerEmail || '—'}</p>
                            {org.address && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[200px]">{org.address}</span>
                              </p>
                            )}
                            {org.phone && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Tel: {org.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Employee / Records Count */}
                        <td className="p-3.5 text-center">
                          <div className="inline-flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700">
                            <span className="text-base font-extrabold text-white font-mono">
                              {employeeCount}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                              Employees
                            </span>
                          </div>
                        </td>

                        {/* ID Card Status Breakdown */}
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                            <span
                              title="Draft / Pending submission"
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              Pending: <strong>{orgPending}</strong>
                            </span>

                            {orgSent > 0 && (
                              <span
                                title="Sent to Print Queue"
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              >
                                Queue: <strong>{orgSent}</strong>
                              </span>
                            )}

                            {orgPrinting > 0 && (
                              <span
                                title="Currently Printing"
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              >
                                Printing: <strong>{orgPrinting}</strong>
                              </span>
                            )}

                            <span
                              title="Printed & Laminated"
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              Printed: <strong>{orgPrinted}</strong>
                            </span>

                            <span
                              title="Dispatched & Delivered"
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            >
                              Delivered: <strong>{orgDelivered}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Card Designer Permission */}
                        <td className="p-3.5">
                          <button
                            onClick={() => {
                              const newStatus = !isEnabled;
                              toggleDesignerForOrg(org.id, newStatus);
                              showToast(
                                `Card Designer has been ${newStatus ? 'ENABLED' : 'DISABLED'} for ${org.name}.`
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-semibold transition-all ${
                              isEnabled
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                            }`}
                          >
                            {isEnabled ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Enabled</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Disabled</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrgModal(org)}
                              title="View full organization profile & assets"
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-indigo-400" />
                            </button>

                            <button
                              onClick={() => {
                                setOrgFilter(org.id);
                                setActiveTab('queue');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Cards</span>
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
      )}

      {/* TAB 3: USERS DIRECTORY (USER-WISE ID CARD STATUS) */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/80">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered users by name, email, role, or organization..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 text-xs"
              />
            </div>

            <div className="text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>
                Total <strong>{filteredUsers.length}</strong> Registered User Accounts
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">User Profile</th>
                  <th className="p-3.5">Role Authority</th>
                  <th className="p-3.5">Assigned Organization</th>
                  <th className="p-3.5 text-center">Cards Managed</th>
                  <th className="p-3.5">Card Status (User Wise)</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No user accounts found matching "{userSearchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSuper = user.role === 'superadmin' || user.email?.toLowerCase().includes('superadmin');

                    // Calculate user-wise card metrics
                    const userCards = records.filter(
                      (r) =>
                        r.createdBy === user.email ||
                        r.orgId === user.orgId ||
                        r.orgId === user.uid
                    );
                    const uPending = userCards.filter((r) => !r.printStatus || r.printStatus === 'pending').length;
                    const uPrinted = userCards.filter((r) => r.printStatus === 'printed').length;
                    const uDelivered = userCards.filter((r) => r.printStatus === 'delivered').length;

                    // Match organization name
                    const userOrg = allOrganizations?.find(
                      (o) => o.id === user.orgId || o.ownerEmail === user.email
                    );
                    const orgDisplayName = userOrg?.name || user.orgName || (isSuper ? 'Master Command HQ' : 'Tenant Client');

                    return (
                      <tr key={user.uid || user.email} className="hover:bg-slate-800/40 transition-colors">
                        {/* User Profile */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border shadow ${
                                isSuper
                                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                                  : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">
                                {user.displayName || user.email.split('@')[0]}
                              </p>
                              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-3.5">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium">
                              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                              Organization User
                            </span>
                          )}
                        </td>

                        {/* Organization */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200 text-xs">{orgDisplayName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Org ID: {user.orgId || user.uid}
                            </p>
                          </div>
                        </td>

                        {/* Cards Managed */}
                        <td className="p-3.5 text-center">
                          <span className="text-base font-extrabold text-white font-mono">
                            {userCards.length}
                          </span>
                        </td>

                        {/* User-Wise Card Status */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              title="Pending Cards"
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              Pending: <strong>{uPending}</strong>
                            </span>
                            <span
                              title="Printed Cards"
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              Printed: <strong>{uPrinted}</strong>
                            </span>
                            <span
                              title="Delivered Cards"
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            >
                              Delivered: <strong>{uDelivered}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Active'}
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              if (user.orgId) setOrgFilter(user.orgId);
                              setActiveTab('queue');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                          >
                            Filter Queue
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORGANIZATION DETAILS INSPECTION MODAL */}
      {selectedOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center p-2 shrink-0">
                  {selectedOrgModal.logoUrl ? (
                    <img
                      src={selectedOrgModal.logoUrl}
                      alt={selectedOrgModal.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-indigo-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedOrgModal.name}</h3>
                  {selectedOrgModal.nameBangla && (
                    <p
                      className="text-base text-slate-300 font-medium font-serif"
                      style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                    >
                      {selectedOrgModal.nameBangla}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {selectedOrgModal.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrgModal(null)}
                className="text-slate-400 hover:text-white p-1 text-2xl font-light"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Contact Email</span>
                <p className="font-mono text-slate-200">{selectedOrgModal.ownerEmail || '—'}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Hotline / Phone</span>
                <p className="font-mono text-slate-200">{selectedOrgModal.phone || '—'}</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Official Address</span>
                <p className="text-slate-200">{selectedOrgModal.address || '—'}</p>
                {selectedOrgModal.addressBangla && (
                  <p
                    className="text-slate-300 pt-0.5"
                    style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                  >
                    {selectedOrgModal.addressBangla}
                  </p>
                )}
              </div>

              {selectedOrgModal.signatoryName && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Authorized Signatory</span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{selectedOrgModal.signatoryName}</p>
                      <p className="text-slate-400">{selectedOrgModal.signatoryTitle || 'Signatory'}</p>
                    </div>
                    {selectedOrgModal.signatorySignatureUrl && (
                      <img
                        src={selectedOrgModal.signatorySignatureUrl}
                        alt="Signature"
                        className="h-8 object-contain filter invert opacity-90"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setOrgFilter(selectedOrgModal.id);
                  setSelectedOrgModal(null);
                  setActiveTab('queue');
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>View Print Jobs in Queue</span>
              </button>
              <button
                onClick={() => setSelectedOrgModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin PDF Modal */}
      {isPrintModalOpen && (
        <PrintPreviewModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          records={printTargetCards}
          templates={DEFAULT_TEMPLATES}
          template={DEFAULT_TEMPLATES[0]}
          onMarkPrinted={(ids, status) => handleUpdateStatus(ids, status || 'printed')}
        />
      )}
    </div>
  );
}
