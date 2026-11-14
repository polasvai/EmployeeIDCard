import React from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Image,
  QrCode,
  Barcode,
  Square,
  Circle,
  Minus,
} from 'lucide-react';

export default function LayerPanel({
  elements,
  selectedId,
  onSelect,
  onUpdateElements,
  onDeleteElement,
}) {
  const getIcon = (elem) => {
    switch (elem.type) {
      case 'text':
      case 'dynamicText':
        return <Type className="w-3.5 h-3.5 text-indigo-400" />;
      case 'photo':
        return <Image className="w-3.5 h-3.5 text-blue-400" />;
      case 'qrCode':
        return <QrCode className="w-3.5 h-3.5 text-emerald-400" />;
      case 'barcode':
        return <Barcode className="w-3.5 h-3.5 text-amber-400" />;
      case 'shape':
        if (elem.shapeType === 'circle') return <Circle className="w-3.5 h-3.5 text-pink-400" />;
        if (elem.shapeType === 'line') return <Minus className="w-3.5 h-3.5 text-slate-400" />;
        return <Square className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getLabel = (elem) => {
    if (elem.type === 'dynamicText') return `{{${elem.fieldKey}}}`;
    if (elem.type === 'text') return elem.content || 'Text';
    if (elem.type === 'photo') return 'Photo Frame';
    if (elem.type === 'qrCode') return `QR (${elem.fieldKey || 'ID'})`;
    if (elem.type === 'barcode') return `Barcode (${elem.fieldKey || 'ID'})`;
    if (elem.type === 'shape') return `Shape: ${elem.shapeType || 'rect'}`;
    return elem.id;
  };

  const toggleVisibility = (index) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], visible: updated[index].visible === false ? true : false };
    onUpdateElements(updated);
  };

  const toggleLock = (index) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], locked: !updated[index].locked };
    onUpdateElements(updated);
  };

  const moveUp = (index) => {
    if (index >= elements.length - 1) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onUpdateElements(updated);
  };

  const moveDown = (index) => {
    if (index <= 0) return;
    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onUpdateElements(updated);
  };

  return (
    <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-xs">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Layers ({elements.length})</span>
        </div>
        <span className="text-[10px] text-slate-400">Top to Bottom</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {elements.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No elements on this card side. Add text, photo, or shapes from the toolbar.
          </div>
        ) : (
          // Display top layer first
          [...elements].reverse().map((elem, revIdx) => {
            const actualIndex = elements.length - 1 - revIdx;
            const isSelected = elem.id === selectedId;

            return (
              <div
                key={elem.id}
                onClick={() => onSelect(elem.id)}
                className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  {getIcon(elem)}
                  <span className="truncate font-medium">{getLabel(elem)}</span>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveUp(actualIndex);
                    }}
                    title="Bring Forward"
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                    disabled={actualIndex === elements.length - 1}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDown(actualIndex);
                    }}
                    title="Send Backward"
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                    disabled={actualIndex === 0}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(actualIndex);
                    }}
                    title={elem.visible === false ? 'Show' : 'Hide'}
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                  >
                    {elem.visible === false ? (
                      <EyeOff className="w-3 h-3 text-slate-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-slate-300" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(actualIndex);
                    }}
                    title={elem.locked ? 'Unlock' : 'Lock'}
                    className="p-1 hover:text-white hover:bg-slate-700 rounded"
                  >
                    {elem.locked ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(elem.id);
                    }}
                    title="Delete Element"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
