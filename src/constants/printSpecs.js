// Physical Print & Dimension Specifications for CR80 & A4 (300 DPI)

export const DPI = 300;
export const MM_PER_INCH = 25.4;
export const POINTS_PER_INCH = 72;

// Conversion factors
export const MM_TO_PT = POINTS_PER_INCH / MM_PER_INCH; // ~2.8346457
export const MM_TO_PX_300DPI = DPI / MM_PER_INCH;       // ~11.8110236

export const CR80 = {
  widthMm: 85.6,
  heightMm: 53.98,
  landscape: {
    widthPx: 1011,
    heightPx: 638,
    widthPt: 85.6 * MM_TO_PT,   // ~242.65 pt
    heightPt: 53.98 * MM_TO_PT, // ~153.02 pt
  },
  portrait: {
    widthPx: 638,
    heightPx: 1011,
    widthPt: 53.98 * MM_TO_PT,
    heightPt: 85.6 * MM_TO_PT,
  },
  safeMarginMm: 2.0,
  safeMarginPx: 24,
  bleedMm: 1.5,
  bleedPx: 18,
};

export const A4 = {
  widthMm: 210,
  heightMm: 297,
  widthPt: 210 * MM_TO_PT, // ~595.28 pt
  heightPt: 297 * MM_TO_PT, // ~841.89 pt
  landscapeGrid: {
    cols: 2,
    rows: 5,
    maxCards: 10,
    spacingMm: 4,
    spacingPt: 4 * MM_TO_PT,
  },
  portraitGrid: {
    cols: 2,
    rows: 4,
    maxCards: 8,
    spacingMm: 4,
    spacingPt: 4 * MM_TO_PT,
  },
};

