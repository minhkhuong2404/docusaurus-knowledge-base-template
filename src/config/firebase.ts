import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import siteConfig from '@generated/docusaurus.config';

const customFields = (siteConfig.customFields || {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: customFields.firebaseApiKey || "[GCP_API_KEY]",
  authDomain: customFields.firebaseAuthDomain || "minhkhuong-knowledge-base.firebaseapp.com",
  projectId: customFields.firebaseProjectId || "minhkhuong-knowledge-base",
  storageBucket: customFields.firebaseStorageBucket || "minhkhuong-knowledge-base.firebasestorage.app",
  messagingSenderId: customFields.firebaseMessagingSenderId || "885266811837",
  appId: customFields.firebaseAppId || "1:885266811837:web:783d0d4de9f8331575cefd",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
