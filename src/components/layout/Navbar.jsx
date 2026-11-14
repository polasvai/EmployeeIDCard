import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, LogOut, Cloud, HardDrive, Building2, User } from 'lucide-react';

export default function Navbar() {
  const { currentUser, organization, isFirebaseConfigured, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Logo & Name */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            ID Card Studio
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              CR80 / 300 DPI
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-slate-500" />
            {organization?.name || 'My Organization'}
          </p>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center space-x-4">
        {/* Environment Status Badge */}
        {isFirebaseConfigured ? (
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Connected to Google Firebase">
            <Cloud className="w-3.5 h-3.5" />
            <span>Firebase Cloud</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Running client-side without cloud keys">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Demo Mode</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
        )}

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
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {currentUser.email || 'Free Tier Owner'}
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
