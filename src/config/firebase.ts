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
  apiKey: getEnv('FIREBASE_API_KEY') || "[GCP_API_KEY]",
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN') || "minhkhuong-knowledge-base.firebaseapp.com",
  projectId: getEnv('FIREBASE_PROJECT_ID') || "minhkhuong-knowledge-base",
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET') || "minhkhuong-knowledge-base.firebasestorage.app",
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID') || "885266811837",
  appId: getEnv('FIREBASE_APP_ID') || "1:885266811837:web:783d0d4de9f8331575cefd",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
