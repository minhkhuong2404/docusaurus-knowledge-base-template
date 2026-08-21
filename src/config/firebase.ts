import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import siteConfig from '@generated/docusaurus.config';

const customFields = (siteConfig.customFields || {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: customFields.firebaseApiKey || "",
  authDomain: customFields.firebaseAuthDomain || "",
  projectId: customFields.firebaseProjectId || "",
  storageBucket: customFields.firebaseStorageBucket || "",
  messagingSenderId: customFields.firebaseMessagingSenderId || "",
  appId: customFields.firebaseAppId || "",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
