import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Palette,
  Users,
  UserPlus,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
  Shield,
  Lock,
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export default function Sidebar() {
  const { isSuperAdmin, organization } = useAuth();

  const isDesignerLocked = !isSuperAdmin && organization?.designerEnabled === false;

  const NAV_ITEMS = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/entry',
      label: 'Data Entry',
      icon: UserPlus,
      badge: 'New',
    },
    {
      to: '/designer',
      label: 'Card Designer',
      icon: isDesignerLocked ? Lock : Palette,
      badge: isDesignerLocked ? 'Locked' : '300 DPI',
      badgeClass: isDesignerLocked
        ? 'bg-amber-500/20 text-amber-300 border-amber-400/20'
        : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/20',
    },
    {
      to: '/records',
      label: 'Records & Roster',
      icon: Users,
      badge: null,
    },
  ];

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
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        item.badgeClass || 'bg-indigo-500/20 text-indigo-300 border-indigo-400/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Super Admin Control Section */}
        {isSuperAdmin && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Super Administration
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/10 border border-purple-500/20'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Printer className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Super Admin Panel</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                MASTER
              </span>
            </NavLink>
          </div>
        )}

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
            <div className="flex justify-between">
              <span>A3 Bulk Imposition:</span>
              <span className="font-mono text-slate-200">20 cards / page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vector PDF Imposition</span>
        </div>
        <span className="text-emerald-400 font-mono font-semibold" title={`Production Cloud Release: v${APP_VERSION}`}>
          v{APP_VERSION}
        </span>
      </div>
    </aside>
  );
}
