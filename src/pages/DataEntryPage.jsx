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
} from 'lucide-react';
import PhotoCropModal from '../components/records/PhotoCropModal';
import PrintPreviewModal from '../components/print/PrintPreviewModal';
import { DEFAULT_TEMPLATE } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { compressImageFile } from '../utils/imageProcessor';

const INITIAL_FORM = {
  fullName: '',
  idNumber: '',
  photoUrl: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  nationality: '',
  nationalId: '',
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
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'org' | 'contact' | 'security'
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

  // Load existing record if in edit mode, and active template
  useEffect(() => {
    // 1. Load active template
    const savedTemplate = localStorage.getItem('id_studio_active_template');
    if (savedTemplate) {
      try {
        setActiveTemplate(JSON.parse(savedTemplate));
      } catch (e) {}
    }

    // 2. If editing existing record:
    if (editId) {
      const loadRecord = async () => {
        if (isFirebaseConfigured && db && currentUser?.uid) {
          try {
            const docRef = doc(db, 'organizations', currentUser.uid, 'records', editId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              setFormData({
                ...INITIAL_FORM,
                ...data,
                ...(data.customFields || {}),
              });
              return;
            }
          } catch (e) {
            console.warn('Failed to load record from firestore:', e);
          }
        }

        // Check local storage records
        const stored = localStorage.getItem('id_studio_records');
        if (stored) {
          try {
            const list = JSON.parse(stored);
            const found = list.find((r) => r.id === editId);
            if (found) {
              setFormData({
                ...INITIAL_FORM,
                ...found,
                ...(found.customFields || {}),
              });
            }
          } catch (e) {}
        }
      };
      loadRecord();
    }
  }, [editId, currentUser]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      templateId: 'default',
      fullName: formData.fullName.trim(),
      idNumber: formData.idNumber.trim(),
      photoUrl: formData.photoUrl || null,
      printStatus: formData.printStatus || 'pending',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customFields: {
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        nationality: formData.nationality,
        nationalId: formData.nationalId,
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
      setFormData(INITIAL_FORM);
      setActiveTab('identity');
      if (editId) navigate('/entry', { replace: true });
    }
  };

  const handleSaveAndPrint = async () => {
    const saved = await saveRecord();
    if (saved) {
      setIsPrintOpen(true);
    }
  };

  // Build live preview record object for the card renderer
  const previewRecord = {
    fullName: formData.fullName || 'FULL NAME HERE',
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
              {editId ? 'Edit ID Card Record' : 'Member Data Entry'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter complete identity, organizational, contact, and security details with live card preview
            </p>
          </div>
        </div>

        {/* Action Buttons */}
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
      </div>

      {/* Main Grid: Form (Left) & Live Card Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 text-xs gap-1">
            <button
              onClick={() => setActiveTab('identity')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'identity'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Identity & Bio</span>
            </button>

            <button
              onClick={() => setActiveTab('org')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'org'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Organization</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'contact'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Contact & Emergency</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Extra</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5 text-xs text-slate-200">
            {/* TAB 1: IDENTITY & BIO */}
            {activeTab === 'identity' && (
              <div className="space-y-4">
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
                      Standard 300×300px portrait compressed under 40 KB for free-tier storage.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
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
                          <span>Adjust Crop</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alexander R. Morgan"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      ID / Badge / Roll Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-892041"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Blood Group</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Nationality</label>
                    <input
                      type="text"
                      placeholder="e.g. American, Canadian, British"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      National ID / Passport / SSN
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NID-492019482"
                      value={formData.nationalId}
                      onChange={(e) => handleInputChange('nationalId', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORGANIZATION / ACADEMIC */}
            {activeTab === 'org' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Department / Faculty / Stream
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineering"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Designation / Role / Grade
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Solutions Architect"
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
                    <label className="block text-slate-300 font-medium mb-1">Campus / Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. Main HQ / North Campus"
                      value={formData.campus}
                      onChange={(e) => handleInputChange('campus', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Reporting Manager</label>
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
                    <label className="block text-slate-300 font-medium mb-1">
                      Card Expiry / Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.validThru}
                      onChange={(e) => handleInputChange('validThru', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTACT & EMERGENCY */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Phone / Mobile</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 234-5678"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. alexander@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="font-semibold text-red-400 text-[11px] uppercase tracking-wider">
                    Emergency Contact Details
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
                        placeholder="e.g. Spouse / Parent"
                        value={formData.emergencyContactRelation}
                        onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 999-0011"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Residential Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & EXTRA */}
            {activeTab === 'security' && (
              <div className="space-y-4">
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
                      Barcode / QR Code Payload Override
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
                    <label className="block text-slate-300 font-medium mb-1">Card Status</label>
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
                    Internal Notes & Medical / Security Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Severe peanut allergy; Authorized for Lab 4 access"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Card Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-100 text-sm">Live CR80 Card Preview</h3>
            {/* Front / Back Toggle */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setPreviewSide('front')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  previewSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => setPreviewSide('back')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  previewSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Back Side
              </button>
            </div>
          </div>

          {/* Interactive Card Canvas Preview (Rendered Mini Card) */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-white aspect-[85.6/53.98] flex flex-col justify-between text-slate-900 select-none">
            {previewSide === 'front' ? (
              <div className="h-full flex flex-col justify-between p-4 relative">
                {/* Header bar */}
                <div className="bg-blue-900 text-white -m-4 p-3 mb-2 flex items-center justify-between">
                  <span className="font-bold tracking-wider text-xs uppercase">
                    ACME GLOBAL ORGANIZATION
                  </span>
                  <span className="text-[9px] bg-amber-500 text-slate-900 font-bold px-1.5 py-0.5 rounded">
                    CR80
                  </span>
                </div>

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

                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {formData.fullName || 'FULL NAME'}
                    </p>
                    <p className="font-mono text-xs font-semibold text-blue-600">
                      ID: {formData.idNumber || 'EMP-000000'}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      Dept: {formData.department || 'General'}
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

                {/* Footer bar */}
                <div className="bg-slate-900 text-slate-400 -m-4 p-1.5 mt-2 text-center text-[9px] font-medium tracking-wider">
                  AUTHORIZED CREDENTIAL • 300 DPI STANDARD
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between p-4 text-xs">
                <div>
                  <p className="font-bold text-slate-800 text-center uppercase tracking-wide pb-1 border-b border-slate-200">
                    TERMS & CONDITIONS
                  </p>
                  <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
                    This card is issued by the organization and remains official property. If found, please return to HQ Security or call {formData.phone || '+1 (800) 555-0199'}.
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
            <p className="font-semibold text-slate-300">Live Feedback Tip</p>
            <p>
              Changes made in any tab immediately update the card layout. Once satisfied, click <strong>Save & Print Card</strong> to generate the 300 DPI PDF immediately.
            </p>
          </div>
        </div>
      </div>

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
          onMarkPrinted={() => setFormData((prev) => ({ ...prev, printStatus: 'printed' }))}
        />
      )}
    </div>
  );
}
