import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
