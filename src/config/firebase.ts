import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';
import siteConfig from '@generated/docusaurus.config';

const customFields = (siteConfig.customFields || {}) as Record<string, string | undefined>;

export const isFirebaseConfigured = Boolean(
  customFields.firebaseApiKey && customFields.firebaseApiKey.trim().length > 0
);

// Fallback to valid placeholder values during SSR / CI build environments without secrets
export const firebaseConfig = {
  apiKey: isFirebaseConfigured ? customFields.firebaseApiKey! : 'AIzaSyDummyBuildApiKeyPlaceholder000000',
  authDomain: customFields.firebaseAuthDomain || 'placeholder.firebaseapp.com',
  projectId: customFields.firebaseProjectId || 'placeholder-project',
  storageBucket: customFields.firebaseStorageBucket || 'placeholder.appspot.com',
  messagingSenderId: customFields.firebaseMessagingSenderId || '1234567890',
  appId: customFields.firebaseAppId || '1:1234567890:web:abcdef123456',
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Enforce browser local persistence across sessions & deployments
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('Failed to set Firebase Auth browser local persistence:', err);
  });
}

// Initialize Firestore with multi-tab IndexedDB persistence for instantaneous offline/slow-network access
let firestoreDb: Firestore;
if (typeof window !== 'undefined') {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (_e) {
    firestoreDb = getFirestore(app);
  }
} else {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
