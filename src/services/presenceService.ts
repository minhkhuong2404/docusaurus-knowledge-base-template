import { doc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../data/gamificationData';

export interface UserPresence {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  level: number;
  exp: number;
  rankTitle: string;
  rankBadge: string;
  lastActiveAt: number;
  currentRoute?: string;
  isOnline: boolean;
}

const PRESENCE_COLLECTION = 'presence';
const HEARTBEAT_INTERVAL_MS = 45 * 1000; // 45 seconds
const ACTIVE_THRESHOLD_MS = 3 * 60 * 1000; // Considered online if active in the last 3 minutes

/**
 * Updates the user's heartbeat in Firestore presence collection.
 */
export async function updateUserHeartbeat(
  user: User,
  exp: number = 0,
  currentRoute: string = ''
): Promise<void> {
  if (!user || !user.uid) return;

  const { currentLevel } = getExpProgressInCurrentLevel(exp);
  const rank = getRankForLevel(currentLevel);
  const now = Date.now();

  const presenceData: UserPresence = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
    email: user.email || undefined,
    photoURL: user.photoURL || undefined,
    level: currentLevel,
    exp,
    rankTitle: rank.title,
    rankBadge: rank.badge,
    lastActiveAt: now,
    currentRoute: currentRoute || (typeof window !== 'undefined' ? window.location.pathname : ''),
    isOnline: true,
  };

  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, user.uid);
    await setDoc(presenceRef, {
      ...presenceData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore presence heartbeat notice:', err);
  }
}

/**
 * Sets the user state to offline when leaving or closing tab.
 */
export async function setUserOffline(user: User): Promise<void> {
  if (!user || !user.uid) return;
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, user.uid);
    await setDoc(presenceRef, {
      isOnline: false,
      lastActiveAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    // Non-fatal
  }
}

/**
 * Subscribes to real-time online presence data from Firestore.
 * Returns an unsubscribe function.
 */
export function subscribeToOnlineUsers(
  onUpdate: (users: UserPresence[]) => void
): () => void {
  const presenceCol = collection(db, PRESENCE_COLLECTION);
  
  // Real-time listener on presence documents
  return onSnapshot(
    presenceCol,
    (snapshot) => {
      const now = Date.now();
      const onlineUsers: UserPresence[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserPresence;
        // Check if user was active recently (within active threshold)
        if (data && (now - (data.lastActiveAt || 0) < ACTIVE_THRESHOLD_MS) && data.isOnline !== false) {
          onlineUsers.push(data);
        }
      });

      // Sort by EXP descending
      onlineUsers.sort((a, b) => (b.exp || 0) - (a.exp || 0));
      onUpdate(onlineUsers);
    },
    (err) => {
      console.warn('Firestore presence subscription notice:', err);
      onUpdate([]);
    }
  );
}

/**
 * Starts automatic presence heartbeat loop for active user.
 */
export function startPresenceTracker(
  user: User | null,
  exp: number = 0
): () => void {
  if (!user || typeof window === 'undefined') {
    return () => {};
  }

  // Initial heartbeat
  updateUserHeartbeat(user, exp, window.location.pathname);

  // Periodic heartbeat
  const intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      updateUserHeartbeat(user, exp, window.location.pathname);
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Tab visibility listener
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateUserHeartbeat(user, exp, window.location.pathname);
    }
  };

  // Tab close/unload listener
  const handleUnload = () => {
    setUserOffline(user);
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleUnload);
  };
}
