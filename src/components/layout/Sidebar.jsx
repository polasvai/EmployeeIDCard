import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Building2,
  X,
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export default function Sidebar({ isOpen, onClose }) {
  const { isSuperAdmin, organization, allOrganizations, allUsers } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentAdminTab = searchParams.get('tab') || 'queue';
  const isCompanyTabActive = location.pathname === '/entry' && searchParams.get('tab') === 'company';
  const isEntryCardsActive = location.pathname === '/entry' && searchParams.get('tab') !== 'company';

  const isDesignerLocked = !isSuperAdmin && organization?.designerEnabled === false;

  const NAV_ITEMS = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      isActive: location.pathname === '/dashboard',
    },
    {
      to: '/entry',
      label: 'Data Entry',
      icon: UserPlus,
      badge: 'Cards',
      isActive: isEntryCardsActive,
    },
    {
      to: '/entry?tab=company',
      label: 'Company Info',
      icon: Building2,
      badge: 'Profile',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/20',
      isActive: isCompanyTabActive,
    },
    {
      to: '/designer',
      label: 'Card Designer',
      icon: isDesignerLocked ? Lock : Palette,
      badge: isDesignerLocked ? 'Locked' : '300 DPI',
      badgeClass: isDesignerLocked
        ? 'bg-amber-500/20 text-amber-300 border-amber-400/20'
        : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/20',
      isActive: location.pathname === '/designer',
    },
    {
      to: '/records',
      label: 'Records & Roster',
      icon: Users,
      badge: null,
      isActive: location.pathname === '/records',
    },
  ];

  // Helper renderer for links
  const renderNavContent = (isMobileDrawer = false) => (
    <div className="p-4 space-y-6 flex-1 overflow-y-auto">
      {/* Mobile Drawer Header with Close Button */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Navigation Menu</h3>
            <p className="text-[11px] text-slate-400 truncate max-w-[190px]">
              {organization?.name || 'ID Card Studio'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

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
                onClick={isMobileDrawer ? onClose : undefined}
                className={() =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    item.isActive
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
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Super Administration
          </p>
          <nav className="space-y-1">
            <NavLink
              to="/admin?tab=queue"
              onClick={isMobileDrawer ? onClose : undefined}
              className={() => {
                const active = location.pathname === '/admin' && currentAdminTab === 'queue';
                return `flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/10'
                }`;
              }}
            >
              <div className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Print Queue</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                MASTER
              </span>
            </NavLink>

            <NavLink
              to="/admin?tab=organizations"
              onClick={isMobileDrawer ? onClose : undefined}
              className={() => {
                const active = location.pathname === '/admin' && currentAdminTab === 'organizations';
                return `flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/10'
                }`;
              }}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Organizations</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200">
                {allOrganizations?.length || 0}
              </span>
            </NavLink>

            <NavLink
              to="/admin?tab=users"
              onClick={isMobileDrawer ? onClose : undefined}
              className={() => {
                const active = location.pathname === '/admin' && currentAdminTab === 'users';
                return `flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/10'
                }`;
              }}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0 text-purple-400" />
                <span>Users</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200">
                {allUsers?.length || 0}
              </span>
            </NavLink>
          </nav>
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
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        {renderNavContent(false)}

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

      {/* 2. MOBILE SLIDE-OVER DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer Body */}
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}

            <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                <span>PDF Imposition</span>
              </div>
              <span className="text-emerald-400 font-mono font-semibold">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/entry"
          className={() =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isEntryCardsActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <UserPlus className="w-4 h-4" />
          <span>Cards</span>
        </NavLink>

        <NavLink
          to="/entry?tab=company"
          className={() =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isCompanyTabActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Building2 className="w-4 h-4" />
          <span>Company</span>
        </NavLink>

        <NavLink
          to="/records"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Users className="w-4 h-4" />
          <span>Roster</span>
        </NavLink>

        <NavLink
          to="/designer"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Palette className="w-4 h-4" />
          <span>Designer</span>
        </NavLink>

        {isSuperAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-purple-400 font-semibold' : 'text-purple-300/80 hover:text-purple-200'
              }`
            }
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
