import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CardCanvas from '../components/designer/CardCanvas';
import ElementToolbar from '../components/designer/ElementToolbar';
import LayerPanel from '../components/designer/LayerPanel';
import PropertyInspector from '../components/designer/PropertyInspector';
import { DEFAULT_TEMPLATE } from '../constants/printSpecs';
import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Save,
  RotateCcw,
  Eye,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const LOCAL_STORAGE_KEY_TEMPLATE = 'id_studio_active_template';

export default function DesignerPage() {
  const { currentUser } = useAuth();
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [currentSide, setCurrentSide] = useState('front'); // 'front' | 'back'
  const [selectedId, setSelectedId] = useState(null);
  const [showSafeGuides, setShowSafeGuides] = useState(true);
  const [showBleedGuides, setShowBleedGuides] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load template from Firestore or localStorage
  useEffect(() => {
    async function loadTemplate() {
      if (isFirebaseConfigured && db && currentUser?.uid) {
        try {
          const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', 'default');
          const snap = await getDoc(tDoc);
          if (snap.exists()) {
            setTemplate({ ...DEFAULT_TEMPLATE, ...snap.data() });
            return;
          }
        } catch (e) {
          console.warn('Failed loading template from firestore:', e);
        }
      }

      // Local storage fallback
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TEMPLATE);
      if (saved) {
        try {
          setTemplate(JSON.parse(saved));
        } catch (e) {}
      }
    }
    loadTemplate();
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isFirebaseConfigured && db && currentUser?.uid) {
        const tDoc = doc(db, 'organizations', currentUser.uid, 'templates', 'default');
        await setDoc(tDoc, {
          ...template,
          updatedAt: serverTimestamp(),
        });
      }

      // Always also save to localStorage for offline reliability
      localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATE, JSON.stringify(template));
      showToast('Template successfully saved!');
    } catch (err) {
      console.error('Error saving template:', err);
      showToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset template to standard corporate / school default layout?')) {
      setTemplate(DEFAULT_TEMPLATE);
      setSelectedId(null);
      localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATE, JSON.stringify(DEFAULT_TEMPLATE));
      showToast('Template reset to default.');
    }
  };

  const handleOrientationToggle = () => {
    const newOrientation = template.orientation === 'portrait' ? 'landscape' : 'portrait';
    setTemplate((prev) => ({
      ...prev,
      orientation: newOrientation,
    }));
    setSelectedId(null);
  };

  const activeElements =
    (currentSide === 'front' ? template.frontElements : template.backElements) || [];

  const handleAddElement = (newElem) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    setTemplate((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newElem],
    }));
    setSelectedId(newElem.id);
  };

  const handleUpdateElement = (updatedElem) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    setTemplate((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((el) => (el.id === updatedElem.id ? updatedElem : el)),
    }));
  };

  const handleUpdateElements = (newElements) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    setTemplate((prev) => ({
      ...prev,
      [key]: newElements,
    }));
  };

  const handleDeleteElement = (id) => {
    const key = currentSide === 'front' ? 'frontElements' : 'backElements';
    setTemplate((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((el) => el.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateBackground = (bg) => {
    const key = currentSide === 'front' ? 'frontBackground' : 'backBackground';
    setTemplate((prev) => ({
      ...prev,
      [key]: bg,
    }));
  };

  const selectedElement = activeElements.find((el) => el.id === selectedId) || null;
  const currentBackground =
    currentSide === 'front' ? template.frontBackground : template.backBackground;

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
        {/* Template Name & Orientation Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={template.name || 'CR80 ID Template'}
            onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-2 py-1 font-semibold text-slate-100 text-sm focus:outline-none"
          />

          <button
            onClick={handleOrientationToggle}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
            title="Switch Landscape (85.6x53.98mm) / Portrait (53.98x85.6mm)"
          >
            {template.orientation === 'portrait' ? 'Orientation: Portrait' : 'Orientation: Landscape'}
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
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Reset to Default Template"
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
        orientation={template.orientation}
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
          template={template}
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
    </div>
  );
}
