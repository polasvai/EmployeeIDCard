import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Building2,
  Upload,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  PenTool,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { uploadPortraitPhoto } from '../../services/storageService';
import { compressImageFile } from '../../utils/imageProcessor';

export default function CompanyInfoForm({ onSaved }) {
  const { organization, updateCompanyInfo, currentUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    nameBangla: '',
    tagline: '',
    taglineBangla: '',
    shortCode: '',
    logoUrl: '',
    address: '',
    addressBangla: '',
    phone: '',
    email: '',
    website: '',
    signatoryName: '',
    signatoryTitle: 'Authorized Signatory',
    signatorySignatureUrl: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync with organization in auth
  useEffect(() => {
    if (organization) {
      setFormData((prev) => ({
        ...prev,
        name: organization.name || '',
        nameBangla: organization.nameBangla || '',
        tagline: organization.tagline || '',
        taglineBangla: organization.taglineBangla || '',
        shortCode: organization.shortCode || '',
        logoUrl: organization.logoUrl || '',
        address: organization.address || '',
        addressBangla: organization.addressBangla || '',
        phone: organization.phone || '',
        email: organization.email || organization.ownerEmail || '',
        website: organization.website || '',
        signatoryName: organization.signatoryName || '',
        signatoryTitle: organization.signatoryTitle || 'Authorized Signatory',
        signatorySignatureUrl: organization.signatorySignatureUrl || '',
      }));
    }
  }, [organization]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Upload Logo to Cloudflare R2 / Storage
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.9);
      const res = await uploadPortraitPhoto({
        blob: compressed.blob,
        dataUrl: compressed.dataUrl,
        recordId: 'company_logo',
        orgId: organization?.id || currentUser?.uid || 'org',
      });
      handleInputChange('logoUrl', res.url);
      showToast('Company logo uploaded successfully!');
    } catch (err) {
      console.error('Logo upload error:', err);
      showToast('Failed to upload logo: ' + err.message, 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Signature to Cloudflare R2 / Storage
  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSignature(true);
    try {
      const compressed = await compressImageFile(file, 400, 200, 0.9);
      const res = await uploadPortraitPhoto({
        blob: compressed.blob,
        dataUrl: compressed.dataUrl,
        recordId: 'company_signatory',
        orgId: organization?.id || currentUser?.uid || 'org',
      });
      handleInputChange('signatorySignatureUrl', res.url);
      showToast('Authorized signature uploaded successfully!');
    } catch (err) {
      console.error('Signature upload error:', err);
      showToast('Failed to upload signature: ' + err.message, 'error');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateCompanyInfo(formData);
      showToast('Company information and ID card assets saved successfully!');
      if (onSaved) onSaved(formData);
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Failed to save company info: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-200'
              : 'bg-emerald-950 border-emerald-500 text-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Corporate Profile
              </span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-[120px] sm:max-w-none">
                ID: {organization?.id || currentUser?.uid}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Company & Institution Info</h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Configure English & Bangla naming, official logo, address, and authorized signature used on all ID cards.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Company Info'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: IDENTITY & NAMING */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">1. Official Naming & Branding</h3>
                <p className="text-[11px] text-slate-400">Appears on the top header of all employee and student ID cards</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Company / Institution Name (English) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Technologies Ltd."
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Company / Institution Name (বাংলা নাম) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: একমি টেকনোলজিস লিমিটেড"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                  value={formData.nameBangla}
                  onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tagline / Slogan (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Innovating the Future"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Tagline / Motto (বাংলা স্লোগান)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্রযুক্তিতে অনন্য"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                  value={formData.taglineBangla}
                  onChange={(e) => handleInputChange('taglineBangla', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Organization Short Code / Acronym
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATL, DU, BRAC"
                  value={formData.shortCode}
                  onChange={(e) => handleInputChange('shortCode', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 uppercase font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: OFFICIAL ADDRESS & CONTACT */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">2. Official Address & Contact Info</h3>
                <p className="text-[11px] text-slate-400">Printed on the back of card for emergency and return instructions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Official Headquarters Address (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. House 45, Road 11, Banani, Dhaka-1213"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Official Headquarters Address (বাংলা ঠিকানা)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: বাড়ি ৪৫, রোড ১১, বনানী, ঢাকা-১২১৩"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                  value={formData.addressBangla}
                  onChange={(e) => handleInputChange('addressBangla', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone / Hotline</label>
                  <input
                    type="tel"
                    placeholder="e.g. +880 2 9876543"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. info@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="e.g. www.company.com.bd"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: AUTHORIZED SIGNATORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">3. Authorized Signatory</h3>
                <p className="text-[11px] text-slate-400">Printed on card back or bottom for executive validation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Signatory Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. M. Rahman"
                  value={formData.signatoryName}
                  onChange={(e) => handleInputChange('signatoryName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Signatory Designation / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Managing Director / Principal / Registrar"
                  value={formData.signatoryTitle}
                  onChange={(e) => handleInputChange('signatoryTitle', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Signature Upload Box */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Authorized Signature Image</label>
              <div className="flex items-center gap-4">
                <div className="w-44 h-16 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden p-2">
                  {formData.signatorySignatureUrl ? (
                    <img
                      src={formData.signatorySignatureUrl}
                      alt="Signature Preview"
                      className="max-h-full max-w-full object-contain filter invert"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No signature uploaded</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer text-xs font-semibold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingSignature ? 'Uploading...' : 'Upload Signature'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      disabled={uploadingSignature}
                      className="hidden"
                    />
                  </label>
                  {formData.signatorySignatureUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('signatorySignatureUrl', '')}
                      className="block text-[11px] text-rose-400 hover:underline pt-0.5"
                    >
                      Remove Signature
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400">Transparent PNG recommended (max 500KB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logo Upload & Live ID Card Mockup (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Official Organization Logo</span>
            </h3>

            {/* Logo Preview */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 relative">
              <div className="w-28 h-28 rounded-2xl bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden p-3 mb-4">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt={formData.name || 'Company Logo'}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-600" />
                )}
              </div>

              <label className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-600/30">
                <Upload className="w-4 h-4" />
                <span>{uploadingLogo ? 'Uploading to R2...' : 'Upload Official Logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => handleInputChange('logoUrl', '')}
                  className="mt-2 text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove Logo
                </button>
              )}

              <p className="text-[10px] text-slate-400 text-center mt-3">
                PNG or SVG with transparent background recommended (400 &times; 400 px).
              </p>
            </div>
          </div>

          {/* Live ID Card Preview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-xs uppercase tracking-wider">
                Live Card Header Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                CR80
              </span>
            </div>

            {/* Mini Card Header Mockup */}
            <div className="bg-slate-950 rounded-2xl border border-slate-700 p-4 space-y-3 shadow-lg">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <div className="leading-tight">
                  <h4 className="font-bold text-white text-xs truncate max-w-[180px]">
                    {formData.name || 'Company Name (English)'}
                  </h4>
                  {formData.nameBangla && (
                    <p
                      className="text-[11px] text-slate-300 truncate max-w-[180px]"
                      style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                    >
                      {formData.nameBangla}
                    </p>
                  )}
                  {formData.tagline && (
                    <p className="text-[9px] text-indigo-400 truncate max-w-[180px]">
                      {formData.tagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Snippet */}
              <div className="text-[9px] text-slate-400 space-y-0.5">
                <p className="truncate">{formData.address || 'Company Address Line'}</p>
                <div className="flex justify-between pt-1 text-[8px] text-slate-400">
                  <span>Tel: {formData.phone || '+880 ...'}</span>
                  <span>{formData.website || 'website.com'}</span>
                </div>
              </div>

              {formData.signatorySignatureUrl && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                  <div className="text-right">
                    <img
                      src={formData.signatorySignatureUrl}
                      alt="Sign"
                      className="h-6 object-contain inline-block filter invert opacity-90"
                    />
                    <p className="text-[8px] text-slate-400 block border-t border-slate-700/80 mt-0.5 pt-0.5">
                      {formData.signatoryTitle || 'Authorized Signatory'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>These details are automatically available in the Card Designer and Batch PDF Print Imposition engine.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
