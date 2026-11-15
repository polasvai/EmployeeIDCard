import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  QrCode,
  Sparkles,
  Layers,
  Printer,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Building,
  Users,
  Clock,
  Palette,
  FileSpreadsheet,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  Award,
  BadgePercent,
  Check,
  Send,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_VERSION } from '../config/version';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Interactive Calculator State
  const [employeeCount, setEmployeeCount] = useState(75);
  const [includeVerification, setIncludeVerification] = useState(true);
  const [selectedValidityYears, setSelectedValidityYears] = useState(3);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeDeptTab, setActiveDeptTab] = useState('engineering');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Tier Calculation
  const count = Math.max(1, parseInt(employeeCount, 10) || 1);
  let baseRate = 70;
  let tierName = 'Small Business (৳70/card)';
  if (count > 200) {
    baseRate = 50;
    tierName = 'Large Enterprise (৳50/card)';
  } else if (count > 50) {
    baseRate = 60;
    tierName = 'Medium Business (৳60/card)';
  }

  // QR Verification is ৳5 per year per card (e.g. 3 years validity = 3 * 5 = ৳15 / card)
  const verificationCostPerCard = includeVerification ? (5 * selectedValidityYears) : 0;
  const effectivePerCard = baseRate + verificationCostPerCard;
  const totalCost = count * effectivePerCard;
  const savings = count > 50 ? count * (70 - baseRate) : 0;

  // Department Demo Profiles
  const DEPARTMENTS = {
    engineering: {
      name: 'Software & Engineering',
      code: 'ENG',
      color: 'from-blue-600 to-indigo-700',
      accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      badge: 'Level 3 - Systems Access',
      sampleName: 'Tanvir Ahmed',
      designation: 'Principal Cloud Architect',
      idNum: 'ENG-2024-042',
      validThru: '2027-11-14',
    },
    management: {
      name: 'Executive Management',
      code: 'EXEC',
      color: 'from-amber-600 to-yellow-600',
      accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: 'All Facility Access',
      sampleName: 'Farhana Rahman',
      designation: 'Chief Operating Officer',
      idNum: 'EXEC-2024-003',
      validThru: '2027-11-14',
    },
    hr: {
      name: 'Human Resources & Talent',
      code: 'HR',
      color: 'from-purple-600 to-pink-600',
      accentColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      badge: 'HR & Administrative Wing',
      sampleName: 'Sadia Jahan',
      designation: 'Head of People Operations',
      idNum: 'HR-2024-019',
      validThru: '2027-11-14',
    },
    operations: {
      name: 'Operations & Supply Chain',
      code: 'OPS',
      color: 'from-emerald-600 to-teal-700',
      accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badge: 'Logistics Hub Access',
      sampleName: 'Mahmudul Hasan',
      designation: 'Supply Chain Director',
      idNum: 'OPS-2024-088',
      validThru: '2027-11-14',
    },
  };

  const currentDept = DEPARTMENTS[activeDeptTab];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">employee.idcard.bd</span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Cloud Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Enterprise PVC Card Printing & Verification</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#packages" className="hover:text-white transition-colors">
              Packages & Pricing
            </a>
            <a href="#calculator" className="hover:text-white transition-colors">
              Price Calculator
            </a>
            <a href="#departments" className="hover:text-white transition-colors">
              Department Designs
            </a>
            <a href="#verification" className="hover:text-white transition-colors">
              Online Verification
            </a>
            <Link to="/verify" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 font-semibold">
              <QrCode className="w-4 h-4" /> Verify a Card
            </Link>
          </nav>

          {/* User Action CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 sm:gap-2"
              >
                <span>Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 sm:gap-2"
              >
                <span>Login</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-2xl">
            <nav className="flex flex-col gap-2 text-xs font-medium text-slate-300">
              <a
                href="#packages"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
              >
                Packages & Pricing
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
              >
                Price Calculator
              </a>
              <a
                href="#departments"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
              >
                Department Designs
              </a>
              <a
                href="#verification"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors"
              >
                Online Verification
              </a>
              <Link
                to="/verify"
                onClick={() => setMobileNavOpen(false)}
                className="py-2 px-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 font-semibold"
              >
                <QrCode className="w-4 h-4" /> Verify a Card Online
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Custom Department Branding &bull; Smart QR Verification</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Next-Generation ID Cards for{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Modern Bangladesh
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Custom department designs, 300 DPI vector PDF imposition, and tamper-proof online QR verification.
              Physical PVC card printing starting at only <span className="text-emerald-400 font-bold">৳50 / card</span> with verified validity tracking.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#packages"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>View Pricing Packages</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <Link
                to="/verify"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Test Online QR Verification</span>
              </Link>
            </div>

            {/* Key Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <Palette className="w-5 h-5 text-indigo-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Custom Dept Designs</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Tailored styling for every corporate wing</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <QrCode className="w-5 h-5 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Smart QR Verification</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">৳5 / Year per card for live validity</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
                <Printer className="w-5 h-5 text-sky-400 mb-2" />
                <h4 className="text-xs font-bold text-white">300 DPI Vector PDF</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated A4/A3 imposition layouts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PACKAGES & PRICING SECTION */}
      <section id="packages" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BadgePercent className="w-3.5 h-3.5" /> Transparent Pricing in BDT
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tailored Plans for Every Organization
          </h2>
          <p className="text-sm text-slate-300">
            All plans include custom department designs, premium CR-80 PVC cards, and dual-side full-color printing.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* TIER 1: Small Business */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tier 1
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Small Business</h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-semibold text-slate-300">
                  Up to 50 Cards
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                Ideal for startups, creative studios, retail shops, and boutique clinics.
              </p>

              <div className="mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">৳70</span>
                  <span className="text-xs text-slate-400 font-medium">/ per card</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Minimum order: 10 cards</p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Custom Design for Each Department</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full-Color Dual-Side CR-80 PVC Printing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>300 DPI High-Definition Vector Rendering</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Standard Glossy or Matte Protection Overlay</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bengali & English Typography Rendering</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <PlusCircleIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Online QR Verification Add-on: <strong>+৳5/year per card</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setEmployeeCount(35);
                setIsOrderModalOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Order Small Business Pack
            </button>
          </div>

          {/* TIER 2: Medium Business (Featured) */}
          <div className="bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-7 flex flex-col justify-between relative shadow-2xl shadow-indigo-950/50 scale-100 md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-white text-[11px] font-bold tracking-wide shadow-md flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Most Popular & Recommended
            </div>

            <div>
              <div className="flex justify-between items-start mb-4 pt-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Tier 2
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Medium Business</h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                  50 - 200 Cards
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-6">
                Perfect for mid-sized corporations, colleges, schools, and growing factories.
              </p>

              <div className="mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">৳60</span>
                  <span className="text-xs text-slate-400 font-medium">/ per card</span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Save ৳10 per card vs small tier</p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-3 text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Everything in Small Business, plus:</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Distinct Department Color Hierarchy</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bulk Excel / CSV Spreadsheet Auto-Import</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority 24-Hour Digital PDF Proof Approval</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prompt Courier Delivery inside Dhaka City</span>
                </li>
                <li className="flex items-center gap-2.5 text-indigo-300">
                  <PlusCircleIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Online QR Verification Add-on: <strong>+৳5/year per card</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setEmployeeCount(120);
                setIsOrderModalOpen(true);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              Order Medium Business Pack
            </button>
          </div>

          {/* TIER 3: Large Business */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tier 3
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Large Enterprise</h3>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                  200+ Cards
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                For major enterprises, conglomerates, universities, banks & hospital chains.
              </p>

              <div className="mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">৳50</span>
                  <span className="text-xs text-slate-400 font-medium">/ per card</span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Maximum Volume Discount (Save ৳20/card)</p>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Everything in Medium Business, plus:</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Dedicated Senior Designer</strong> for all wings</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>RFID / Mifare / Contactless Smart Card Support</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Volume Batch Imposition with Crop Mark Alignment</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Nationwide Insured Corporate Delivery</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <PlusCircleIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Online QR Verification Add-on: <strong>+৳5/year per card</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setEmployeeCount(350);
                setIsOrderModalOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Order Enterprise Pack
            </button>
          </div>
        </div>

        {/* 4. ONLINE VERIFICATION QR FEATURE CALLOUT */}
        <div id="verification" className="mt-16 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <QrCode className="w-4 h-4" /> Smart Online Verification Service &bull; ৳5 / Year per Card
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Instant Anti-Counterfeit QR Verification with 1 to 5 Year Validity
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                Add an online verification QR code to each card for just <strong>৳5 per year per card</strong> (e.g. ৳15 for 3 years validity).
                When any smartphone camera scans the physical card, it opens our official verification portal at{' '}
                <span className="text-emerald-400 font-mono font-semibold">employee.idcard.bd/verify</span>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Within Active Validity</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Displays green checkmark, cardholder photo, designation, and valid period (e.g. 3 Years).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">After Expiry Date</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically triggers a prominent red alert informing security that the credential is no longer valid.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-xl">
              <div className="w-32 h-32 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center mb-4">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://employee.idcard.bd/verify"
                  alt="Sample Verification QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-bold text-white">Scan with any Phone</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct edge verification in under 300ms</p>
              <Link
                to="/verify"
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Live Verification Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE LIVE PRICING CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" /> Instant Cost Estimator
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Calculate Your Total Investment
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Drag the slider to see automatic tier pricing, volume savings, and optional online verification.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Controls */}
            <div className="md:col-span-7 space-y-6">
              {/* Slider & Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Number of Employee / Student Cards:
                  </label>
                  <span className="text-lg font-black text-indigo-400 font-mono">
                    {count} Cards
                  </span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                  <span>10 cards</span>
                  <span>50 (৳70)</span>
                  <span>200 (৳60)</span>
                  <span>500+ (৳50)</span>
                </div>
              </div>

              {/* Online Verification Toggle */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeVerification}
                    onChange={(e) => setIncludeVerification(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Include Online QR Verification</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        ৳5 / Year per Card
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Printed QR code on card; live validity check on scan ({selectedValidityYears} Years = ৳{5 * selectedValidityYears} / card).
                    </p>
                  </div>
                </label>

                {includeVerification && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Card Validity Period:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 5].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setSelectedValidityYears(yr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            selectedValidityYears === yr
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {yr} {yr === 1 ? 'Year' : 'Years'} (৳{yr * 5})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Department Notice */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Custom design for each department included automatically at no extra charge.</span>
              </div>
            </div>

            {/* Right Summary Box */}
            <div className="md:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Estimated Quotation
                </span>
                <div className="mt-2 space-y-2 text-xs border-b border-slate-800/80 pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Card Tier:</span>
                    <span className="font-semibold text-slate-200">{tierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base PVC Printing:</span>
                    <span className="font-mono text-slate-200">{count} &times; ৳{baseRate} = ৳{count * baseRate}</span>
                  </div>
                  {includeVerification && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Online Verification ({selectedValidityYears} Yrs @ ৳5/yr):</span>
                      <span className="font-mono">{count} &times; ৳{5 * selectedValidityYears} = ৳{(count * 5 * selectedValidityYears).toLocaleString('en-US')}</span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-indigo-400 font-semibold">
                      <span>Volume Savings:</span>
                      <span className="font-mono">-৳{savings}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <span className="text-xs text-slate-400">Total Estimated Cost:</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-white">৳{totalCost.toLocaleString('en-US')}</span>
                    <span className="text-xs text-slate-400 font-medium">BDT</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    (Effective: ৳{effectivePerCard} / card {includeVerification ? `with ${selectedValidityYears}-year live verification` : ''})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Request Quotation / Place Order</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEPARTMENT CUSTOM DESIGN SHOWCASE */}
      <section id="departments" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Palette className="w-3.5 h-3.5" /> Department Brand Matrix
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Custom Design for Each Department
          </h2>
          <p className="text-sm text-slate-300">
            Every department in your company gets its own visual identity, color scheme, and hierarchy while preserving the overarching corporate brand.
          </p>
        </div>

        {/* Department Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {Object.entries(DEPARTMENTS).map(([key, dept]) => (
            <button
              key={key}
              onClick={() => setActiveDeptTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeDeptTab === key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>

        {/* Live Card Preview Box */}
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Card Mockup Graphic */}
          <div className="md:col-span-6 flex justify-center">
            <div className="w-[280px] h-[440px] bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between p-5 text-white">
              {/* Header Gradient */}
              <div className={`absolute top-0 left-0 right-0 h-28 bg-gradient-to-br ${currentDept.color} opacity-90 p-4`}>
                <div className="flex justify-between items-center text-white">
                  <span className="font-bold text-xs tracking-wider">ACME CORP</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm">
                    {currentDept.code}
                  </span>
                </div>
              </div>

              {/* Photo Area */}
              <div className="relative mt-12 z-10 flex flex-col items-center">
                <div className="w-24 h-28 rounded-xl bg-slate-800 border-2 border-white/80 shadow-lg overflow-hidden flex items-center justify-center">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h4 className="font-bold text-base mt-2.5 text-center text-white">{currentDept.sampleName}</h4>
                <p className="text-[11px] text-slate-300 text-center font-medium">{currentDept.designation}</p>
                <span className={`mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${currentDept.accentColor}`}>
                  {currentDept.name}
                </span>
              </div>

              {/* Bottom Credential Bar & QR */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <p className="text-slate-400">ID: <span className="font-mono text-white font-bold">{currentDept.idNum}</span></p>
                  <p className="text-slate-400">Exp: <span className="font-mono text-emerald-400 font-bold">{currentDept.validThru}</span></p>
                  <p className="text-slate-400">{currentDept.badge}</p>
                </div>
                <div className="w-12 h-12 bg-white p-1 rounded-lg">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://employee.idcard.bd/verify"
                    alt="QR"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Department Features Info */}
          <div className="md:col-span-6 space-y-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${currentDept.accentColor}`}>
              Active Template: {currentDept.name}
            </div>

            <h3 className="text-2xl font-bold text-white">
              Tailored Visual Aesthetics for {currentDept.name}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When printing ID cards for your organization, your sales, engineering, executive, and medical staff don't have to look identical.
              Each department can feature distinct color schemes, security access indicators, and department logos while maintaining strict corporate branding guidelines.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Department-specific accent colors and badges</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Access tier indicators (e.g. Server Room, Executive Floor)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Independent Excel sheet batch import per department</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Printed expiry date and QR verification mapping</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>Customize Department Layouts in Card Designer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-400">Everything you need to know about card printing, delivery, and online verification.</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-white text-base">How does the Online Verification QR code work?</h4>
              <p className="text-slate-300 leading-relaxed">
                We print a unique, high-resolution QR code on the back (or front) of each card. When anyone scans this QR with their smartphone camera, it opens a secure page on <span className="text-emerald-400 font-mono">employee.idcard.bd/verify</span>. It shows the employee's genuine photo, name, department, and confirms if the card is currently valid or expired based on the assigned validity period (e.g. 1, 2, 3, or 5 years).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-white text-base">Can we have different designs for each department?</h4>
              <p className="text-slate-300 leading-relaxed">
                Yes! Custom design for each department is included in all packages at no extra cost. Your IT, HR, Executive, Operations, or Student faculties can all have dedicated color schemes and titles.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-white text-base">What is the turnaround time for printing and delivery?</h4>
              <p className="text-slate-300 leading-relaxed">
                Digital proofs are generated in under 24 hours. Once approved, printing typically takes 24 to 48 hours. Orders inside Dhaka are delivered via local express courier within 1-2 days; outside Dhaka takes 2-3 business days.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-white text-base">Can we export 300 DPI vector PDFs to print in our own press?</h4>
              <p className="text-slate-300 leading-relaxed">
                Yes! Our built-in Studio offers high-resolution 300 DPI vector PDF imposition (10 cards per A4 sheet or 20 per A3 sheet) with cutting crop marks and duplex registration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. ORDER INQUIRY MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">Order / Quotation Request</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selected: {count} Cards &bull; {tierName} {includeVerification ? '+ Verification' : ''}
                </p>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Cards:</span>
                <span className="font-bold text-white">{count} Cards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price per Card:</span>
                <span className="font-bold text-emerald-400">৳{effectivePerCard}</span>
              </div>
              {includeVerification && (
                <div className="flex justify-between text-[11px] text-emerald-400">
                  <span>Verification ({selectedValidityYears} Years @ ৳5/yr):</span>
                  <span>+৳{5 * selectedValidityYears} / card</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1">
                <span className="font-semibold text-white">Estimated Total:</span>
                <span className="font-bold text-white text-sm">৳{totalCost.toLocaleString('en-US')} BDT</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Institution Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka Tech Ltd."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Person & Phone</label>
                <input
                  type="text"
                  placeholder="e.g. Polas (+880 17...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email / Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. office@company.com / Gulshan-2, Dhaka"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert('Thank you! Your quotation request has been recorded. Our corporate team will reach out to you shortly.');
                  setIsOrderModalOpen(false);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg"
              >
                Submit Quotation Request
              </button>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">employee.idcard.bd</span>
              <p className="text-[11px] text-slate-500">ID Card Studio &bull; Enterprise Cloud Identity Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#packages" className="hover:text-white transition-colors">Pricing</a>
            <a href="#departments" className="hover:text-white transition-colors">Department Design</a>
            <Link to="/verify" className="hover:text-emerald-400 transition-colors">Verify Portal</Link>
            <Link to="/login" className="hover:text-white transition-colors">Studio Login</Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Release Version:</span>
            <span className="font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              v{APP_VERSION}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-8 border-t border-slate-900/80 text-center text-[11px] text-slate-500">
          &copy; {new Date().getFullYear()} employee.idcard.bd. All Rights Reserved. Specialized PVC ID Card Manufacturing & Digital Identity Systems.
        </div>
      </footer>
    </div>
  );
}

// Small icon helper
function PlusCircleIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
