import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Palette,
  Users,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    to: '/designer',
    label: 'Card Designer',
    icon: Palette,
    badge: '300 DPI',
  },
  {
    to: '/records',
    label: 'Records & Roster',
    icon: Users,
    badge: null,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Navigation Links */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workspace
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Print Standards Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>CR80 Physical Specs</span>
          </div>
          <div className="space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Card Size:</span>
              <span className="font-mono text-slate-200">85.6 × 53.98 mm</span>
            </div>
            <div className="flex justify-between">
              <span>300 DPI Canvas:</span>
              <span className="font-mono text-slate-200">1011 × 638 px</span>
            </div>
            <div className="flex justify-between">
              <span>A4 Imposition:</span>
              <span className="font-mono text-slate-200">10 cards / page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>$0/mo Cloudflare + Firebase</span>
        </div>
        <p className="text-slate-400">Zero Serverless Billing Engine</p>
      </div>
    </aside>
  );
}