export const DEFAULT_TEMPLATE = {
  name: "Standard Corporate / School ID",
  orientation: "landscape", // "landscape" | "portrait"
  frontBackground: {
    type: "color", // "color" | "gradient" | "image"
    value: "#ffffff",
    secondaryValue: "#f8fafc",
    gradientAngle: 135
  },
  backBackground: {
    type: "color",
    value: "#ffffff",
    secondaryValue: "#f1f5f9",
    gradientAngle: 135
  },
  frontElements: [
    {
      id: "elem-header-bar",
      type: "shape",
      shapeType: "rect",
      x: 0,
      y: 0,
      width: 1011,
      height: 110,
      fill: "#1e3a8a", // navy blue
      cornerRadius: 0,
      locked: false,
      visible: true
    },
    {
      id: "elem-org-title",
      type: "text",
      fieldKey: null,
      content: "ACME GLOBAL CORPORATION",
      x: 40,
      y: 35,
      width: 931,
      height: 45,
      fontSize: 34,
      fontFamily: "Oswald",
      fill: "#ffffff",
      fontStyle: "bold",
      align: "center",
      locked: false,
      visible: true
    },
    {
      id: "elem-accent-strip",
      type: "shape",
      shapeType: "rect",
      x: 0,
      y: 110,
      width: 1011,
      height: 10,
      fill: "#f59e0b", // amber gold
      cornerRadius: 0,
      locked: false,
      visible: true
    },
    {
      id: "elem-photo-placeholder",
      type: "photo",
      fieldKey: "photoUrl",
      x: 65,
      y: 170,
      width: 260,
      height: 330,
      borderRadius: 16,
      borderWidth: 4,
      borderColor: "#cbd5e1",
      locked: false,
      visible: true
    },
    {
      id: "elem-full-name",
      type: "dynamicText",
      fieldKey: "fullName",
      prefix: "",
      fallback: "ALEXANDER R. MORGAN",
      x: 360,
      y: 180,
      width: 600,
      height: 55,
      fontSize: 38,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: "#0f172a",
      align: "left",
      locked: false,
      visible: true
    },
    {
      id: "elem-id-badge",
      type: "dynamicText",
      fieldKey: "idNumber",
      prefix: "ID: ",
      fallback: "EMP-892041",
      x: 360,
      y: 250,
      width: 400,
      height: 38,
      fontSize: 26,
      fontFamily: "Roboto Mono",
      fontStyle: "bold",
      fill: "#2563eb",
      align: "left",
      locked: false,
      visible: true
    },
    {
      id: "elem-custom-dept",
      type: "dynamicText",
      fieldKey: "department",
      prefix: "DEPT: ",
      fallback: "Software Engineering",
      x: 360,
      y: 305,
      width: 500,
      height: 35,
      fontSize: 24,
      fontFamily: "Inter",
      fontStyle: "normal",
      fill: "#475569",
      align: "left",
      locked: false,
      visible: true
    },
    {
      id: "elem-custom-blood",
      type: "dynamicText",
      fieldKey: "bloodGroup",
      prefix: "BLOOD GRP: ",
      fallback: "O+",
      x: 360,
      y: 355,
      width: 500,
      height: 35,
      fontSize: 24,
      fontFamily: "Inter",
      fontStyle: "normal",
      fill: "#dc2626",
      align: "left",
      locked: false,
      visible: true
    },
    {
      id: "elem-qr-code",
      type: "qrCode",
      fieldKey: "idNumber",
      x: 770,
      y: 370,
      width: 170,
      height: 170,
      locked: false,
      visible: true
    },
    {
      id: "elem-footer-bar",
      type: "shape",
      shapeType: "rect",
      x: 0,
      y: 588,
      width: 1011,
      height: 50,
      fill: "#0f172a",
      cornerRadius: 0,
      locked: false,
      visible: true
    },
    {
      id: "elem-footer-text",
      type: "text",
      fieldKey: null,
      content: "AUTHORIZED PERSONNEL ONLY • VERIFIED CREDENTIAL",
      x: 30,
      y: 602,
      width: 951,
      height: 25,
      fontSize: 18,
      fontFamily: "Inter",
      fill: "#94a3b8",
      fontStyle: "medium",
      align: "center",
      locked: false,
      visible: true
    }
  ],
  backElements: [
    {
      id: "elem-back-header",
      type: "text",
      fieldKey: null,
      content: "TERMS & CONDITIONS",
      x: 50,
      y: 50,
      width: 911,
      height: 35,
      fontSize: 26,
      fontFamily: "Oswald",
      fill: "#1e293b",
      fontStyle: "bold",
      align: "center",
      locked: false,
      visible: true
    },
    {
      id: "elem-back-terms",
      type: "text",
      fieldKey: null,
      content: "1. This identity card is property of the issuing organization.\n2. Must be visibly displayed at all times while on company premises.\n3. Non-transferable. Loss must be reported immediately to Security.\n4. If found, please return to HQ Reception or call +1 (800) 555-0199.",
      x: 60,
      y: 110,
      width: 891,
      height: 220,
      fontSize: 20,
      fontFamily: "Inter",
      fill: "#334155",
      fontStyle: "normal",
      align: "left",
      lineHeight: 1.6,
      locked: false,
      visible: true
    },
    {
      id: "elem-back-barcode",
      type: "barcode",
      fieldKey: "idNumber",
      barcodeType: "CODE128",
      x: 255,
      y: 370,
      width: 500,
      height: 120,
      locked: false,
      visible: true
    },
    {
      id: "elem-sign-line",
      type: "shape",
      shapeType: "line",
      x: 650,
      y: 560,
      width: 280,
      height: 2,
      stroke: "#94a3b8",
      strokeWidth: 2,
      locked: false,
      visible: true
    },
    {
      id: "elem-sign-label",
      type: "text",
      fieldKey: null,
      content: "Authorized Signatory",
      x: 650,
      y: 575,
      width: 280,
      height: 25,
      fontSize: 18,
      fontFamily: "Inter",
      fill: "#64748b",
      align: "center",
      locked: false,
      visible: true
    }
  ]
};
