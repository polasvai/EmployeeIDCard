import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyDApHtICsjvQA0o2_gvkbgEGnXExtOzAB4',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    import.meta.env.VITE_FIREBASE_AUTH_DOM ||
    'idcard-cloudflare.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    import.meta.env.VITE_FIREBASE_PROJECT_I ||
    'idcard-cloudflare',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    import.meta.env.VITE_FIREBASE_STORAGE_E ||
    'idcard-cloudflare.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    import.meta.env.VITE_FIREBASE_MESSAGIN ||
    '429369392917',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:429369392917:web:151e8d7cd0a50aa2a8f31c',
};

// Check if credentials are placeholders or actually configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('replace-with') &&
  !firebaseConfig.apiKey.includes('your-api-key') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your-project-id')
);

let app;
let auth;
let db;
let storage;
let googleProvider;

try {
  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    console.warn(
      '⚠️ Firebase credentials not detected or using placeholder values. ID Card Studio is running in Local / Demo Mode with simulated storage & database.'
    );
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export { app, auth, db, storage, googleProvider };
