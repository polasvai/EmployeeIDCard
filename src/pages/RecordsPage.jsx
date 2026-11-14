import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import RecordTable from '../components/records/RecordTable';
import BulkImportModal from '../components/records/BulkImportModal';
import PhotoCropModal from '../components/records/PhotoCropModal';
import PrintPreviewModal from '../components/print/PrintPreviewModal';
import { DEFAULT_TEMPLATE, DEFAULT_TEMPLATES } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Upload,
  Printer,
  UserPlus,
  Images,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageProcessor';

const LOCAL_STORAGE_KEY_RECORDS = 'id_studio_records';

const SAMPLE_RECORDS = [
  {
    id: 'rec-001',
    templateId: 'tpl-corporate',
    fullName: 'Alexander R. Morgan',
    nameBangla: 'আলেকজান্ডার আর. মরগান',
    idNumber: 'EMP-892041',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=360&fit=crop&crop=face',
    customFields: {
      nameBangla: 'আলেকজান্ডার আর. মরগান',
      department: 'Software Engineering',
      designation: 'Senior Solutions Architect',
      roleType: 'Employee',
      gender: 'Male',
      dateOfBirth: '1992-04-15',
      bloodGroup: 'O+',
      nationality: 'Bangladeshi',
      nationalId: 'NID-94820194',
      campus: 'Silicon Valley Campus',
      joiningDate: '2021-03-01',
      validThru: '2028-12-31',
      reportingManager: 'V. Patel',
      phone: '+880 1711-234567',
      email: 'alexander.morgan@company.com',
      emergencyContactName: 'Mary Morgan',
      emergencyContactRelation: 'Spouse',
      emergencyPhone: '+880 1819-998811',
      address: 'House #12, Road #4, Dhanmondi, Dhaka',
      rfid: '04:A3:2B:9C:1D:6E',
      status: 'active',
    },
    printStatus: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec-002',
    templateId: 'tpl-healthcare',
    fullName: 'Dr. Sarah Lin Chen',
    nameBangla: 'ডাঃ সারাহ লিন চেন',
    idNumber: 'MED-774120',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=360&fit=crop&crop=face',
    customFields: {
      nameBangla: 'ডাঃ সারাহ লিন চেন',
      department: 'Biotechnology Research',
      designation: 'Lead Medical Investigator',
      roleType: 'Faculty',
      gender: 'Female',
      dateOfBirth: '1988-11-23',
      bloodGroup: 'A+',
      nationality: 'Bangladeshi',
      nationalId: 'NID-88129031',
      campus: 'Central Specialized Hospital',
      joiningDate: '2019-08-15',
      validThru: '2028-12-31',
      reportingManager: 'Dr. E. Thorne',
      phone: '+880 1712-345678',
      email: 's.chen@bioresearch.org',
      emergencyContactName: 'David Chen',
      emergencyContactRelation: 'Brother',
      emergencyPhone: '+880 1811-887334',
      address: 'Plot 4, Mirpur Road, Dhaka',
      rfid: '04:F1:C8:3A:4E:22',
      status: 'active',
    },
    printStatus: 'printed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec-003',
    templateId: 'tpl-academic',
    fullName: 'Mohammad Tanvir Hasan',
    nameBangla: 'মোহাম্মদ তানভীর হাসান',
    idNumber: 'STU-2026-0891',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=360&fit=crop&crop=face',
    customFields: {
      nameBangla: 'মোহাম্মদ তানভীর হাসান',
      department: 'Computer Science & Engineering',
      designation: 'Undergraduate Student (Roll: 891)',
      roleType: 'Student',
      gender: 'Male',
      dateOfBirth: '2004-02-14',
      bloodGroup: 'B+',
      nationality: 'Bangladeshi',
      nationalId: 'NID-77291044',
      campus: 'Academic Hall B',
      joiningDate: '2024-01-10',
      validThru: '2028-12-31',
      reportingManager: 'Prof. S. Rahman',
      phone: '+880 1913-456789',
      email: 'tanvir.hasan@modelcollege.edu.bd',
      fatherName: 'Md. Delwar Hossain',
      motherName: 'Tahmina Begum',
      emergencyContactName: 'Md. Delwar Hossain',
      emergencyContactRelation: 'Father',
      emergencyPhone: '+880 1715-776556',
      address: '22 Chawkbazar, Chittagong',
      rfid: '04:77:2D:BE:01:99',
      status: 'active',
    },
    printStatus: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec-004',
    templateId: 'tpl-corporate',
    fullName: 'Elena Rostova',
    nameBangla: 'এলেনা রোস্তোভা',
    idNumber: 'EMP-990412',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=360&fit=crop&crop=face',
    customFields: {
      nameBangla: 'এলেনা রোস্তোভা',
      department: 'Financial Advisory',
      designation: 'Chief Risk Officer',
      roleType: 'Employee',
      gender: 'Female',
      dateOfBirth: '1990-09-30',
      bloodGroup: 'AB+',
      nationality: 'Swedish',
      nationalId: 'SE-991204',
      campus: 'Finance Tower Suite 800',
      joiningDate: '2022-05-15',
      validThru: '2028-12-31',
      reportingManager: 'C. Henderson',
      phone: '+1 (555) 567-8901',
      email: 'e.rostova@advisory.com',
      emergencyContactName: 'Viktor Rostov',
      emergencyContactRelation: 'Father',
      emergencyPhone: '+1 (555) 665-7788',
      address: '88 Wall Street, New York, NY',
      rfid: '04:BB:33:AA:88:12',
      status: 'active',
    },
    printStatus: 'pending',
    createdAt: new Date().toISOString(),
  },
];

