import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import siteConfig from '@generated/docusaurus.config';

const customFields = (siteConfig.customFields || {}) as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: customFields.firebaseApiKey || "AIzaSyDHmbQUMhIQGteRWeoIjY6jNJFBvx2M91U",
  authDomain: customFields.firebaseAuthDomain || "khuong-tjfxef.firebaseapp.com",
  projectId: customFields.firebaseProjectId || "khuong-tjfxef",
  storageBucket: customFields.firebaseStorageBucket || "khuong-tjfxef.firebasestorage.app",
  messagingSenderId: customFields.firebaseMessagingSenderId || "14737596078",
  appId: customFields.firebaseAppId || "1:14737596078:web:ece78d5b899bb2ad05573f",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
