import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import siteConfig from '@generated/docusaurus.config';

const customFields = (siteConfig.customFields || {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: customFields.firebaseApiKey || '',
  authDomain: customFields.firebaseAuthDomain || '',
  projectId: customFields.firebaseProjectId || '',
  storageBucket: customFields.firebaseStorageBucket || '',
  messagingSenderId: customFields.firebaseMessagingSenderId || '',
  appId: customFields.firebaseAppId || '',
};

/** False when .env / deploy secrets are missing — site still loads (guest progress via localStorage). */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('[firebase] init failed — continuing without cloud sync', err);
    app = null;
    auth = null;
    db = null;
    googleProvider = null;
  }
} else if (typeof window !== 'undefined' && !isFirebaseConfigured) {
  console.warn(
    '[firebase] Missing FIREBASE_* env vars. Create a .env (see deploy secrets). Guest mode only.'
  );
}

export { app, auth, db, googleProvider };
