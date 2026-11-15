import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  Palette,
  Printer,
  FileSpreadsheet,
  Zap,
  CreditCard,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DashboardPage() {
  const { currentUser, organization } = useAuth();
  const [stats, setStats] = useState({
    totalRecords: 0,
    printedRecords: 0,
    pendingRecords: 0,
    templatesCount: 1,
  });

  useEffect(() => {
    async function loadStats() {
      // Load template count
      let tCount = 3;
      const storedTemplates = localStorage.getItem('id_studio_templates');
      if (storedTemplates) {
        try {
          const tList = JSON.parse(storedTemplates);
          if (Array.isArray(tList) && tList.length > 0) tCount = tList.length;
        } catch (e) {}
      }

      if (isFirebaseConfigured && db && currentUser?.uid) {
        try {
          const recCol = collection(db, 'organizations', currentUser.uid, 'records');
          const snap = await getDocs(recCol);
          let printed = 0;
          let pending = 0;
          snap.forEach((doc) => {
            const data = doc.data();
            if (data.printStatus === 'printed') printed++;
            else pending++;
          });
          setStats({
            totalRecords: snap.size,
            printedRecords: printed,
            pendingRecords: pending,
            templatesCount: tCount,
          });
        } catch (e) {
          console.warn('Could not load firestore stats:', e);
        }
      } else {
        // Read demo records from localStorage
        const stored = localStorage.getItem('id_studio_records');
        if (stored) {
          try {
            const list = JSON.parse(stored);
            const printed = list.filter((r) => r.printStatus === 'printed').length;
            setStats({
              totalRecords: list.length,
              printedRecords: printed,
              pendingRecords: list.length - printed,
              templatesCount: tCount,
            });
          } catch (e) {}
        } else {
          setStats((prev) => ({ ...prev, templatesCount: tCount }));
        }
      }
    }
    loadStats();
  }, [currentUser]);

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-5 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] sm:text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Zero-Cost Serverless Printing Architecture</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome to {organization?.name || 'ID Card Studio'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Design CR80 double-sided templates with live 300 DPI vector rendering, import rosters with CSV column mapping, and impose A4 print sheets directly in your browser.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <Link
              to="/entry"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Data Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/designer"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
            >
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Card Designer</span>
            </Link>

            <Link
              to="/records"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Manage Roster & Print</span>
            </Link>
          </div>
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-30 pointer-events-none">
          <CreditCard className="w-64 h-64 text-indigo-400" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 space-y-2 sm:space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Roster</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{stats.totalRecords}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">Students & Employees</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 space-y-2 sm:space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Printed Cards</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{stats.printedRecords}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">Ready or Distributed</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 space-y-2 sm:space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Pending Print</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{stats.pendingRecords}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">Queued for Print</p>
          </div>
        </div>

        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 space-y-2 sm:space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-400">Templates</span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100">{stats.templatesCount}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">CR80 Double-Sided</p>
          </div>
        </div>
      </div>
    </div>
  );
}