export default function RecordsPage() {
  const { currentUser, organization } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATE);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeCropRecord, setActiveCropRecord] = useState(null);
  const [printTargetIds, setPrintTargetIds] = useState([]);
  const [toast, setToast] = useState(null);

  // Single Add Form state
  const [newRecordForm, setNewRecordForm] = useState({
    fullName: '',
    idNumber: '',
    department: '',
    designation: '',
    bloodGroup: '',
    photoUrl: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load records and template
  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);

      // Load saved templates
      const savedTemplates = localStorage.getItem('id_studio_templates');
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplates(parsed);
          }
        } catch (e) {}
      }

      // Load saved template if available
      const savedTemplate = localStorage.getItem('id_studio_active_template');
      if (savedTemplate) {
        try {
          setActiveTemplate(JSON.parse(savedTemplate));
        } catch (e) {}
      }

      if (isFirebaseConfigured && db && currentUser?.uid) {
        try {
          const recCol = collection(db, 'organizations', currentUser.uid, 'records');
          const snap = await getDocs(recCol);
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setRecords(list);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Firestore fetch failed, checking local state:', e);
        }
      }

      // Local storage fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
      if (saved) {
        try {
          setRecords(JSON.parse(saved));
        } catch (e) {
          setRecords(SAMPLE_RECORDS);
          localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(SAMPLE_RECORDS));
        }
      } else {
        setRecords(SAMPLE_RECORDS);
        localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(SAMPLE_RECORDS));
      }
      setLoading(false);
    }

    fetchRecords();
  }, [currentUser]);

  const saveRecordsState = (newRecords) => {
    setRecords(newRecords);
    localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select, ids) => {
    if (select) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])));
    } else {
      setSelectedIds(selectedIds.filter((id) => !ids.includes(id)));
    }
  };

  const handleDeleteRecords = async (idsToDelete) => {
    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} record(s)?`)) return;

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const batch = writeBatch(db);
        idsToDelete.forEach((id) => {
          const docRef = doc(db, 'organizations', currentUser.uid, 'records', id);
          batch.delete(docRef);
        });
        await batch.commit();
      } catch (err) {
        console.error('Delete error from Firestore:', err);
      }
    }

    const updated = records.filter((r) => !idsToDelete.includes(r.id));
    saveRecordsState(updated);
    setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    showToast(`Deleted ${idsToDelete.length} record(s).`);
  };

  const handleOpenCrop = (record) => {
    setActiveCropRecord(record);
    setIsCropOpen(true);
  };

  const handlePhotoSaved = async (photoUrl) => {
    if (!activeCropRecord) return;

    const updated = records.map((r) =>
      r.id === activeCropRecord.id ? { ...r, photoUrl } : r
    );
    saveRecordsState(updated);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const docRef = doc(db, 'organizations', currentUser.uid, 'records', activeCropRecord.id);
        await setDoc(docRef, { photoUrl }, { merge: true });
      } catch (e) {
        console.error('Error updating record photo in firestore:', e);
      }
    }

    showToast('Portrait photo updated successfully.');
  };

  const handleImportComplete = (importedList) => {
    const updated = [...importedList, ...records];
    saveRecordsState(updated);
    showToast(`Successfully imported ${importedList.length} records!`);
  };

  const handleOpenPrint = (ids) => {
    setPrintTargetIds(ids);
    setIsPrintOpen(true);
  };

  const handleMarkPrinted = async (printedIds) => {
    const updated = records.map((r) =>
      printedIds.includes(r.id) ? { ...r, printStatus: 'printed' } : r
    );
    saveRecordsState(updated);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const batch = writeBatch(db);
        printedIds.forEach((id) => {
          const docRef = doc(db, 'organizations', currentUser.uid, 'records', id);
          batch.update(docRef, { printStatus: 'printed' });
        });
        await batch.commit();
      } catch (e) {
        console.warn('Error marking printed in firestore:', e);
      }
    }
  };

  const handleAddSingleRecord = async (e) => {
    e.preventDefault();
    if (!newRecordForm.fullName || !newRecordForm.idNumber) {
      showToast('Name and ID Number are required.', 'error');
      return;
    }

    const newRecord = {
      id: `rec-${Date.now()}`,
      templateId: 'default',
      fullName: newRecordForm.fullName,
      idNumber: newRecordForm.idNumber,
      photoUrl: newRecordForm.photoUrl || null,
      customFields: {
        department: newRecordForm.department,
        designation: newRecordForm.designation,
        bloodGroup: newRecordForm.bloodGroup,
      },
      printStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const docRef = doc(db, 'organizations', currentUser.uid, 'records', newRecord.id);
        await setDoc(docRef, {
          ...newRecord,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to write single record to firestore:', e);
      }
    }

    const updated = [newRecord, ...records];
    saveRecordsState(updated);
    setIsAddOpen(false);
    setNewRecordForm({
      fullName: '',
      idNumber: '',
      department: '',
      designation: '',
      bloodGroup: '',
      photoUrl: '',
    });
    showToast(`Added ${newRecord.fullName} to roster.`);
  };

  // Bulk Photo Match Multi-File handler
  const handleBulkPhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    let matchedCount = 0;
    const updated = [...records];

    for (const file of files) {
      // Filename minus extension e.g. "EMP-892041.jpg" -> "EMP-892041"
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const targetRecordIndex = updated.findIndex(
        (r) => r.idNumber.toLowerCase() === nameWithoutExt.toLowerCase()
      );

      if (targetRecordIndex !== -1) {
        try {
          const { dataUrl } = await compressImageFile(file, 300, 360, 0.85);
          updated[targetRecordIndex] = {
            ...updated[targetRecordIndex],
            photoUrl: dataUrl,
          };
          matchedCount++;
        } catch (err) {
          console.warn('Failed compressing matched photo:', file.name, err);
        }
      }
    }

    if (matchedCount > 0) {
      saveRecordsState(updated);
      showToast(`Matched and compressed ${matchedCount} photos by ID number!`);
    } else {
      showToast('No photos matched existing ID numbers in the roster.', 'error');
    }
  };

  const recordsToPrint = records.filter((r) => printTargetIds.includes(r.id));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Member Roster & ID Records</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage students, employees, portrait photos, and trigger CR80 / A4 print batches
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {/* New Member Data Entry Button */}
          <button
            onClick={() => navigate('/entry')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Member (Data Entry)</span>
          </button>

          {/* Multi-Photo ZIP / Batch file match */}
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium cursor-pointer transition-colors">
            <Images className="w-4 h-4 text-emerald-400" />
            <span>Match Photos by ID</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleBulkPhotoUpload}
              className="hidden"
            />
          </label>

          {/* Bulk Import Button */}
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Import CSV / Excel</span>
          </button>

          {/* Print All Button */}
          <button
            onClick={() => handleOpenPrint(records.map((r) => r.id))}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print All ({records.length})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <RecordTable
        records={records}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onDeleteRecords={handleDeleteRecords}
        onOpenCropModal={handleOpenCrop}
        onOpenAddModal={() => navigate('/entry')}
        onEditRecord={(record) => navigate(`/entry?id=${record.id}`)}
        onOpenPrintModal={handleOpenPrint}
      />

      {/* CSV / Excel Bulk Import Modal */}
      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        orgId={currentUser?.uid}
        templateId="default"
        onImportComplete={handleImportComplete}
      />

      {/* Photo Crop Modal */}
      {isCropOpen && activeCropRecord && (
        <PhotoCropModal
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          imageSrc={
            activeCropRecord.photoUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=600&fit=crop'
          }
          record={activeCropRecord}
          orgId={currentUser?.uid}
          onPhotoSaved={handlePhotoSaved}
        />
      )}

      {/* Print & PDF Imposition Modal */}
      {isPrintOpen && (
        <PrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          records={recordsToPrint}
          template={activeTemplate}
          templates={templates}
          onMarkPrinted={handleMarkPrinted}
        />
      )}

      {/* Add Single Record Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add Member Record</span>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingleRecord} className="p-5 space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={newRecordForm.fullName}
                  onChange={(e) =>
                    setNewRecordForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  ID / Badge Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-1092"
                  value={newRecordForm.idNumber}
                  onChange={(e) =>
                    setNewRecordForm((prev) => ({ ...prev, idNumber: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={newRecordForm.department}
                    onChange={(e) =>
                      setNewRecordForm((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. O+"
                    value={newRecordForm.bloodGroup}
                    onChange={(e) =>
                      setNewRecordForm((prev) => ({ ...prev, bloodGroup: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newRecordForm.photoUrl}
                  onChange={(e) =>
                    setNewRecordForm((prev) => ({ ...prev, photoUrl: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
