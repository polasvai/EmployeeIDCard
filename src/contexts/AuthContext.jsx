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
import { DEFAULT_TEMPLATE, DEFAULT_TEMPLATES } from '../constants/printSpecs';

export const SUPERADMIN_EMAIL = 'superadmin@idcard.bd';
export const SUPERADMIN_PASSWORD = 'Polas76527*';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const LOCAL_STORAGE_KEY_USER = 'id_studio_auth_user';
const LOCAL_STORAGE_KEY_ORG = 'id_studio_auth_org';
const LOCAL_STORAGE_KEY_ALL_ORGS = 'id_studio_all_orgs';
const LOCAL_STORAGE_KEY_USERS_REGISTRY = 'id_studio_users_registry';

const INITIAL_MOCK_ORGS = [
  {
    id: 'superadmin-hq',
    name: 'Super Admin Production HQ',
    ownerUid: 'superadmin-master',
    ownerEmail: SUPERADMIN_EMAIL,
    designerEnabled: true,
    recordsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'demo-org-owner',
    name: 'Acme Global Academy',
    ownerUid: 'demo-org-owner',
    ownerEmail: 'admin@acmeacademy.edu.bd',
    designerEnabled: true,
    recordsCount: 4,
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'org-health-01',
    name: 'Central Specialized Hospital',
    ownerUid: 'user-health-01',
    ownerEmail: 'admin@centralhospital.org',
    designerEnabled: true,
    recordsCount: 18,
    createdAt: '2026-02-10T10:30:00.000Z',
  },
  {
    id: 'org-edu-02',
    name: 'Model College & University',
    ownerUid: 'user-edu-02',
    ownerEmail: 'registrar@modelcollege.edu.bd',
    designerEnabled: false,
    recordsCount: 120,
    createdAt: '2026-03-01T12:00:00.000Z',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState(INITIAL_MOCK_ORGS);
  const [loading, setLoading] = useState(true);

  // First-time Startup Seeding
  useEffect(() => {
    // 1. Seed Super Admin in user registry if first time
    const rawRegistry = localStorage.getItem(LOCAL_STORAGE_KEY_USERS_REGISTRY);
    let registry = [];
    if (rawRegistry) {
      try {
        registry = JSON.parse(rawRegistry);
      } catch (e) {
        registry = [];
      }
    }

    const hasSuperAdmin = registry.some(
      (u) => u.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    );

    if (!hasSuperAdmin) {
      const superAdminSeed = {
        uid: 'superadmin-master',
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        displayName: 'Polas (Super Admin)',
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      };
      registry.unshift(superAdminSeed);
      localStorage.setItem(LOCAL_STORAGE_KEY_USERS_REGISTRY, JSON.stringify(registry));
    }

    // 2. Seed default organizations if not present
    const savedOrgs = localStorage.getItem(LOCAL_STORAGE_KEY_ALL_ORGS);
    if (savedOrgs) {
      try {
        setAllOrganizations(JSON.parse(savedOrgs));
      } catch (e) {
        setAllOrganizations(INITIAL_MOCK_ORGS);
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_ALL_ORGS, JSON.stringify(INITIAL_MOCK_ORGS));
    }
  }, []);

  // Ensure organization profile & starter templates are loaded
  const ensureOrganizationInitialized = async (user) => {
    if (user.role === 'superadmin' || user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      const adminOrg = {
        id: 'superadmin-hq',
        name: 'Super Admin Production HQ',
        ownerUid: user.uid,
        ownerEmail: user.email,
        designerEnabled: true,
      };
      setOrganization(adminOrg);
      return adminOrg;
    }

    if (!isFirebaseConfigured || !db) {
      const storedOrg = localStorage.getItem(LOCAL_STORAGE_KEY_ORG);
      if (storedOrg) {
        try {
          const parsed = JSON.parse(storedOrg);
          setOrganization(parsed);
          return parsed;
        } catch (e) {}
      }
      const defaultOrg = {
        id: user.uid,
        name: user.displayName ? `${user.displayName}'s Organization` : 'My Organization',
        ownerUid: user.uid,
        ownerEmail: user.email || '',
        designerEnabled: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_ORG, JSON.stringify(defaultOrg));
      setOrganization(defaultOrg);
      return defaultOrg;
    }

    try {
      const orgRef = doc(db, 'organizations', user.uid);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const orgData = { id: orgSnap.id, ...orgSnap.data() };
        setOrganization(orgData);
        return orgData;
      } else {
        const initialOrg = {
          name: user.displayName ? `${user.displayName}'s Organization` : 'My Organization',
          ownerUid: user.uid,
          ownerEmail: user.email || '',
          designerEnabled: true,
          logoUrl: null,
          createdAt: serverTimestamp(),
        };
        await setDoc(orgRef, initialOrg);

        // Provision default starter template
        const templatesCol = collection(db, 'organizations', user.uid, 'templates');
        const starterTemplateRef = doc(templatesCol, 'default');
        await setDoc(starterTemplateRef, {
          ...DEFAULT_TEMPLATE,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const orgData = { id: user.uid, ...initialOrg };
        setOrganization(orgData);
        return orgData;
      }
    } catch (err) {
      console.warn('Organization init error, using local fallback:', err);
      const fallbackOrg = {
        id: user.uid,
        name: 'My Organization',
        ownerUid: user.uid,
        designerEnabled: true,
      };
      setOrganization(fallbackOrg);
      return fallbackOrg;
    }
  };

  // Restore authenticated session on mount
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const isSuper = user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
          const userWithRole = {
            ...user,
            role: isSuper ? 'superadmin' : 'user',
            displayName: isSuper ? 'Polas (Super Admin)' : user.displayName || user.email?.split('@')[0],
          };
          setCurrentUser(userWithRole);
          await ensureOrganizationInitialized(userWithRole);
        } else {
          setCurrentUser(null);
          setOrganization(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
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

  /**
   * Authenticate with email & password
   */
  const loginWithEmail = async (rawEmail, password) => {
    const email = rawEmail.trim().toLowerCase();

    // 1. SUPER ADMIN AUTHENTICATION
    if (email === SUPERADMIN_EMAIL.toLowerCase()) {
      if (password !== SUPERADMIN_PASSWORD) {
        throw new Error('Incorrect password for Super Administrator.');
      }

      // If Firebase is configured, ensure account exists in Firebase Auth
      if (isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
        } catch (firebaseErr) {
          if (
            firebaseErr.code === 'auth/user-not-found' ||
            firebaseErr.code === 'auth/invalid-credential'
          ) {
            try {
              const cred = await createUserWithEmailAndPassword(
                auth,
                SUPERADMIN_EMAIL,
                SUPERADMIN_PASSWORD
              );
              await updateProfile(cred.user, { displayName: 'Polas (Super Admin)' });
            } catch (createErr) {
              console.warn('Firebase Super Admin auto-provision notice:', createErr.message);
            }
          }
        }
      }

      const superUser = {
        uid: 'superadmin-master',
        email: SUPERADMIN_EMAIL,
        displayName: 'Polas (Super Admin)',
        role: 'superadmin',
      };

      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(superUser));
      setCurrentUser(superUser);
      await ensureOrganizationInitialized(superUser);
      return superUser;
    }

    // 2. REGULAR ORGANIZATION USER AUTHENTICATION
    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userWithRole = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || email.split('@')[0],
        role: 'user',
      };
      setCurrentUser(userWithRole);
      await ensureOrganizationInitialized(userWithRole);
      return userWithRole;
    } else {
      // Local Registry Lookup
      const rawRegistry = localStorage.getItem(LOCAL_STORAGE_KEY_USERS_REGISTRY);
      let registry = [];
      if (rawRegistry) {
        try {
          registry = JSON.parse(rawRegistry);
        } catch (e) {}
      }

      const found = registry.find((u) => u.email.toLowerCase() === email);
      if (!found) {
        throw new Error('No account found with this email. Please click "Create Account".');
      }

      if (found.password !== password) {
        throw new Error('Invalid email or password.');
      }

      const activeUser = {
        uid: found.uid,
        email: found.email,
        displayName: found.displayName || email.split('@')[0],
        role: found.role || 'user',
      };

      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(activeUser));
      setCurrentUser(activeUser);
      await ensureOrganizationInitialized(activeUser);
      return activeUser;
    }
  };

  /**
   * Register a new organization user
   */
  const registerWithEmail = async (rawEmail, password, orgName = '') => {
    const email = rawEmail.trim().toLowerCase();

    if (email === SUPERADMIN_EMAIL.toLowerCase()) {
      throw new Error('This email is reserved for Super Administrator. Please sign in instead.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (orgName) {
        await updateProfile(cred.user, { displayName: orgName });
      }
      const userObj = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: orgName || email.split('@')[0],
        role: 'user',
      };
      setCurrentUser(userObj);
      await ensureOrganizationInitialized(userObj);
      return userObj;
    } else {
      // Local Registry Registration
      const rawRegistry = localStorage.getItem(LOCAL_STORAGE_KEY_USERS_REGISTRY);
      let registry = [];
      if (rawRegistry) {
        try {
          registry = JSON.parse(rawRegistry);
        } catch (e) {}
      }

      if (registry.some((u) => u.email.toLowerCase() === email)) {
        throw new Error('An account with this email already exists. Please sign in.');
      }

      const newUser = {
        uid: 'user-' + Date.now(),
        email,
        password,
        displayName: orgName || email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      registry.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_USERS_REGISTRY, JSON.stringify(registry));

      const newOrg = {
        id: newUser.uid,
        name: orgName || 'My Organization',
        ownerUid: newUser.uid,
        ownerEmail: email,
        designerEnabled: true,
        recordsCount: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedOrgs = [newOrg, ...allOrganizations];
      setAllOrganizations(updatedOrgs);
      localStorage.setItem(LOCAL_STORAGE_KEY_ALL_ORGS, JSON.stringify(updatedOrgs));

      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(newUser));
      setCurrentUser(newUser);
      await ensureOrganizationInitialized(newUser);
      return newUser;
    }
  };

  /**
   * Google Sign-In
   */
  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      const isSuper = res.user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
      const userObj = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL,
        role: isSuper ? 'superadmin' : 'user',
      };
      setCurrentUser(userObj);
      await ensureOrganizationInitialized(userObj);
      return userObj;
    } else {
      throw new Error('Google Sign-In requires active Firebase credentials configured in .env.');
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ORG);
    setCurrentUser(null);
    setOrganization(null);
  };

  /**
   * Update organization profile
   */
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

  /**
   * Super Admin: Toggle Card Designer access for an organization
   */
  const toggleDesignerForOrg = async (orgId, enabled) => {
    const updated = allOrganizations.map((org) =>
      org.id === orgId ? { ...org, designerEnabled: enabled } : org
    );
    setAllOrganizations(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_ALL_ORGS, JSON.stringify(updated));

    if (organization?.id === orgId) {
      setOrganization((prev) => ({ ...prev, designerEnabled: enabled }));
      localStorage.setItem(
        LOCAL_STORAGE_KEY_ORG,
        JSON.stringify({ ...organization, designerEnabled: enabled })
      );
    }

    if (isFirebaseConfigured && db) {
      try {
        const orgRef = doc(db, 'organizations', orgId);
        await setDoc(orgRef, { designerEnabled: enabled }, { merge: true });
      } catch (err) {
        console.warn('Failed to update org designer flag in firestore:', err);
      }
    }
  };

  const isSuperAdmin =
    currentUser?.role === 'superadmin' ||
    currentUser?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  const value = {
    currentUser,
    organization,
    allOrganizations,
    isSuperAdmin,
    isFirebaseConfigured,
    loading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    updateOrganizationProfile,
    toggleDesignerForOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
