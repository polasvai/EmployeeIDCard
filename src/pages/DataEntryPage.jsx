import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Building,
  Phone,
  Shield,
  Camera,
  Save,
  PlusCircle,
  Printer,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  Layers,
  Sparkles,
  Users,
  MapPin,
  FileText,
  Building2,
  UserPlus,
} from 'lucide-react';
import PhotoCropModal from '../components/records/PhotoCropModal';
import PrintPreviewModal from '../components/print/PrintPreviewModal';
import CompanyInfoForm from '../components/records/CompanyInfoForm';
import { DEFAULT_TEMPLATES, DEFAULT_TEMPLATE } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { compressImageFile } from '../utils/imageProcessor';

const INITIAL_FORM = {
  templateId: 'tpl-corporate',
  fullName: '',
  nameBangla: '',
  idNumber: '',
  photoUrl: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  nationality: 'Bangladeshi',
  nationalId: '',
  fatherName: '',
  motherName: '',
  spouseName: '',
  maritalStatus: '',
  religion: '',
  district: '',
  department: '',
  designation: '',
  roleType: 'Employee',
  campus: '',
  joiningDate: '',
  validThru: '',
  reportingManager: '',
  phone: '',
  email: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyPhone: '',
  address: '',
  rfid: '',
  barcodePayload: '',
  notes: '',
  status: 'active',
  printStatus: 'pending',
};

