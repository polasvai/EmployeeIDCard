import React from 'react';
import {
  Type,
  UserCheck,
  Image,
  QrCode,
  Barcode,
  Square,
  Circle,
  Minus,
} from 'lucide-react';

export default function ElementToolbar({ onAddElement, orientation }) {
  const isLandscape = orientation !== 'portrait';

  const handleAddText = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'text',
      content: 'NEW TEXT LABEL',
      x: isLandscape ? 350 : 150,
      y: isLandscape ? 200 : 300,
      width: 400,
      height: 40,
      fontSize: 28,
      fontFamily: 'Inter',
      fontStyle: 'bold',
      fill: '#1e293b',
      align: 'left',
      locked: false,
      visible: true,
    });
  };

  const handleAddDynamic = (fieldKey, label, prefix = '', fontFamily = 'Inter') => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'dynamicText',
      fieldKey,
      prefix,
      fallback: label,
      x: isLandscape ? 350 : 150,
      y: isLandscape ? 260 : 360,
      width: 450,
      height: 40,
      fontSize: 26,
      fontFamily,
      fontStyle: 'normal',
      fill: '#0f172a',
      align: 'left',
      locked: false,
      visible: true,
    });
  };

  const handleAddPhoto = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'photo',
      fieldKey: 'photoUrl',
      x: isLandscape ? 60 : 180,
      y: isLandscape ? 160 : 160,
      width: 250,
      height: 320,
      borderRadius: 16,
      borderWidth: 4,
      borderColor: '#94a3b8',
      locked: false,
      visible: true,
    });
  };

  const handleAddQr = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'qrCode',
      fieldKey: 'idNumber',
      x: isLandscape ? 780 : 230,
      y: isLandscape ? 380 : 700,
      width: 160,
      height: 160,
      darkColor: '#000000',
      lightColor: '#ffffff',
      locked: false,
      visible: true,
    });
  };

  const handleAddBarcode = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'barcode',
      fieldKey: 'idNumber',
      barcodeType: 'CODE128',
      x: isLandscape ? 260 : 70,
      y: isLandscape ? 400 : 750,
      width: 500,
      height: 110,
      showText: true,
      lineColor: '#000000',
      locked: false,
      visible: true,
    });
  };

  const handleAddRect = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'shape',
      shapeType: 'rect',
      x: 0,
      y: 0,
      width: isLandscape ? 1011 : 638,
      height: 80,
      fill: '#1e40af',
      cornerRadius: 0,
      locked: false,
      visible: true,
    });
  };

  const handleAddCircle = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'shape',
      shapeType: 'circle',
      x: 200,
      y: 200,
      width: 140,
      height: 140,
      fill: '#f59e0b',
      locked: false,
      visible: true,
    });
  };

  const handleAddLine = () => {
    onAddElement({
      id: `elem-${Date.now()}`,
      type: 'shape',
      shapeType: 'line',
      x: 350,
      y: 350,
      width: 400,
      height: 2,
      stroke: '#cbd5e1',
      strokeWidth: 3,
      locked: false,
      visible: true,
    });
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2 text-xs overflow-x-auto no-scrollbar whitespace-nowrap shrink-0">
      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1">
        Add Element:
      </span>

      <button
        onClick={handleAddText}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
      >
        <Type className="w-3.5 h-3.5 text-indigo-400" />
        <span>Static Text</span>
      </button>

      {/* Dynamic Field Dropdown / Buttons */}
      <div className="relative group">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Dynamic Field &#9662;</span>
        </button>
        <div className="absolute left-0 top-full mt-1 w-60 max-h-96 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 hidden group-hover:block divide-y divide-slate-700/60">
          <div className="py-1">
            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Identity & Bangla Bio
            </span>
            <button
              onClick={() => handleAddDynamic('fullName', 'FULL NAME')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;fullName&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('nameBangla', 'পূর্ণ নাম (বাংলা)', '', 'Noto Sans Bengali')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-indigo-300 font-medium"
            >
              &#123;&#123;nameBangla&#125;&#125; (বাংলা নাম)
            </button>
            <button
              onClick={() => handleAddDynamic('idNumber', 'EMP-1001', 'ID: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;idNumber&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('fatherName', 'Father Name', 'Father: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;fatherName&#125;&#125; (পিতার নাম)
            </button>
            <button
              onClick={() => handleAddDynamic('motherName', 'Mother Name', 'Mother: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;motherName&#125;&#125; (মাতার নাম)
            </button>
            <button
              onClick={() => handleAddDynamic('bloodGroup', 'O+', 'BLOOD: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;bloodGroup&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('gender', 'MALE', 'GEN: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;gender&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('dateOfBirth', '1998-05-12', 'DOB: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;dateOfBirth&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('nationalId', 'NID-98214', 'NID: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;nationalId&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('religion', 'Islam', 'Religion: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;religion&#125;&#125;
            </button>
          </div>

          <div className="py-1">
            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Organization / Role
            </span>
            <button
              onClick={() => handleAddDynamic('department', 'Department', 'DEPT: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;department&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('designation', 'Designation / Role')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;designation&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('roleType', 'Full-Time Staff')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;roleType&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('campus', 'Main Campus', 'CAMPUS: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;campus&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('validThru', '2028-12-31', 'EXP: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;validThru&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('joiningDate', '2023-01-15', 'JOINED: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;joiningDate&#125;&#125;
            </button>
          </div>

          <div className="py-1">
            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Contact & Emergency
            </span>
            <button
              onClick={() => handleAddDynamic('phone', '+1 555-0192', 'TEL: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;phone&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('email', 'user@domain.com')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;email&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('emergencyPhone', '+1 555-0999', 'EMERGENCY: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;emergencyPhone&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('emergencyContactName', 'Guardian Name', 'CONTACT: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;emergencyContactName&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('address', 'City, State')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;address&#125;&#125;
            </button>
            <button
              onClick={() => handleAddDynamic('rfid', 'RFID-881920', 'CHIP: ')}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200"
            >
              &#123;&#123;rfid&#125;&#125;
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleAddPhoto}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
      >
        <Image className="w-3.5 h-3.5 text-blue-400" />
        <span>Photo Frame</span>
      </button>

      <button
        onClick={handleAddQr}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
      >
        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
        <span>QR Code</span>
      </button>

      <button
        onClick={handleAddBarcode}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
      >
        <Barcode className="w-3.5 h-3.5 text-amber-400" />
        <span>Barcode (1D)</span>
      </button>

      <div className="h-5 w-px bg-slate-800 mx-1" />

      {/* Shapes */}
      <button
        onClick={handleAddRect}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        title="Header / Footer Bar"
      >
        <Square className="w-3.5 h-3.5 text-purple-400" />
        <span>Rect</span>
      </button>

      <button
        onClick={handleAddCircle}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        title="Circle Accent"
      >
        <Circle className="w-3.5 h-3.5 text-pink-400" />
        <span>Circle</span>
      </button>

      <button
        onClick={handleAddLine}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        title="Divider Line"
      >
        <Minus className="w-3.5 h-3.5 text-slate-400" />
        <span>Line</span>
      </button>
    </div>
  );
}
