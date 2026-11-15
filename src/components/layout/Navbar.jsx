import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  CreditCard,
  LogOut,
  Cloud,
  HardDrive,
  Building2,
  User,
  Shield,
  ShieldCheck,
  ExternalLink,
  Globe,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar({ onToggleMobileMenu, isMobileMenuOpen }) {
  const {
    currentUser,
    organization,
    isFirebaseConfigured,
    isSuperAdmin,
    logout,
  } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Mobile Menu Toggle & Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-1.5 sm:gap-2 leading-tight">
              <span>ID Card Studio</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                CR80 / 300 DPI
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 truncate max-w-[130px] sm:max-w-[240px]">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">
                {isSuperAdmin ? 'Super Admin HQ' : organization?.name || 'My Organization'}
              </span>
            </p>
          </div>
        </Link>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Badge (Super Admin vs Org User) */}
        {currentUser && (
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-xl border ${
              isSuperAdmin
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 font-semibold'
                : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 font-medium'
            }`}
          >
            {isSuperAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="hidden md:inline">{isSuperAdmin ? 'Super Administrator' : 'Organization User'}</span>
            <span className="md:hidden">{isSuperAdmin ? 'Admin' : 'User'}</span>
          </div>
        )}

        {/* Environment Status Badge */}
        {isFirebaseConfigured ? (
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            title="Connected to Google Firebase"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Firebase Cloud</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20"
            title="Running in local storage mode"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Database</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
        )}

        {/* View Public Site */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Landing Page (employee.idcard.bd)"
          className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Public Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* User Info & Logout */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight font-mono">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
