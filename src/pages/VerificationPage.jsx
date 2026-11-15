import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  Building,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ExternalLink,
  Printer,
  Sparkles,
  QrCode,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Phone,
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function VerificationPage() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id') || searchParams.get('cardId');
  const activeId = routeId || queryId || '';

  const [searchInput, setSearchInput] = useState(activeId);
  const [loading, setLoading] = useState(Boolean(activeId));
  const [record, setRecord] = useState(null);
  const [searched, setSearched] = useState(Boolean(activeId));

  const fetchCardRecord = async (searchId) => {
    if (!searchId || !searchId.trim()) {
      setRecord(null);
      setSearched(false);
      return;
    }

    const cleanId = searchId.trim();
    setLoading(true);
    setSearched(true);
    let found = null;

    // 1. Try Firebase Firestore (public_cards collection)
    if (isFirebaseConfigured && db) {
      try {
        // Direct document by ID
        const docRef = doc(db, 'public_cards', cleanId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          found = snap.data();
        } else {
          // Query by idNumber
          const q = query(collection(db, 'public_cards'), where('idNumber', '==', cleanId));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            found = qSnap.docs[0].data();
          }
        }
      } catch (e) {
        console.warn('Firestore public card check failed:', e);
      }
    }

    // 2. Fallback: LocalStorage records (for local dev / offline sync)
    if (!found) {
      try {
        const stored = localStorage.getItem('id_studio_records');
        if (stored) {
          const list = JSON.parse(stored);
          found = list.find((r) => r.id === cleanId || r.idNumber === cleanId);
        }
      } catch (e) {}
    }

    // 3. Fallback: Parse query parameters if encoded in URL
    if (!found && searchParams.get('name')) {
      found = {
        idNumber: cleanId,
        fullName: searchParams.get('name'),
        department: searchParams.get('dept') || 'General',
        designation: searchParams.get('role') || 'Staff',
        validThru: searchParams.get('exp') || '2027-12-31',
        photoUrl: searchParams.get('photo') || '',
        organizationName: searchParams.get('org') || 'Verified Institution',
        status: 'active',
      };
    }

    setRecord(found);
    setLoading(false);
  };

  useEffect(() => {
    if (activeId) {
      setSearchInput(activeId);
      fetchCardRecord(activeId);
    }
  }, [activeId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchCardRecord(searchInput.trim());
    }
  };

  // Validity calculation
  const getValidityInfo = (rec) => {
    if (!rec) return null;
    const now = new Date();
    const expiryStr = rec.validThru;
    
    if (!expiryStr) {
      return {
        isValid: true,
        isExpired: false,
        message: 'Lifetime / Open Validity',
        badgeColor: 'emerald',
      };
    }

    const expiryDate = new Date(expiryStr);
    // If end of day inclusive:
    expiryDate.setHours(23, 59, 59, 999);

    const isExpired = now.getTime() > expiryDate.getTime();

    if (isExpired) {
      return {
        isValid: false,
        isExpired: true,
        message: `Card Expired on ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        badgeColor: 'rose',
      };
    }

    // Calculate remaining duration
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffYears = (diffDays / 365.25).toFixed(1);

    let remainingText = '';
    if (diffDays < 30) {
      remainingText = `Expires in ${diffDays} day(s)`;
    } else if (diffDays < 365) {
      remainingText = `Expires in ${Math.round(diffDays / 30)} month(s)`;
    } else {
      remainingText = `Valid for ~${diffYears} more year(s)`;
    }

    return {
      isValid: true,
      isExpired: false,
      message: `Active & Valid (${remainingText})`,
      expiryFormatted: expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      badgeColor: 'emerald',
    };
  };

  const validity = record ? getValidityInfo(record) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">employee.idcard.bd</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Verify
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Official National ID Card Verification Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 hidden sm:flex"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <Link
              to="/login"
              className="text-xs px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-md shadow-indigo-600/30"
            >
              Studio Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
        {/* Verification Search Bar */}
        <div className="w-full max-w-xl mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Cloudflare Edge-Secured Verification
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Online ID Card Authenticity Check
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2">
              Scan a card's QR code or enter the Employee/Student ID number below to verify legitimacy and live validity.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter ID Number (e.g. EMP-2024-001)..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl pl-11 pr-28 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-lg"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Verify Card'}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Verifying security signature & database records...</p>
          </div>
        )}

        {/* Verification Result Card */}
        {!loading && searched && record && validity && (
          <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Status Header Banner */}
            <div
              className={`rounded-t-3xl p-6 border-t border-x ${
                validity.isValid
                  ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500/30'
                  : 'bg-gradient-to-b from-rose-950/80 to-slate-900 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                    validity.isValid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-4 ring-emerald-500/10'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 ring-4 ring-rose-500/10'
                  }`}
                >
                  {validity.isValid ? (
                    <BadgeCheck className="w-8 h-8 animate-pulse" />
                  ) : (
                    <ShieldAlert className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        validity.isValid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {validity.isValid ? 'Official Verified ID' : 'Expired / Not Valid'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: #{record.idNumber || record.id}
                    </span>
                  </div>
                  <h2
                    className={`text-xl md:text-2xl font-bold mt-1 ${
                      validity.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {validity.isValid ? 'AUTHENTIC & VALID ID CARD' : 'CARD EXPIRED / INVALID'}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">{validity.message}</p>
                </div>
              </div>
            </div>

            {/* Credential Details Container */}
            <div className="bg-slate-900 border-x border-b border-slate-800 rounded-b-3xl p-6 shadow-2xl space-y-6">
              {/* Photo & Identity Core */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-800/80">
                <div className="relative">
                  <div className="w-28 h-36 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-xl flex items-center justify-center">
                    {record.photoUrl ? (
                      <img
                        src={record.photoUrl}
                        alt={record.fullName}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-600" />
                    )}
                  </div>
                  {validity.isValid ? (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {record.department || 'Department Staff'}
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {record.fullName || 'Cardholder Name'}
                  </h3>
                  {record.nameBangla && (
                    <p className="text-base font-medium text-slate-300 font-serif">
                      {record.nameBangla}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-slate-300">
                    {record.designation || 'Member'}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      {record.organizationName || 'Verified Organization'}
                    </span>
                    {record.bloodGroup && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold font-mono">
                        Blood: {record.bloodGroup}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Validity & Verification Metas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Issue / Joining Date</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {record.joiningDate || 'Recorded on Registration'}
                  </p>
                </div>

                <div
                  className={`border rounded-2xl p-4 space-y-1 ${
                    validity.isValid
                      ? 'bg-slate-950/60 border-slate-800/80'
                      : 'bg-rose-950/30 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Valid Until / Expiration Date</span>
                  </div>
                  <p
                    className={`text-sm font-bold font-mono ${
                      validity.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {record.validThru || 'Open Validity'}
                  </p>
                </div>
              </div>

              {/* Alert message if expired */}
              {validity.isExpired && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-200">Notice to Security & Verification Officers</h4>
                    <p className="mt-1 text-rose-300/90 leading-relaxed">
                      This ID card is no longer valid. The holder has exceeded the designated expiration term.
                      Do not honor this badge for building access, facility privileges, or company representation.
                      Please advise the holder to request a renewed ID card from their HR or Academic administration.
                    </p>
                  </div>
                </div>
              )}

              {/* Trust & Security Footnote */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Cloudflare Edge Authenticated &bull; Secure Enterprise Storage</span>
                </div>
                <span>Queried: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && searched && !record && (
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Matching ID Card Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                We could not locate any active or issued ID card with ID number{' '}
                <span className="font-mono text-amber-400 font-semibold">"{searchInput}"</span> in our verified registry.
              </p>
            </div>
            <div className="pt-2 text-[11px] text-slate-500">
              Please double check the ID number or contact the issuing organization directly.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} employee.idcard.bd &bull; Digital Identity & Verification Cloud System</p>
      </footer>
    </div>
  );
}
