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
const LOCAL_STORAGE_KEY_ALL_ORGS = 'id_studio_all_orgs';

const INITIAL_MOCK_ORGS = [
  {
    id: 'demo-org-owner',
    name: 'Acme Global Academy',
    ownerUid: 'demo-org-owner',
    ownerEmail: 'demo@idcardstudio.local',
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
    designerEnabled: false, // Demo designer disabled for this organization
    recordsCount: 120,
    createdAt: '2026-03-01T12:00:00.000Z',
  },
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState(INITIAL_MOCK_ORGS);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch organization doc & starter template
  const ensureOrganizationInitialized = async (user) => {
    // If super admin, set superadmin organization
    if (user.role === 'superadmin') {
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
        ownerEmail: user.email || 'demo@idcardstudio.local',
        designerEnabled: true,
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
          ownerEmail: user.email || '',
          designerEnabled: true,
          logoUrl: null,
          createdAt: serverTimestamp(),
        };
        await setDoc(orgRef, initialOrg);

        // Provision default starter template
        const templatesCol = collection(db, 'organizations', user.uid, 'templates');
        const templatesSnap = await getDocs(templatesCol);
        if (templatesSnap.empty) {
          const starterTemplateRef = doc(templatesCol, 'default');
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

  // Load organizations list for super admin
  useEffect(() => {
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

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Check if admin email
          const isSuper =
            user.email?.toLowerCase().includes('superadmin') ||
            user.email?.toLowerCase() === 'admin@idcardstudio.com';
          const userWithRole = { ...user, role: isSuper ? 'superadmin' : 'user' };
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
    const isSuper =
      email.toLowerCase().includes('superadmin') ||
      email.toLowerCase() === 'admin@idcardstudio.com';

    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userWithRole = { ...res.user, role: isSuper ? 'superadmin' : 'user' };
      setCurrentUser(userWithRole);
      return userWithRole;
    } else {
      const mockUser = {
        uid: isSuper ? 'superadmin-master' : 'demo-user-123',
        email,
        displayName: isSuper ? 'Super Admin' : email.split('@')[0],
        photoURL: null,
        role: isSuper ? 'superadmin' : 'user',
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
        role: 'user',
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      await ensureOrganizationInitialized(mockUser);

      // Add to all organizations
      const newOrg = {
        id: mockUser.uid,
        name: orgName || 'My Organization',
        ownerUid: mockUser.uid,
        ownerEmail: email,
        designerEnabled: true,
        recordsCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updatedOrgs = [newOrg, ...allOrganizations];
      setAllOrganizations(updatedOrgs);
      localStorage.setItem(LOCAL_STORAGE_KEY_ALL_ORGS, JSON.stringify(updatedOrgs));

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
        role: 'user',
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
      role: 'user', // regular organization user
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(mockUser));
    setCurrentUser(mockUser);
    await ensureOrganizationInitialized(mockUser);
    return mockUser;
  };

  const loginAsSuperAdmin = async () => {
    const superUser = {
      uid: 'superadmin-master',
      email: 'superadmin@idcardstudio.com',
      displayName: 'Master Super Admin',
      photoURL: null,
      role: 'superadmin',
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(superUser));
    setCurrentUser(superUser);
    await ensureOrganizationInitialized(superUser);
    return superUser;
  };

  const switchRole = (newRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role: newRole };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(updated));
    ensureOrganizationInitialized(updated);
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

  // Super Admin: Toggle Card Designer access for an organization
  const toggleDesignerForOrg = async (orgId, enabled) => {
    const updated = allOrganizations.map((org) =>
      org.id === orgId ? { ...org, designerEnabled: enabled } : org
    );
    setAllOrganizations(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_ALL_ORGS, JSON.stringify(updated));

    // If active organization matches, update local state
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

  const isSuperAdmin = currentUser?.role === 'superadmin';

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
    loginAsDemo,
    loginAsSuperAdmin,
    switchRole,
    logout,
    updateOrganizationProfile,
    toggleDesignerForOrg,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
