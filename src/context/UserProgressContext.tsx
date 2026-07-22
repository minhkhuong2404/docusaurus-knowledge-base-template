import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Master-password verification (PBKDF2 / Web Crypto) ──────────────────────
// Use a safe guard so that the browser bundle does not crash on `process` being
// undefined — `process.env` is a Node.js global that Rspack does NOT polyfill
// for arbitrary keys at runtime (only statically-replaced REACT_APP_* vars).
const _getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      return (process.env[key] as string | undefined) ?? '';
    }
  } catch {
    // Swallow — running in browser without process polyfill
  }
  return '';
};
const MASTER_SALT = _getEnv('AUTH_PASSWORD_SALT');
const MASTER_HASH = _getEnv('AUTH_PASSWORD_HASH');

async function verifyMasterKey(input: string): Promise<boolean> {
  if (!MASTER_SALT || !MASTER_HASH) {
    // No hash configured — accept any non-empty key (dev/fallback)
    return input.trim().length > 0;
  }
  try {
    const enc = new TextEncoder();
    const saltBytes = new Uint8Array(
      MASTER_SALT.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(input),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 310_000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const derived = Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    // Constant-time comparison
    if (derived.length !== MASTER_HASH.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) {
      diff |= derived.charCodeAt(i) ^ MASTER_HASH.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
// ────────────────────────────────────────────────────────────────────────────
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  UserProgressData,
  defaultUserProgress,
  subscribeToUserProgress,
  toggleDocPageRead,
  saveQuizStateToFirestore,
  saveDSAProgressToFirestore,
  unlockPremiumInFirestore,
  revokePremiumInFirestore,
  ensureUserDocExists,
  resetAllQuizProgressInFirestore,
  QuizStateItem,
} from '../services/userProgressService';

interface UserProgressContextType {
  currentUser: User | null;
  progress: UserProgressData;
  isLoading: boolean;
  isPremium: boolean;
  isPageRead: (pagePath: string) => boolean;
  togglePageRead: (pagePath: string) => Promise<void>;
  saveQuiz: (
    quizKey: string,
    quizState: QuizStateItem,
    answeredDelta?: number,
    correctDelta?: number
  ) => Promise<void>;
  saveDSA: (solved: string[], starred: string[]) => Promise<void>;
  unlockPremium: (key: string) => Promise<boolean>;
  revokePremium: () => Promise<void>;
  resetQuizProgress: () => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType>({
  currentUser: null,
  progress: defaultUserProgress,
  isLoading: true,
  isPremium: false,
  isPageRead: () => false,
  togglePageRead: async () => {},
  saveQuiz: async () => {},
  saveDSA: async () => {},
  unlockPremium: async () => false,
  revokePremium: async () => {},
  resetQuizProgress: async () => {},
});

const getStorageKey = (uid?: string | null) => `user_progress_cache_${uid || 'guest'}`;

function loadCachedProgress(uid?: string | null): UserProgressData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedProgress(data: UserProgressData) {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(data.uid);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save progress to localStorage:', err);
  }
}

function mergeQuizProgress(localData: UserProgressData, remoteData: UserProgressData): UserProgressData {
  const mergedQuizStates = { ...localData.quizStats?.quizStates, ...remoteData.quizStats?.quizStates };

  Object.keys({ ...localData.quizStats?.quizStates, ...remoteData.quizStats?.quizStates }).forEach((key) => {
    const localState = localData.quizStats?.quizStates?.[key];
    const remoteState = remoteData.quizStats?.quizStates?.[key];

    const localCount = Object.keys(localState?.userAnswers || {}).length;
    const remoteCount = Object.keys(remoteState?.userAnswers || {}).length;

    if (localCount >= remoteCount && localState) {
      mergedQuizStates[key] = localState;
    } else if (remoteState) {
      mergedQuizStates[key] = remoteState;
    }
  });

  const totalAnswered = Object.values(mergedQuizStates).reduce(
    (acc, st) => acc + Object.keys(st.userAnswers || {}).length,
    0
  );

  return {
    ...remoteData,
    isPremium: remoteData.isPremium || localData.isPremium,
    readPages: Array.from(new Set([...(localData.readPages || []), ...(remoteData.readPages || [])])),
    quizStats: {
      totalQuestionsAnswered: Math.max(totalAnswered, remoteData.quizStats?.totalQuestionsAnswered || 0),
      totalCorrectAnswers: Math.max(localData.quizStats?.totalCorrectAnswers || 0, remoteData.quizStats?.totalCorrectAnswers || 0),
      quizStates: mergedQuizStates,
    },
  };
}

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [progress, setProgressState] = useState<UserProgressData>(() => {
    const cached = loadCachedProgress();
    return cached || defaultUserProgress;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setProgress = (updater: React.SetStateAction<UserProgressData>) => {
    setProgressState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveCachedProgress(next);
      return next;
    });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Load local cached progress for this user immediately upon login
        const cachedUserProgress = loadCachedProgress(user.uid);
        if (cachedUserProgress) {
          setProgressState((prev) => mergeQuizProgress(prev, cachedUserProgress));
        }

        ensureUserDocExists(user).catch((err) => {
          console.error('Failed auto-syncing user doc on login:', err);
        });
      } else {
        const guestCache = loadCachedProgress('guest');
        setProgressState(guestCache || defaultUserProgress);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const unsubscribeDoc = subscribeToUserProgress(currentUser.uid, (remoteData) => {
      setProgressState((localPrev) => {
        const merged = mergeQuizProgress(localPrev, remoteData);
        saveCachedProgress(merged);
        return merged;
      });
      setIsLoading(false);
    });

    return () => unsubscribeDoc();
  }, [currentUser]);

  const isPageRead = (pagePath: string): boolean => {
    return progress.readPages.includes(pagePath);
  };

  const togglePageRead = async (pagePath: string): Promise<void> => {
    if (!currentUser) {
      // Fallback local update if not logged in
      const exists = progress.readPages.includes(pagePath);
      const updated = exists
        ? progress.readPages.filter((p) => p !== pagePath)
        : [...progress.readPages, pagePath];
      setProgress((prev) => ({ ...prev, readPages: updated }));
      return;
    }
    const isReadNow = !isPageRead(pagePath);
    await toggleDocPageRead(currentUser.uid, pagePath, isReadNow);
  };

  const saveQuiz = async (
    quizKey: string,
    quizState: QuizStateItem,
    answeredDelta: number = 0,
    correctDelta: number = 0
  ): Promise<void> => {
    // Update local React state immediately for instant UI update
    setProgress((prev) => {
      const prevStats = prev.quizStats || { totalQuestionsAnswered: 0, totalCorrectAnswers: 0, quizStates: {} };
      return {
        ...prev,
        quizStats: {
          totalQuestionsAnswered: (prevStats.totalQuestionsAnswered || 0) + answeredDelta,
          totalCorrectAnswers: (prevStats.totalCorrectAnswers || 0) + correctDelta,
          quizStates: {
            ...prevStats.quizStates,
            [quizKey]: quizState,
          },
        },
      };
    });

    if (currentUser) {
      saveQuizStateToFirestore(
        currentUser.uid,
        quizKey,
        quizState,
        answeredDelta,
        correctDelta
      ).catch((err) => {
        console.error('Background Firestore quiz save error:', err);
      });
    }
  };

  const isPremiumUnlocked = !!progress.isPremium;

  const unlockPremium = async (inputKey: string): Promise<boolean> => {
    if (!inputKey || !inputKey.trim()) return false;

    const valid = await verifyMasterKey(inputKey);
    if (!valid) return false;

    setProgress((prev) => ({ ...prev, isPremium: true }));

    if (currentUser) {
      // Non-blocking background sync to Firestore
      unlockPremiumInFirestore(currentUser.uid, currentUser.email, currentUser.displayName).catch((err) => {
        console.error('Background Firestore sync error:', err);
      });
    }
    return true;
  };

  const revokePremium = async (): Promise<void> => {
    setProgress((prev) => ({ ...prev, isPremium: false }));
    if (currentUser) {
      await revokePremiumInFirestore(currentUser.uid);
    }
  };

  const resetQuizProgress = async (): Promise<void> => {
    setProgress((prev) => ({
      ...prev,
      quizStats: {
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        quizStates: {},
      },
    }));

    if (currentUser) {
      resetAllQuizProgressInFirestore(currentUser.uid).catch((err) => {
        console.error('Background Firestore reset error:', err);
      });
    }
  };

  const saveDSA = async (solved: string[], starred: string[]): Promise<void> => {
    if (!currentUser) {
      setProgress((prev) => ({
        ...prev,
        dsaProgress: { solvedProblems: solved, starredProblems: starred },
      }));
      return;
    }
    await saveDSAProgressToFirestore(currentUser.uid, solved, starred);
  };

  return (
    <UserProgressContext.Provider
      value={{
        currentUser,
        progress,
        isLoading,
        isPremium: isPremiumUnlocked,
        isPageRead,
        togglePageRead,
        saveQuiz,
        saveDSA,
        unlockPremium,
        revokePremium,
        resetQuizProgress,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => useContext(UserProgressContext);
