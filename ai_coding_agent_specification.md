# AI Coding Agent Instructions: Free-Tier ID Card Printing Application

## 1. Project Overview & Objective
Build a production-grade, multi-tenant **ID Card Printing Web Application** designed to run entirely on **$0/month free tiers** using **Cloudflare Pages** (Frontend + Client-Side PDF/Canvas Engine) and **Google Firebase** (Authentication + Firestore Database + Storage) — with an optional **Cloudflare R2** bucket for zero-egress photo storage.

The application allows schools, offices, and organizations to:
1. Design double-sided (Front & Back) CR80 ID card templates visually on a canvas.
2. Import student/employee rosters via CSV/Excel and batch-upload/crop portraits.
3. Generate print-ready, 300 DPI PDFs (both single CR80 cards for direct PVC card printers and imposed A4/Letter sheets with crop marks for bulk printing).

---

## 2. Strict Architecture & Free-Tier Guardrails
**CRITICAL:** The AI agent MUST adhere to the following architectural constraints to ensure the application never incurs hosting or serverless billing charges:

1. **Zero Paid Serverless Functions:** Do **NOT** use Firebase Cloud Functions (which require upgrading to the paid Blaze plan). All heavy processing—image resizing/cropping, QR/barcode generation, CSV parsing, and PDF imposition—MUST execute **client-side in the browser**.
2. **Static SPA Hosting Only:** The frontend must compile into pure static assets (`dist/`) compatible with **Cloudflare Pages** (`npm run build`).
3. **Client-Side Image Compression:** Before uploading any portrait or logo to storage, resize and compress it on an offscreen HTML5 `<canvas>` (max `300x300px` for portraits at `0.85` JPEG/WebP quality; max `600px` width for logos) so files remain under `40 KB`.
4. **Batched Firestore Operations:** Always use `writeBatch()` (chunked in groups of $\le 450$ operations) for CSV bulk imports and bulk deletions to minimize Firestore write counts and stay well within the Spark free tier ($20,000$ writes/day, $50,000$ reads/day).

---

## 3. Recommended Tech Stack
- **Framework:** React 18+ with Vite (`JavaScript` or `TypeScript`)
- **Styling:** Tailwind CSS + Lucide React icons
- **Canvas & Card Designer:** `konva` + `react-konva` (or `fabric`)
- **PDF Generation & Imposition:** `pdf-lib` (for precise vector/300-DPI PDF assembly and A4 sheet imposition)
- **Barcodes & QR Codes:** `qrcode` (data URL generation) + `jsbarcode`
- **CSV / Excel Parsing:** `papaparse` and `xlsx` (SheetJS)
- **Image Cropping:** `react-easy-crop` + native HTML5 Canvas compression utility
- **Backend SDKs:** `firebase` v10+ (`firebase/auth`, `firebase/firestore`, `firebase/storage`)

---

## 4. Physical Print Specifications (CR80 & A4 Standards)
The PDF export and canvas designer must strictly follow real-world print dimensions:

- **Standard CR80 Card Size:** $85.6\text{ mm} \times 53.98\text{ mm}$ (Landscape) or $53.98\text{ mm} \times 85.6\text{ mm}$ (Portrait)
- **Print Resolution:** $300\text{ DPI}$ ($1\text{ mm} = 11.811\text{ pixels}$)
  - **Landscape Canvas Pixel Dimensions:** $1011\text{ px} \times 638\text{ px}$
  - **Portrait Canvas Pixel Dimensions:** $638\text{ px} \times 1011\text{ px}$
  - *(Note: Scale the editor viewport using CSS/Konva scale transform while keeping underlying export coordinates locked to $1011 \times 638$ or $638 \times 1011$).*
- **Safe Zone & Bleed:**
  - Include toggleable visual guides in the editor for a $2\text{ mm}$ ($24\text{ px}$) safe margin and $1.5\text{ mm}$ ($18\text{ px}$) bleed edge.
