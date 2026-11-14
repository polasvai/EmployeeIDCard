import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
} from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { DEFAULT_TEMPLATE } from '../constants/printSpecs';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const LOCAL_STORAGE_KEY_USER = 'id_studio_demo_user';
const LOCAL_STORAGE_KEY_ORG = 'id_studio_demo_org';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch organization doc & starter template
  const ensureOrganizationInitialized = async (user) => {
    if (!isFirebaseConfigured || !db) {
      // Local/Demo fallback
      const storedOrg = localStorage.getItem(LOCAL_STORAGE_KEY_ORG);
      if (storedOrg) {
        const parsed = JSON.parse(storedOrg);
        setOrganization(parsed);
        return parsed;
      }
      const demoOrg = {
        id: user.uid,
        name: user.displayName ? `${user.displayName}'s Organization` : 'Acme Global Academy',
        ownerUid: user.uid,
        logoUrl: null,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(demoOrg));
      setOrganization(demoOrg);
      return demoOrg;
    }

    try {
      const orgRef = doc(db, 'organizations', user.uid);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const orgData = { id: orgSnap.id, ...orgSnap.data() };
        setOrganization(orgData);
        return orgData;
      } else {
        // Provision organization
        const initialOrg = {
          name: user.displayName ? `${user.displayName}'s Organization` : 'My Organization',
          ownerUid: user.uid,
          logoUrl: null,
          createdAt: serverTimestamp(),
        };
        await setDoc(orgRef, initialOrg);

        // Check/provision default starter template
        const templatesCol = collection(db, 'organizations', user.uid, 'templates');
        const templatesSnap = await getDocs(templatesCol);
        if (templatesSnap.empty) {
          const starterTemplateRef = doc(templatesCol);
          await setDoc(starterTemplateRef, {
            ...DEFAULT_TEMPLATE,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        const orgData = { id: user.uid, ...initialOrg };
        setOrganization(orgData);
        return orgData;
      }
    } catch (err) {
      console.error('Error provisioning or loading organization:', err);
      // Fallback
      const fallbackOrg = {
        id: user.uid,
        name: 'My Organization',
        ownerUid: user.uid,
      };
      setOrganization(fallbackOrg);
      return fallbackOrg;
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          await ensureOrganizationInitialized(user);
        } else {
          setOrganization(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Check for persisted local demo session
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          ensureOrganizationInitialized(parsed);
        } catch (e) {
          localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
        }
      }
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email, password) => {
    if (isFirebaseConfigured && auth) {
      return signInWithEmailAndPassword(auth, email, password);
    } else {
      const mockUser = {
        uid: 'demo-user-123',
        email,
        displayName: email.split('@')[0],
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      await ensureOrganizationInitialized(mockUser);
      return mockUser;
    }
  };

  const registerWithEmail = async (email, password, orgName = '') => {
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (orgName) {
        await updateProfile(cred.user, { displayName: orgName });
      }
      return cred.user;
    } else {
      const mockUser = {
        uid: 'demo-user-' + Date.now(),
        email,
        displayName: orgName || email.split('@')[0],
        photoURL: null,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      await ensureOrganizationInitialized(mockUser);
      return mockUser;
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } else {
      const mockUser = {
        uid: 'google-demo-user',
        email: 'admin@organization.com',
        displayName: 'Google Demo User',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      await ensureOrganizationInitialized(mockUser);
      return mockUser;
    }
  };

  const loginAsDemo = async () => {
    const mockUser = {
      uid: 'demo-org-owner',
      email: 'demo@idcardstudio.local',
      displayName: 'Acme Academy',
      photoURL: null,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    await ensureOrganizationInitialized(mockUser);
    return mockUser;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      localStorage.removeItem(LOCAL_STORAGE_KEY_ORG);
      setCurrentUser(null);
      setOrganization(null);
    }
  };

  const updateOrganizationProfile = async (updates) => {
    if (!currentUser || !organization) return;
    const updated = { ...organization, ...updates };
    setOrganization(updated);

    if (isFirebaseConfigured && db) {
      const orgRef = doc(db, 'organizations', currentUser.uid);
      await setDoc(orgRef, updates, { merge: true });
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(updated));
    }
  };

  const value = {
    currentUser,
    organization,
    isFirebaseConfigured,
    loading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemo,
    logout,
    updateOrganizationProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
