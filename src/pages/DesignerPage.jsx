import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CardCanvas from '../components/designer/CardCanvas';
import ElementToolbar from '../components/designer/ElementToolbar';
import LayerPanel from '../components/designer/LayerPanel';
import PropertyInspector from '../components/designer/PropertyInspector';
import { DEFAULT_TEMPLATES, DEFAULT_TEMPLATE } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Save,
  RotateCcw,
  Eye,
  Shield,
  CheckCircle,
  AlertCircle,
  Plus,
  Copy,
  Trash2,
  Layers,
  Building,
  X,
  Lock,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_TEMPLATES = 'id_studio_templates';
const LOCAL_STORAGE_KEY_ACTIVE_ID = 'id_studio_active_template_id';

export default function DesignerPage() {
  const { currentUser, organization, isSuperAdmin } = useAuth();
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [currentSide, setCurrentSide] = useState('front'); // 'front' | 'back'
  const [selectedId, setSelectedId] = useState(null);
  const [showSafeGuides, setShowSafeGuides] = useState(true);
  const [showBleedGuides, setShowBleedGuides] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Template Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    department: '',
    orientation: 'landscape',
    cloneFromId: 'tpl-corporate',
  });

  // Load templates from Firestore or localStorage
  useEffect(() => {
    async function loadTemplates() {
      if (isFirebaseConfigured && db && currentUser?.uid) {
        try {
          const tCol = collection(db, 'organizations', currentUser.uid, 'templates');
          const snap = await getDocs(tCol);
          if (!snap.empty) {
            const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setTemplates(list);
            setActiveTemplateId(list[0].id);
            return;
          }
        } catch (e) {
          console.warn('Failed loading templates from firestore:', e);
        }
      }

      // Local storage fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TEMPLATES);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTemplates(parsed);
            const savedActiveId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
            if (savedActiveId && parsed.some((t) => t.id === savedActiveId)) {
              setActiveTemplateId(savedActiveId);
            } else {
              setActiveTemplateId(parsed[0].id);
            }
            return;
          }
        } catch (e) {}
      }

      // Default preset templates
      setTemplates(DEFAULT_TEMPLATES);
      setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
      localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }

    loadTemplates();
  }, [currentUser]);

  const activeTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0] || DEFAULT_TEMPLATE;

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveTemplatesState = (updatedList, targetId = activeTemplateId) => {
    setTemplates(updatedList);
    setActiveTemplateId(targetId);
    localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATES, JSON.stringify(updatedList));
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, targetId);
    // Also save active template for legacy compatibility
    const active = updatedList.find((t) => t.id === targetId) || updatedList[0];
    localStorage.setItem('id_studio_active_template', JSON.stringify(active));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isFirebaseConfigured && db && currentUser?.uid) {
        const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', activeTemplate.id);
        await setDoc(tDoc, {
          ...activeTemplate,
          updatedAt: serverTimestamp(),
        });
      }

      saveTemplatesState(templates, activeTemplate.id);
      showToast(`Template "${activeTemplate.name}" saved!`);
    } catch (err) {
      console.error('Error saving template:', err);
      showToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchTemplate = (id) => {
    setActiveTemplateId(id);
    setSelectedId(null);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, id);
    const target = templates.find((t) => t.id === id);
    if (target) {
      localStorage.setItem('id_studio_active_template', JSON.stringify(target));
    }
  };

  const handleCreateNewTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateForm.name.trim()) {
      showToast('Template name is required', 'error');
      return;
    }

    const baseTemplate =
      templates.find((t) => t.id === newTemplateForm.cloneFromId) || DEFAULT_TEMPLATE;

    const newId = `tpl-${Date.now()}`;
    const newTemplate = {
      ...baseTemplate,
      id: newId,
      name: newTemplateForm.name.trim(),
      department: newTemplateForm.department.trim() || 'General',
      orientation: newTemplateForm.orientation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...templates, newTemplate];
    saveTemplatesState(updated, newId);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', newId);
        await setDoc(tDoc, {
          ...newTemplate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore template write failed:', err);
      }
    }

    setIsNewModalOpen(false);
    setNewTemplateForm({
      name: '',
      department: '',
      orientation: 'landscape',
      cloneFromId: 'tpl-corporate',
    });
    showToast(`Created new template "${newTemplate.name}"!`);
  };

  const handleDuplicateTemplate = async () => {
    const dupId = `tpl-${Date.now()}`;
    const duplicated = {
      ...activeTemplate,
      id: dupId,
      name: `${activeTemplate.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...templates, duplicated];
    saveTemplatesState(updated, dupId);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', dupId);
        await setDoc(tDoc, {
          ...duplicated,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore duplicate write failed:', err);
      }
    }

    showToast(`Duplicated as "${duplicated.name}"!`);
  };

  const handleDeleteTemplate = async () => {
    if (templates.length <= 1) {
      showToast('Cannot delete the only template.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete template "${activeTemplate.name}"?`)) {
      return;
    }

    const remaining = templates.filter((t) => t.id !== activeTemplate.id);
    const nextId = remaining[0].id;
    saveTemplatesState(remaining, nextId);

    if (isFirebaseConfigured && db && currentUser?.uid) {
      try {
        const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', activeTemplate.id);
        await deleteDoc(tDoc);
      } catch (err) {
        console.warn('Firestore template delete failed:', err);
      }
    }

    showToast('Template deleted.');
  };

  const handleResetToPresets = () => {
    if (window.confirm('Reset all templates to default standard templates (Corporate, Academic, Medical)?')) {
      saveTemplatesState(DEFAULT_TEMPLATES, DEFAULT_TEMPLATES[0].id);
      setSelectedId(null);
      showToast('Reset to default preset templates.');
    }
  };

  const handleOrientationToggle = () => {
    const newOrientation = activeTemplate.orientation === 'portrait' ? 'landscape' : 'portrait';
    const updated = templates.map((t) =>
      t.id === activeTemplate.id ? { ...t, orientation: newOrientation } : t
    );
    saveTemplatesState(updated, activeTemplate.id);
    setSelectedId(null);
  };

  const activeElements =
    (currentSide === 'front' ? activeTemplate.frontElements : activeTemplate.backElements) || [];

  const handleAddElement = (newElem) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    const updated = templates.map((t) => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          [key]: [...(t[key] || []), newElem],
        };
      }
      return t;
    });
    saveTemplatesState(updated, activeTemplate.id);
    setSelectedId(newElem.id);
  };

  const handleUpdateElement = (updatedElem) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    const updated = templates.map((t) => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          [key]: (t[key] || []).map((el) => (el.id === updatedElem.id ? updatedElem : el)),
        };
      }
      return t;
    });
    saveTemplatesState(updated, activeTemplate.id);
  };

  const handleUpdateElements = (newElements) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    const updated = templates.map((t) => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          [key]: newElements,
        };
      }
      return t;
    });
    saveTemplatesState(updated, activeTemplate.id);
  };

  const handleDeleteElement = (id) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    const updated = templates.map((t) => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          [key]: (t[key] || []).filter((el) => el.id !== id),
        };
      }
      return t;
    });
    saveTemplatesState(updated, activeTemplate.id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateBackground = (bg) => {
    const key = currentSide === 'front' ? 'frontBackground' : 'backBackground';
    const updated = templates.map((t) => {
      if (t.id === activeTemplate.id) {
        return {
          ...t,
          [key]: bg,
        };
      }
      return t;
    });
    saveTemplatesState(updated, activeTemplate.id);
  };

  const selectedElement = activeElements.find((el) => el.id === selectedId) || null;
  const currentBackground =
    currentSide === 'front' ? activeTemplate.frontBackground : activeTemplate.backBackground;

  if (!isSuperAdmin && organization?.designerEnabled === false) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Card Designer Locked</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Card Designer access has been disabled for <strong className="text-slate-200">{organization?.name || 'your organization'}</strong> by the Super Administrator.
          </p>
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 text-left space-y-1.5">
            <p className="font-semibold text-slate-300">Authorized actions available:</p>
            <p className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Enter and manage cardholder data in Data Entry</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Import rosters via CSV and crop portraits</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Preview sheets & submit jobs to the Print Queue</span>
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              to="/entry"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/20"
            >
              Go to Data Entry
            </Link>
            <Link
              to="/records"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              View Records & Print Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-100 animate-in fade-in slide-in-from-top-2">
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Designer Sub-Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Template Switcher Dropdown & Management */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-indigo-400 ml-2" />
            <select
              value={activeTemplate.id}
              onChange={(e) => handleSwitchTemplate(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold text-xs focus:outline-none pr-3 cursor-pointer"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id} className="bg-slate-800 text-slate-200">
                  {tpl.name} ({tpl.department || 'All'} - {tpl.orientation})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            title="Create New Template for a Department"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>

          <button
            onClick={handleDuplicateTemplate}
            title="Duplicate Current Template"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {templates.length > 1 && (
            <button
              onClick={handleDeleteTemplate}
              title="Delete Current Template"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Department Tag input for active template */}
          <div className="flex items-center gap-1.5 text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
            <Building className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              placeholder="Assigned Dept..."
              value={activeTemplate.department || ''}
              onChange={(e) => {
                const val = e.target.value;
                const updated = templates.map((t) =>
                  t.id === activeTemplate.id ? { ...t, department: val } : t
                );
                saveTemplatesState(updated, activeTemplate.id);
              }}
              className="bg-transparent border-none text-slate-200 text-[11px] focus:outline-none w-28"
            />
          </div>

          <button
            onClick={handleOrientationToggle}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            title="Switch Landscape / Portrait"
          >
            {activeTemplate.orientation === 'portrait' ? 'Portrait (CR80)' : 'Landscape (CR80)'}
          </button>
        </div>

        {/* Front / Back Side Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setCurrentSide('front');
              setSelectedId(null);
            }}
            className={`px-4 py-1 rounded-lg font-medium transition-colors ${
              currentSide === 'front'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Front Side
          </button>
          <button
            onClick={() => {
              setCurrentSide('back');
              setSelectedId(null);
            }}
            className={`px-4 py-1 rounded-lg font-medium transition-colors ${
              currentSide === 'back'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Back Side
          </button>
        </div>

        {/* Guides Toggles & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSafeGuides((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
              showSafeGuides
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'text-slate-500 border-slate-800'
            }`}
            title="Toggle 2mm Safe Margin Guide"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px]">Safe Zone</span>
          </button>

          <button
            onClick={() => setShowBleedGuides((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
              showBleedGuides
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'text-slate-500 border-slate-800'
            }`}
            title="Toggle 1.5mm Bleed Margin Guide"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[10px]">Bleed</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={handleResetToPresets}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Reset All Templates to Presets"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <ElementToolbar
        onAddElement={handleAddElement}
        orientation={activeTemplate.orientation}
      />

      {/* Main Designer Canvas & Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Layer Panel (Left) */}
        <LayerPanel
          elements={activeElements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateElements={handleUpdateElements}
          onDeleteElement={handleDeleteElement}
        />

        {/* Konva 300 DPI Canvas (Center) */}
        <CardCanvas
          template={activeTemplate}
          currentSide={currentSide}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          onUpdateElement={handleUpdateElement}
          showSafeGuides={showSafeGuides}
          showBleedGuides={showBleedGuides}
        />

        {/* Property Inspector (Right) */}
        <PropertyInspector
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          background={currentBackground}
          onUpdateBackground={handleUpdateBackground}
        />
      </div>

      {/* New Template Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Create Department Card Template</span>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="p-5 space-y-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Template Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Faculty Staff ID"
                  value={newTemplateForm.name}
                  onChange={(e) =>
                    setNewTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Department / Target Group
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science & Technology"
                  value={newTemplateForm.department}
                  onChange={(e) =>
                    setNewTemplateForm((prev) => ({ ...prev, department: e.target.value }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Orientation</label>
                  <select
                    value={newTemplateForm.orientation}
                    onChange={(e) =>
                      setNewTemplateForm((prev) => ({ ...prev, orientation: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="landscape">Landscape (85.6 × 53.98mm)</option>
                    <option value="portrait">Portrait (53.98 × 85.6mm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Layout</label>
                  <select
                    value={newTemplateForm.cloneFromId}
                    onChange={(e) =>
                      setNewTemplateForm((prev) => ({ ...prev, cloneFromId: e.target.value }))
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