- **A4 Sheet Imposition ($210\text{ mm} \times 297\text{ mm}$):**
  - Arrange up to **10 landscape cards** ($2 \times 5$ grid) or **8 portrait cards** ($2 \times 4$ grid) per A4 page.
  - Render hairline trim/crop marks around every card slot.
  - Support a **"Mirror Back Page"** toggle so double-sided duplex printing aligns front and back cards accurately.

---

## 5. Directory Structure
Generate the codebase following this clean modular structure:

```text
id-card-studio/
├── public/
│   └── _redirects                # Cloudflare Pages SPA fallback: /* /index.html 200
├── src/
│   ├── config/
│   │   └── firebase.js           # Firebase initialization using import.meta.env.VITE_*
│   ├── constants/
│   │   └── printSpecs.js         # CR80, A4, Letter, and 300 DPI conversion constants
│   ├── contexts/
│   │   └── AuthContext.jsx       # Firebase Auth state + Organization profile loader
│   ├── utils/
│   │   ├── imageProcessor.js     # Client-side crop, resize (300x300), and WebP/JPEG compression
│   │   ├── barcodeGenerator.js   # Offscreen QR code & Code128 barcode data-URL generators
│   │   ├── csvParser.js          # PapaParse / SheetJS wrapper with column auto-mapping
│   │   └── pdfExporter.js        # High-DPI single CR80 & A4 imposed PDF generator (pdf-lib)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── designer/
│   │   │   ├── CardCanvas.jsx    # Konva stage for Front/Back card editing
│   │   │   ├── LayerPanel.jsx    # Z-index ordering, lock/hide layers
│   │   │   ├── PropertyInspector.jsx # Font, color, alignment, dynamic {{field}} binding
│   │   │   └── ElementToolbar.jsx    # Add Text, Dynamic Field, Photo Placeholder, QR, Barcode, Shape
│   │   ├── records/
│   │   │   ├── BulkImportModal.jsx   # CSV upload + column mapping + preview
│   │   │   ├── PhotoCropModal.jsx    # Interactive portrait cropper
│   │   │   └── RecordTable.jsx       # Searchable, filterable, selectable student/staff list
│   │   └── print/
│   │       └── PrintPreviewModal.jsx # Configure A4 vs CR80 PVC, duplex mirroring, download PDF
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DesignerPage.jsx
│   │   └── RecordsPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── firestore.rules               # Multi-tenant security rules
├── .env.example                  # Required VITE_FIREBASE_* variables
├── package.json
└── vite.config.js
```

---

## 6. Firestore Data Model & Security Rules

### Firestore Collections Schema
1. `organizations/{orgId}`
   - `name`: string (e.g., `"Sunrise International School"`)
   - `ownerUid`: string
   - `logoUrl`: string | null
   - `createdAt`: timestamp
2. `organizations/{orgId}/templates/{templateId}`
   - `name`: string (e.g., `"Student ID 2026"`)
   - `orientation`: `"portrait"` | `"landscape"`
   - `frontBackground`: `{ type: "color" | "image", value: string }`
   - `backBackground`: `{ type: "color" | "image", value: string }`
   - `frontElements`: Array of layer objects (`{ id, type, fieldKey, x, y, width, height, fontSize, fontFamily, fill, align, borderRadius, ... }`)
   - `backElements`: Array of layer objects
   - `updatedAt`: timestamp
3. `organizations/{orgId}/records/{recordId}`
   - `templateId`: string
   - `fullName`: string
   - `idNumber`: string (used for QR/Barcode generation)
   - `customFields`: map (e.g., `{ class: "10-A", bloodGroup: "O+", validThru: "2027-12-31" }`)
   - `photoUrl`: string | null
   - `printStatus`: `"pending"` | `"printed"`
   - `createdAt`: timestamp

