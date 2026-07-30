import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env[key];
    }
  } catch {
    // Ignore in browser bundle
  }
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY') || "AIzaSyDHmbQUMhIQGteRWeoIjY6jNJFBvx2M91U",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "khuong-tjfxef.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "khuong-tjfxef",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "khuong-tjfxef.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "14737596078",
  appId: getEnv('FIREBASE_APP_ID') || "1:14737596078:web:ece78d5b899bb2ad05573f",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