export default function DataEntryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'company' ? 'company' : 'cards'
  );

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'company' ? 'company' : 'cards');
  }, [searchParams]);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATE);
  const [previewSide, setPreviewSide] = useState('front');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load templates & existing record (if editing)
  useEffect(() => {
    // 1. Load templates
    const savedTemplates = localStorage.getItem('id_studio_templates');
    let loadedTemplates = DEFAULT_TEMPLATES;
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedTemplates = parsed;
        }
      } catch (e) {}
    }
    setTemplates(loadedTemplates);

    // 2. If editing existing record:
    if (editId) {
      const loadRecord = async () => {
        if (isFirebaseConfigured && db && currentUser?.uid) {
          try {
            const docRef = doc(db, 'organizations', currentUser.uid, 'records', editId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              const rec = {
                ...INITIAL_FORM,
                ...data,
                ...(data.customFields || {}),
              };
              setFormData(rec);
              const matchedTemplate =
                loadedTemplates.find((t) => t.id === rec.templateId) || loadedTemplates[0];
              setActiveTemplate(matchedTemplate);
              return;
            }
          } catch (e) {
            console.warn('Failed to load record from firestore:', e);
          }
        }

        const stored = localStorage.getItem('id_studio_records');
        if (stored) {
          try {
            const list = JSON.parse(stored);
            const found = list.find((r) => r.id === editId);
            if (found) {
              const rec = {
                ...INITIAL_FORM,
                ...found,
                ...(found.customFields || {}),
              };
              setFormData(rec);
              const matchedTemplate =
                loadedTemplates.find((t) => t.id === rec.templateId) || loadedTemplates[0];
              setActiveTemplate(matchedTemplate);
            }
          } catch (e) {}
        }
      };
      loadRecord();
    } else {
      // New record: default to first template
      setActiveTemplate(loadedTemplates[0]);
      setFormData((prev) => ({ ...prev, templateId: loadedTemplates[0].id }));
    }
  }, [editId, currentUser]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // If template changed, update active template object for live preview
    if (field === 'templateId') {
      const selected = templates.find((t) => t.id === value);
      if (selected) setActiveTemplate(selected);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl } = await compressImageFile(file, 800, 800, 0.9);
      setCropImageSrc(dataUrl);
      setIsCropOpen(true);
    } catch (err) {
      showToast('Failed to read image file', 'error');
    }
  };

  const handlePhotoSaved = (croppedUrl) => {
    setFormData((prev) => ({ ...prev, photoUrl: croppedUrl }));
    showToast('Portrait photo attached.');
  };

  const saveRecord = async () => {
    if (!formData.fullName.trim() || !formData.idNumber.trim()) {
      showToast('Full Name and ID Number are mandatory.', 'error');
      return null;
    }

    setLoading(true);
    const recordId = editId || `rec-${Date.now()}`;

    const recordToSave = {
      id: recordId,
      templateId: formData.templateId || 'tpl-corporate',
      fullName: formData.fullName.trim(),
      nameBangla: formData.nameBangla.trim(),
      idNumber: formData.idNumber.trim(),
      photoUrl: formData.photoUrl || null,
      printStatus: formData.printStatus || 'pending',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: {
        nameBangla: formData.nameBangla.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        nationality: formData.nationality,
        nationalId: formData.nationalId,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        spouseName: formData.spouseName,
        maritalStatus: formData.maritalStatus,
        religion: formData.religion,
        district: formData.district,
        department: formData.department,
        designation: formData.designation,
        roleType: formData.roleType,
        campus: formData.campus,
        joiningDate: formData.joiningDate,
        validThru: formData.validThru,
        reportingManager: formData.reportingManager,
        phone: formData.phone,
        email: formData.email,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactRelation: formData.emergencyContactRelation,
        emergencyPhone: formData.emergencyPhone,
        address: formData.address,
        rfid: formData.rfid,
        barcodePayload: formData.barcodePayload || formData.idNumber,
        notes: formData.notes,
        status: formData.status,
      },
    };

    // 1. Firebase save
    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const docRef = doc(db, 'organizations', currentUser.uid, 'records', recordId);
        await setDoc(docRef, {
          ...recordToSave,
          updatedAt: serverTimestamp(),
        });

        // Mirror public verification summary for instant QR code verification
        try {
          const publicDocRef = doc(db, 'public_cards', recordId);
          await setDoc(publicDocRef, {
            id: recordId,
            idNumber: recordToSave.idNumber || recordId,
            fullName: recordToSave.fullName || '',
            nameBangla: recordToSave.nameBangla || '',
            photoUrl: recordToSave.photoUrl || '',
            designation: recordToSave.designation || '',
            department: recordToSave.department || '',
            joiningDate: recordToSave.joiningDate || '',
            validThru: recordToSave.validThru || '',
            bloodGroup: recordToSave.bloodGroup || '',
            status: recordToSave.status || 'active',
            orgId: currentUser.uid,
            organizationName: currentUser.tenantName || currentUser.displayName || 'ID Card Studio Client',
            updatedAt: serverTimestamp(),
          });
        } catch (pubErr) {
          console.warn('Could not mirror to public_cards:', pubErr);
        }
      } catch (err) {
        console.error('Firestore save failed:', err);
      }
    }

    // 2. Local storage save
    const stored = localStorage.getItem('id_studio_records');
    let list = stored ? JSON.parse(stored) : [];
    const index = list.findIndex((r) => r.id === recordId);
    if (index >= 0) {
      list[index] = recordToSave;
    } else {
      list.unshift(recordToSave);
    }
    localStorage.setItem('id_studio_records', JSON.stringify(list));

    setLoading(false);
    return recordToSave;
  };

  const handleSaveAndView = async () => {
    const saved = await saveRecord();
    if (saved) {
      showToast('Record saved successfully!');
      setTimeout(() => navigate('/records'), 600);
    }
  };

  const handleSaveAndNew = async () => {
    const saved = await saveRecord();
    if (saved) {
      showToast('Record saved! Ready for next entry.');
      setFormData({
        ...INITIAL_FORM,
        templateId: formData.templateId,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (editId) navigate('/entry', { replace: true });
    }
  };

  const handleSaveAndPrint = async () => {
    const saved = await saveRecord();
    if (saved) {
      setIsPrintOpen(true);
    }
  };

  // Live preview record object for the card renderer
  const previewRecord = {
    fullName: formData.fullName || 'FULL NAME HERE',
    nameBangla: formData.nameBangla || 'বাংলা নাম এখানে',
    idNumber: formData.idNumber || 'ID-000000',
    photoUrl: formData.photoUrl || null,
    customFields: {
      ...formData,
      department: formData.department || 'Department / Stream',
      designation: formData.designation || 'Designation / Role',
      bloodGroup: formData.bloodGroup || 'O+',
      validThru: formData.validThru || '2028-12-31',
    },
  };

  const isLandscape = activeTemplate.orientation !== 'portrait';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-100 animate-in fade-in">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/records')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Back to Roster"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {activeTab === 'company'
                ? 'Company & Institution Profile'
                : editId
                ? 'Edit ID Card Record'
                : 'Member Data Entry'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'company'
                ? 'Manage English & Bangla company name, logo, address, and authorized signature'
                : 'Single-page view: All personal, Bangla bio, family, organizational, and emergency details'}
            </p>
          </div>
        </div>

        {/* Action Buttons Top (only for Card Entry) */}
        {activeTab === 'cards' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSaveAndNew}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Save & Add Another</span>
            </button>

            <button
              onClick={handleSaveAndPrint}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Save & Print Card</span>
            </button>

            <button
              onClick={handleSaveAndView}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & View Roster'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode Navigation Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('cards');
            setSearchParams({});
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'cards'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Cardholder Data Entry</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('company');
            setSearchParams({ tab: 'company' });
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'company'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Company Info & Assets</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Logo & Address
          </span>
        </button>
      </div>

      {activeTab === 'company' ? (
        <CompanyInfoForm onSaved={() => showToast('Company profile saved successfully!')} />
      ) : (
        /* Main Grid: Form Sections (Left 7 Cols) & Sticky Live Card Preview (Right 5 Cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: All Sections in One Single Continuous View (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 0: DEPARTMENT TEMPLATE SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Card Design & Department Template</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {activeTemplate.orientation.toUpperCase()} CR80
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Select the specific design template for this person&apos;s department or role:
            </p>

            <select
              value={formData.templateId}
              onChange={(e) => handleInputChange('templateId', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-indigo-200 font-semibold focus:border-indigo-500 cursor-pointer"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} — Department: {tpl.department || 'All'} ({tpl.orientation})
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 1: PRIMARY IDENTITY & PHOTO */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">1. Primary Identity & Portrait</h3>
                <p className="text-[11px] text-slate-400">Basic identification details and cardholder portrait photo</p>
              </div>
            </div>

            {/* Photo Upload & Preview Bar */}
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center gap-4">
              <div className="relative w-20 h-24 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 group">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Portrait"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                    <span className="text-[9px] mt-1">No Photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <p className="font-semibold text-slate-200 text-sm">Portrait Photo</p>
                <p className="text-[11px] text-slate-400">
                  Standard 300×300px portrait compressed under 40 KB for optimal print quality.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Portrait</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCropImageSrc(formData.photoUrl);
                        setIsCropOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Crop / Adjust</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name (English) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander R. Morgan"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-indigo-300 font-medium mb-1 flex items-center justify-between">
                  <span>পূর্ণ নাম (বাংলায়) / Bangla Name</span>
                  <span className="text-[10px] text-slate-400">Unicode Bangla</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আলেকজান্ডার আর. মরগান"
                  value={formData.nameBangla}
                  onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-indigo-200 focus:border-indigo-500 text-sm"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ID / Badge / Roll Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-892041 or STU-2026-0891"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  National ID / Passport / NID No
                </label>
                <input
                  type="text"
                  placeholder="e.g. 19922692019482710"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Gender / লিঙ্গ</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male / পুরুষ</option>
                  <option value="Female">Female / মহিলা</option>
                  <option value="Other">Other / অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Date of Birth / জন্ম তারিখ</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Blood Group / রক্তের গ্রুপ</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: FAMILY & BANGLA BIODATA */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">2. Family & Bangla Bio Details</h3>
                <p className="text-[11px] text-slate-400">Paternal, maternal, marital, and regional background for card printing</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Father&apos;s Name / পিতার নাম
                </label>
                <input
                  type="text"
                  placeholder="e.g. Md. Abdul Jalil / মোঃ আব্দুল জলিল"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mother&apos;s Name / মাতার নাম
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahima Khatun / রহিমা খাতুন"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Spouse&apos;s Name / স্বামী বা স্ত্রীর নাম (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mary Morgan / নাসরিন সুলতানা"
                  value={formData.spouseName}
                  onChange={(e) => handleInputChange('spouseName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Marital Status / বৈবাহিক অবস্থা</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single / অবিবাহিত</option>
                  <option value="Married">Married / বিবাহিত</option>
                  <option value="Divorced">Divorced / তালাকপ্রাপ্ত</option>
                  <option value="Widowed">Widowed / বিধবা বা বিপত্নীক</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Religion / ধর্ম</label>
                <select
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="">Select Religion</option>
                  <option value="Islam">Islam / ইসলাম</option>
                  <option value="Hinduism">Hinduism / সনাতন</option>
                  <option value="Christianity">Christianity / খ্রিস্টান</option>
                  <option value="Buddhism">Buddhism / বৌদ্ধ</option>
                  <option value="Other">Other / অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Home District / নিজ জেলা</label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nationality / জাতীয়তা</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ORGANIZATION & ACADEMIC */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">3. Organization & Academic Credentials</h3>
                <p className="text-[11px] text-slate-400">Department, role, stream, campus, and credential validity dates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Department / Faculty / Stream
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering / Science Faculty"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Designation / Role / Class / Grade
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Solutions Architect / 10th Grade"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Role Type</label>
                <select
                  value={formData.roleType}
                  onChange={(e) => handleInputChange('roleType', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="Employee">Full-Time Employee</option>
                  <option value="Contractor">Contractor / Consultant</option>
                  <option value="Student">Student / Scholar</option>
                  <option value="Faculty">Faculty / Teacher</option>
                  <option value="Staff">Administrative Staff</option>
                  <option value="Visitor">Temporary Visitor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Campus / Branch Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Campus / HQ Dhanmondi"
                  value={formData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reporting Manager / Advisor</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={formData.reportingManager}
                  onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Joining / Admission Date
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">
                    Card Expiry / Valid Until / Session
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 mr-1">Validity:</span>
                    {[1, 2, 3, 5].map((yrs) => (
                      <button
                        key={yrs}
                        type="button"
                        onClick={() => {
                          const base = formData.joiningDate ? new Date(formData.joiningDate) : new Date();
                          const exp = new Date(base);
                          exp.setFullYear(exp.getFullYear() + yrs);
                          exp.setDate(exp.getDate() - 1);
                          handleInputChange('validThru', exp.toISOString().split('T')[0]);
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors border border-slate-700"
                        title={`Set validity to ${yrs} year(s) from joining date`}
                      >
                        +{yrs}Y
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  value={formData.validThru}
                  onChange={(e) => handleInputChange('validThru', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: CONTACT & EMERGENCY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">4. Contact & Emergency Details</h3>
                <p className="text-[11px] text-slate-400">Personal contact numbers, emergency guardian contact, and residential address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Personal Phone / Mobile</label>
                <input
                  type="tel"
                  placeholder="e.g. +880 1711-234567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@organization.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            {/* Emergency sub-box */}
            <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="font-semibold text-red-400 text-[11px] uppercase tracking-wider">
                Emergency Contact Person
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mary Morgan"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse / Parent / Brother"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +880 1819-998877"
                    value={formData.emergencyPhone}
                    onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Residential Address / স্থায়ী ঠিকানা
              </label>
              <textarea
                rows={2}
                placeholder="e.g. House #12, Road #4, Dhanmondi, Dhaka-1205"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 resize-none"
              />
            </div>
          </div>

          {/* SECTION 5: SECURITY, CHIP & INTERNAL REMARKS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">5. Security, Card Chip & Internal Notes</h3>
                <p className="text-[11px] text-slate-400">RFID serial, barcode data override, credential status, and notes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  RFID / Smart Chip UID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 04:A3:2B:9C:1D:6E"
                  value={formData.rfid}
                  onChange={(e) => handleInputChange('rfid', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Barcode / QR Payload Override
                </label>
                <input
                  type="text"
                  placeholder="Defaults to ID Number if blank"
                  value={formData.barcodePayload}
                  onChange={(e) => handleInputChange('barcodePayload', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Credential Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="active">Active Credential</option>
                  <option value="inactive">Inactive / Revoked</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Print Status</label>
                <select
                  value={formData.printStatus}
                  onChange={(e) => handleInputChange('printStatus', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="pending">Pending Print</option>
                  <option value="printed">Already Printed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Internal Remarks & Medical / Access Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Authorized for Gate 2 entry; Verified background check."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons Bottom */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSaveAndNew}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Save & Add Another</span>
            </button>

            <button
              onClick={handleSaveAndPrint}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Save & Print Card</span>
            </button>

            <button
              onClick={handleSaveAndView}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & View Roster'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live Card Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Live CR80 Card Preview</h3>
                <p className="text-[11px] text-slate-400">
                  Template: <span className="text-indigo-400 font-medium">{activeTemplate.name}</span>
                </p>
              </div>

              {/* Front / Back Toggle */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewSide('front')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    previewSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSide('back')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    previewSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Interactive Card Canvas Preview (Rendered Mini Card adapting to Landscape / Portrait) */}
            <div
              className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-white flex flex-col justify-between text-slate-900 select-none mx-auto transition-all duration-300 ${
                isLandscape ? 'aspect-[85.6/53.98] w-full' : 'aspect-[53.98/85.6] w-72'
              }`}
            >
              {previewSide === 'front' ? (
                <div className="h-full flex flex-col justify-between p-4 relative">
                  {/* Header bar */}
                  <div className="bg-slate-900 text-white -m-4 p-3 mb-2 flex items-center justify-between">
                    <span className="font-bold tracking-wider text-xs uppercase truncate max-w-[200px]">
                      {activeTemplate.name}
                    </span>
                    <span className="text-[9px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded">
                      300 DPI
                    </span>
                  </div>

                  {isLandscape ? (
                    // Landscape layout
                    <div className="flex gap-4 items-center flex-1 my-2">
                      <div className="w-24 h-28 bg-slate-100 rounded-lg border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                        {formData.photoUrl ? (
                          <img
                            src={formData.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-slate-400" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {formData.fullName || 'FULL NAME HERE'}
                        </p>
                        {formData.nameBangla && (
                          <p
                            className="font-bold text-xs text-indigo-700 truncate"
                            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                          >
                            {formData.nameBangla}
                          </p>
                        )}
                        <p className="font-mono text-xs font-semibold text-blue-600">
                          ID: {formData.idNumber || 'ID-000000'}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate">
                          Dept: {formData.department || activeTemplate.department || 'General'}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate">
                          Role: {formData.designation || 'Member'}
                        </p>
                        {formData.bloodGroup && (
                          <p className="text-[10px] font-semibold text-red-600">
                            Blood: {formData.bloodGroup}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Portrait layout
                    <div className="flex flex-col items-center flex-1 justify-center space-y-2 py-2">
                      <div className="w-24 h-28 bg-slate-100 rounded-lg border-2 border-emerald-500 overflow-hidden shrink-0 flex items-center justify-center">
                        {formData.photoUrl ? (
                          <img
                            src={formData.photoUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-slate-400" />
                        )}
                      </div>

                      <div className="text-center space-y-0.5 w-full px-2">
                        {formData.nameBangla && (
                          <p
                            className="font-bold text-xs text-emerald-800 truncate"
                            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                          >
                            {formData.nameBangla}
                          </p>
                        )}
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {formData.fullName || 'FULL NAME HERE'}
                        </p>
                        <p className="font-mono text-[11px] font-semibold text-emerald-600">
                          {formData.idNumber || 'ID-000000'}
                        </p>
                        <p className="text-[10px] text-slate-600 truncate">
                          {formData.department || 'Academic Department'}
                        </p>
                        <p className="text-[10px] font-semibold text-red-600">
                          Blood: {formData.bloodGroup || 'O+'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Footer bar */}
                  <div className="bg-slate-900 text-slate-400 -m-4 p-1.5 mt-2 text-center text-[9px] font-medium tracking-wider">
                    AUTHORIZED CREDENTIAL • {activeTemplate.department || 'OFFICIAL ID'}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between p-4 text-xs">
                  <div>
                    <p
                      className="font-bold text-slate-800 text-center uppercase tracking-wide pb-1 border-b border-slate-200"
                      style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                    >
                      TERMS & CONDITIONS • ব্যবহারের নিয়মাবলী
                    </p>
                    <p
                      className="text-[10px] text-slate-600 mt-2 leading-relaxed"
                      style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                    >
                      ১. এই পরিচয়পত্র প্রতিষ্ঠানের নিজস্ব সম্পদ এবং হস্তান্তরযোগ্য নয়।
                      <br />
                      ২. জরুরি যোগাযোগ: {formData.emergencyPhone || formData.phone || '+880 1711-000000'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="font-mono text-center text-xs tracking-widest bg-slate-100 px-3 py-1 rounded border border-slate-300">
                      * {formData.idNumber || 'EMP-000000'} *
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">CODE128 BARCODE</span>
                  </div>

                  <div className="flex justify-between items-end text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                    <span>EXP: {formData.validThru || '2028-12-31'}</span>
                    <span className="italic">Authorized Signatory</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Live Single-Page Feedback</p>
              <p>
                All sections are active on this page. Typing into any field immediately updates the preview card.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Photo Cropping Modal */}
      {isCropOpen && cropImageSrc && (
        <PhotoCropModal
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          imageSrc={cropImageSrc}
          record={{ fullName: formData.fullName || 'Member', id: editId || 'new' }}
          orgId={currentUser?.uid}
          onPhotoSaved={handlePhotoSaved}
        />
      )}

      {/* Print Modal */}
      {isPrintOpen && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          records={[previewRecord]}
          template={activeTemplate}
          templates={templates}
          onMarkPrinted={() => setFormData((prev) => ({ ...prev, printStatus: 'printed' }))}
        />
      )}
    </div>
  );
}
