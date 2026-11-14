# ID Card Studio 🪪

A production-grade, multi-tenant **ID Card Printing Web Application** designed to run entirely on **$0/month free tiers** using **Cloudflare Pages** (Static SPA hosting + Client-Side PDF/Canvas Engine) and **Google Firebase** (Authentication + Firestore Database + Storage).

---

## ✨ Features

- **Double-Sided CR80 Designer:**
  - True 300 DPI canvas coordinates ($1011 \times 638\text{ px}$ landscape / $638 \times 1011\text{ px}$ portrait).
  - Add text, dynamic placeholders (`{{fullName}}`, `{{idNumber}}`, `{{department}}`, etc.), photo frames, QR codes, Code128 barcodes, and shapes.
  - Interactive Konva transformer with drag, resize, z-index layering, lock, and hide toggles.
  - Safe zone ($2\text{ mm}$) and bleed margin ($1.5\text{ mm}$) visual guides.
- **Roster & Bulk Data Management:**
  - Import CSV and Excel (`.xlsx`, `.xls`) rosters with automatic column mapping and live data preview.
  - Batch commit rows with chunked Firestore operations ($\le 400$ ops/batch) strictly within the Spark free tier.
  - Multi-photo matching by ID number (e.g., `EMP-1001.jpg` automatically compressed and attached).
  - Integrated portrait cropper (`react-easy-crop`) that compresses photos to 300×300px JPEG under 40 KB.
- **Print & PDF Imposition Engine (`pdf-lib`):**
  - **A4 Sheet Imposition:** 10 cards ($2 \times 5$) per sheet with hairline trim/crop marks and duplex back-page mirroring.
  - **Single Card CR80 Mode:** Direct $85.6 \times 53.98\text{ mm}$ vector PDF pages for direct PVC thermal card printers (Fargo, Evolis, Zebra).
  - Real-time progress bar with status updates during batch generation.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app includes a built-in **Instant Demo Mode** that runs entirely client-side with sample records and local storage, allowing you to design and print cards immediately without setting up Firebase first!

---

## ☁️ Free Firebase Setup (Spark Plan - $0/mo)

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project on the **Spark (Free)** plan.
2. In **Authentication**, enable **Email/Password** and **Google** sign-in providers.
3. In **Firestore Database**, create a database in production mode and deploy the security rules from [`firestore.rules`](./firestore.rules).
4. In **Storage**, enable Cloud Storage for portrait uploads.
5. In **Project Settings** > **General**, register a Web App (`</>`) and copy the config credentials.
6. Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## ⚡ Zero-Cost Deployment to Cloudflare Pages

1. Push your repository to **GitHub**:
```bash
git add .
git commit -m "Initial commit of ID Card Studio"
git branch -M main
git remote add origin https://github.com/your-username/id-card-studio.git
git push -u origin main
```

2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository and configure build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Under **Environment variables**, add the `VITE_FIREBASE_*` variables from your `.env` file.
5. Click **Save and Deploy**. Cloudflare Pages will build the static SPA and serve it globally on their high-speed edge network with zero serverless costs and unlimited bandwidth!

---

## 🔒 Security Rules (`firestore.rules`)
Tenant isolation is enforced by checking `request.auth.uid == resource.data.ownerUid`:
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