### Required `firestore.rules`
Include this file in the root directory so users can deploy strict tenant isolation:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /organizations/{orgId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;

      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == request.auth.uid;
      }
    }
  }
}
```

---

## 7. Step-by-Step Implementation Tasks for the AI Agent

Execute the build in the following sequence, verifying zero console or build errors at each milestone:

### Phase 1: Project Scaffolding & Firebase Setup
- Initialize Vite + React + Tailwind CSS.
- Create `.env.example` with `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.
- Build `AuthContext.jsx` supporting Email/Password and Google Sign-In. On first login, automatically provision a default `organizations/{uid}` document and a starter ID card template if none exists.
- Add `public/_redirects` containing `/* /index.html 200` so client-side routing works seamlessly on Cloudflare Pages.

### Phase 2: Visual ID Card Template Designer (`CardCanvas.jsx`)
- Implement a dual-tab (**Front Side** / **Back Side**) Konva stage locked to 300 DPI CR80 aspect ratios.
- Support adding, dragging, resizing (via Konva `Transformer`), and styling:
  - **Static Text** (e.g., School Name, "AUTHORIZED SIGNATURE")
  - **Dynamic Data Placeholders** (e.g., `{{fullName}}`, `{{idNumber}}`, `{{class}}`, `{{bloodGroup}}`)
  - **Photo Frame** (rectangular or circular clip mask with placeholder avatar)
  - **Dynamic QR Code & Code128 Barcode** (bound to `{{idNumber}}`)
  - **Shapes & Static Images** (headers, accent bars, school logo, signature stamp)
- Persist the serialized JSON layer tree into `organizations/{orgId}/templates/{templateId}`.

### Phase 3: Records Management, Image Cropping & CSV Bulk Import
- Build `RecordsPage.jsx` with a data table supporting search, batch selection checkboxes, and individual/bulk delete.
- Build `PhotoCropModal.jsx` using `react-easy-crop` locked to the template's photo aspect ratio, exporting a compressed `300x300px` blob uploaded to Firebase Storage at `organizations/{orgId}/photos/{recordId}.jpg`.
- Build `BulkImportModal.jsx` allowing users to upload a `.csv` or `.xlsx` file, map CSV headers to template fields (`fullName`, `idNumber`, and dynamic `customFields`), preview rows, and commit them via chunked `writeBatch()` calls.
- Support **Bulk Photo ZIP / Multi-File Match**: allow selecting multiple local image files named by `idNumber` (e.g., `STU-1001.jpg`) and automatically compressing, uploading, and linking them to matching Firestore records.

### Phase 4: High-DPI PDF Rendering & Sheet Imposition (`pdfExporter.js`)
- Render each selected record against the active template using an offscreen Konva stage at full $300\text{ DPI}$ ($1011 \times 638\text{ px}$ or $638 \times 1011\text{ px}$), substituting `{{placeholders}}` with record values, loading the student photo (with `crossOrigin="anonymous"`), and embedding generated QR/Barcode PNGs.
- Use `pdf-lib` to assemble the output PDF with two selectable modes:
  1. **Single Card Mode (Direct PVC Printer):** Page size strictly $85.6\text{ mm} \times 53.98\text{ mm}$ (or portrait equivalent). Page 1 = Record 1 Front, Page 2 = Record 1 Back, etc.
  2. **A4 Sheet Imposition Mode:** $210\text{ mm} \times 297\text{ mm}$ pages placing 8 or 10 cards per sheet with $4\text{ mm}$ spacing, hairline crop marks, and optional horizontal mirroring for duplex back-side pages.
- Provide a real-time progress bar during batch PDF generation so the UI remains responsive for batches of 100+ cards.

---

## 8. CI/CD Deployment Checklist (GitHub $\rightarrow$ Cloudflare Pages)
Ensure the repository is ready for zero-touch automated deployment:
1. `npm run build` must succeed cleanly with zero warnings/errors and output to `dist/`.
2. `.gitignore` must exclude `node_modules/`, `dist/`, and `.env`.
3. Include a concise `README.md` documenting:
   - How to create a free Firebase project (Spark plan) and copy keys to Cloudflare Pages Environment Variables.
   - How to connect the GitHub repository to **Cloudflare Pages** (`Build command: npm run build`, `Build output directory: dist`) so every `git push` automatically deploys updates live.