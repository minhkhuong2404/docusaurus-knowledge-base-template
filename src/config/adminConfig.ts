/**
 * Config: adminConfig.ts
 * Manages admin authorization, Firebase Firestore persistence, and Super Admin privileges.
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

// Designated Super Admin who possesses exclusive permissions to add/remove admins
export const SUPER_ADMIN_EMAIL = 'khuonglu1999@gmail.com';

// Default hardcoded admin email list (case-insensitive)
export const DEFAULT_ADMIN_EMAILS: string[] = [
  'khuonglu1999@gmail.com'
];

const ADMIN_STORAGE_KEY = 'app_admin_emails_v1';
const FIRESTORE_ADMIN_DOC = { collection: 'config', docId: 'admin_permissions' };

/**
 * Check if the given user is the designated Super Admin
 */
export function isSuperAdminUser(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Get all configured admin emails (combines default list + locally cached admin emails)
 */
export function getAdminEmails(): string[] {
  if (typeof window === 'undefined') {
    return [...DEFAULT_ADMIN_EMAILS];
  }
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const set = new Set([
          ...DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
          ...parsed.map((e) => String(e).trim().toLowerCase()),
        ]);
        return Array.from(set);
      }
    }
  } catch (err) {
    console.error('Failed to load admin emails from localStorage:', err);
  }
  return [...DEFAULT_ADMIN_EMAILS];
}

/**
 * Update local storage cache of admin emails
 */
export function setLocalAdminEmails(emails: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const set = new Set([
      ...DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
      ...emails.map((e) => String(e).trim().toLowerCase()),
    ]);
    const merged = Array.from(set);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Failed to cache admin emails locally:', err);
  }
}

/**
 * Subscribe to real-time Admin Email changes from Firestore
 */
export function subscribeToAdminEmails(
  onUpdate: (adminEmails: string[]) => void
): Unsubscribe {
  const docRef = doc(db, FIRESTORE_ADMIN_DOC.collection, FIRESTORE_ADMIN_DOC.docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const remoteEmails: string[] = Array.isArray(data?.emails) ? data.emails : [];
        const set = new Set([
          ...DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
          ...remoteEmails.map((e) => String(e).trim().toLowerCase()),
        ]);
        const merged = Array.from(set);
        setLocalAdminEmails(merged);
        onUpdate(merged);
      } else {
        // Initialize Firestore doc with default list if not existing
        setDoc(
          docRef,
          {
            emails: DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()),
            updatedAt: serverTimestamp(),
            updatedBy: 'system_init',
          },
          { merge: true }
        ).catch(() => { });
        onUpdate(getAdminEmails());
      }
    },
    (error) => {
      console.warn('Firestore admin permissions listener error (falling back to cache):', error);
      onUpdate(getAdminEmails());
    }
  );
}

/**
 * Save new admin email (Only permitted by Super Admin).
 * Updates both Firestore and localStorage.
 */
export async function saveAdminEmail(
  email: string,
  callerEmail?: string | null
): Promise<{ success: boolean; message: string; updatedList: string[] }> {
  if (!isSuperAdminUser(callerEmail)) {
    return {
      success: false,
      message: `Permission Denied: Only Super Admin (${SUPER_ADMIN_EMAIL}) can add admins.`,
      updatedList: getAdminEmails(),
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      message: 'Invalid email address format.',
      updatedList: getAdminEmails(),
    };
  }

  const current = getAdminEmails();
  if (current.includes(cleanEmail)) {
    return {
      success: false,
      message: `${cleanEmail} is already an Admin.`,
      updatedList: current,
    };
  }

  const updated = [...current, cleanEmail];
  setLocalAdminEmails(updated);

  // Sync to Firestore
  try {
    const docRef = doc(db, FIRESTORE_ADMIN_DOC.collection, FIRESTORE_ADMIN_DOC.docId);
    await setDoc(
      docRef,
      {
        emails: arrayUnion(cleanEmail),
        updatedAt: serverTimestamp(),
        updatedBy: callerEmail,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync added admin to Firestore:', err);
  }

  return {
    success: true,
    message: `Added ${cleanEmail} as Admin.`,
    updatedList: updated,
  };
}

/**
 * Remove admin email (Only permitted by Super Admin).
 * Cannot remove Super Admin or default list.
 */
export async function removeAdminEmail(
  email: string,
  callerEmail?: string | null
): Promise<{ success: boolean; message: string; updatedList: string[] }> {
  if (!isSuperAdminUser(callerEmail)) {
    return {
      success: false,
      message: `Permission Denied: Only Super Admin (${SUPER_ADMIN_EMAIL}) can remove admins.`,
      updatedList: getAdminEmails(),
    };
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: `Cannot remove the Super Admin (${SUPER_ADMIN_EMAIL}).`,
      updatedList: getAdminEmails(),
    };
  }

  const current = getAdminEmails();
  const updated = current.filter((e) => e !== cleanEmail);
  setLocalAdminEmails(updated);

  // Sync removal to Firestore
  try {
    const docRef = doc(db, FIRESTORE_ADMIN_DOC.collection, FIRESTORE_ADMIN_DOC.docId);
    await setDoc(
      docRef,
      {
        emails: arrayRemove(cleanEmail),
        updatedAt: serverTimestamp(),
        updatedBy: callerEmail,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync removed admin from Firestore:', err);
  }

  return {
    success: true,
    message: `Removed ${cleanEmail} from Admin permissions.`,
    updatedList: updated,
  };
}

/**
 * Check whether a given user email has Admin permissions
 */
export function checkIsAdmin(userEmail?: string | null, customList?: string[]): boolean {
  if (!userEmail) return false;
  const clean = userEmail.trim().toLowerCase();
  const adminList = (customList || getAdminEmails()).map((e) => e.trim().toLowerCase());
  return adminList.includes(clean);
}
