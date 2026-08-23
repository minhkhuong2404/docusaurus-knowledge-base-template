import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from 'firebase/auth';

export interface QuizStateItem {
  date: string;
  totalQuestions?: number;
  answeredQuestionIds?: string[];
  userAnswers: Record<string, number>;
  skippedIds: string[];
  shuffledIds: string[];
  currentIndex: number;
  isCompleted?: boolean;
}

export interface GamificationState {
  exp: number;
  level: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // YYYY-MM-DD
    shieldsRemaining: number;
    activeDates: string[]; // Set of YYYY-MM-DD
  };
  unlockedAchievements: string[];
  dailyQuests: {
    date: string;
    completedQuestIds: string[];
    claimedBonus: boolean;
    dailyCounts: {
      readPagesCount: number;
      quizAnsweredCount: number;
      dsaSolvedCount: number;
      gamesPlayedCount: number;
    };
  };
  miniGameScores?: Record<string, number>;
}

export const defaultGamificationState: GamificationState = {
  exp: 0,
  level: 1,
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    shieldsRemaining: 3,
    activeDates: [],
  },
  unlockedAchievements: [],
  dailyQuests: {
    date: '',
    completedQuestIds: [],
    claimedBonus: false,
    dailyCounts: {
      readPagesCount: 0,
      quizAnsweredCount: 0,
      dsaSolvedCount: 0,
      gamesPlayedCount: 0,
    },
  },
  miniGameScores: {},
};

export interface UserProgressData {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isPremium?: boolean;
  readPages: string[];
  quizStats: {
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    quizStates: Record<string, QuizStateItem>;
  };
  dsaProgress: {
    solvedProblems: string[];
    starredProblems: string[];
  };
  gamification?: GamificationState;
  updatedAt?: any;
}

export const defaultUserProgress: UserProgressData = {
  uid: '',
  isPremium: false,
  readPages: [],
  quizStats: {
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    quizStates: {},
  },
  dsaProgress: {
    solvedProblems: [],
    starredProblems: [],
  },
  gamification: defaultGamificationState,
};

/**
 * Subscribe to real-time Cloud Firestore updates for a given user UID
 */
export function subscribeToUserProgress(
  uid: string,
  onUpdate: (data: UserProgressData) => void
) {
  if (!uid) return () => {};

  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data() as Partial<UserProgressData>;
        onUpdate({
          uid,
          email: raw.email || '',
          displayName: raw.displayName || '',
          photoURL: raw.photoURL || '',
          isPremium: !!raw.isPremium,
          readPages: Array.isArray(raw.readPages) ? raw.readPages : [],
          quizStats: {
            totalQuestionsAnswered: raw.quizStats?.totalQuestionsAnswered || 0,
            totalCorrectAnswers: raw.quizStats?.totalCorrectAnswers || 0,
            quizStates: raw.quizStats?.quizStates || {},
          },
          dsaProgress: {
            solvedProblems: Array.isArray(raw.dsaProgress?.solvedProblems)
              ? raw.dsaProgress!.solvedProblems
              : [],
            starredProblems: Array.isArray(raw.dsaProgress?.starredProblems)
              ? raw.dsaProgress!.starredProblems
              : [],
          },
          gamification: {
            exp: raw.gamification?.exp || 0,
            level: raw.gamification?.level || 1,
            streak: {
              currentStreak: raw.gamification?.streak?.currentStreak || 0,
              longestStreak: raw.gamification?.streak?.longestStreak || 0,
              lastActiveDate: raw.gamification?.streak?.lastActiveDate || '',
              shieldsRemaining: raw.gamification?.streak?.shieldsRemaining ?? 1,
              activeDates: Array.isArray(raw.gamification?.streak?.activeDates) ? raw.gamification!.streak.activeDates : [],
            },
            unlockedAchievements: Array.isArray(raw.gamification?.unlockedAchievements) ? raw.gamification!.unlockedAchievements : [],
            dailyQuests: {
              date: raw.gamification?.dailyQuests?.date || '',
              completedQuestIds: Array.isArray(raw.gamification?.dailyQuests?.completedQuestIds) ? raw.gamification!.dailyQuests.completedQuestIds : [],
              claimedBonus: !!raw.gamification?.dailyQuests?.claimedBonus,
              dailyCounts: {
                readPagesCount: raw.gamification?.dailyQuests?.dailyCounts?.readPagesCount || 0,
                quizAnsweredCount: raw.gamification?.dailyQuests?.dailyCounts?.quizAnsweredCount || 0,
                dsaSolvedCount: raw.gamification?.dailyQuests?.dailyCounts?.dsaSolvedCount || 0,
                gamesPlayedCount: raw.gamification?.dailyQuests?.dailyCounts?.gamesPlayedCount || 0,
              },
            },
            miniGameScores: raw.gamification?.miniGameScores || {},
          },
        });
      } else {
        // Initialize doc in Firestore for new user
        const initialDoc: UserProgressData = {
          ...defaultUserProgress,
          uid,
        };
        onUpdate(initialDoc);
        setDoc(userDocRef, {
          ...initialDoc,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch((err) => {
          console.error('Error auto-creating new user doc in Firestore:', err);
        });
      }
    },
    (error) => {
      console.error('Error listening to Cloud Firestore progress:', error);
    }
  );
}

/**
 * Toggle doc page read status in Firestore
 */
export async function toggleDocPageRead(uid: string, pagePath: string, isReadNow: boolean) {
  if (!uid || !pagePath) return;

  const userDocRef = doc(db, 'users', uid);
  try {
    await updateDoc(userDocRef, {
      readPages: isReadNow ? arrayUnion(pagePath) : arrayRemove(pagePath),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    try {
      await setDoc(
        userDocRef,
        {
          readPages: isReadNow ? [pagePath] : [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fallbackErr) {
      console.error('Failed to update readPages in Firestore:', fallbackErr);
    }
  }
}

/**
 * Save Quiz state & stats in Firestore
 */
export async function saveQuizStateToFirestore(
  uid: string,
  quizKey: string,
  quizState: QuizStateItem,
  answeredDelta: number = 0,
  correctDelta: number = 0
) {
  if (!uid || !quizKey) return;

  const userDocRef = doc(db, 'users', uid);
  try {
    const updateObj: any = {
      [`quizStats.quizStates.${quizKey}`]: quizState,
      updatedAt: serverTimestamp(),
    };

    if (answeredDelta > 0) {
      updateObj['quizStats.totalQuestionsAnswered'] = increment(answeredDelta);
    }
    if (correctDelta > 0) {
      updateObj['quizStats.totalCorrectAnswers'] = increment(correctDelta);
    }

    await updateDoc(userDocRef, updateObj);
  } catch (err) {
    try {
      await setDoc(
        userDocRef,
        {
          quizStats: {
            quizStates: {
              [quizKey]: quizState,
            },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (fallbackErr) {
      console.error('Failed to save quiz state to Firestore:', fallbackErr);
    }
  }
}

/**
 * Save DSA progress in Firestore
 */
export async function saveDSAProgressToFirestore(
  uid: string,
  solvedProblems: string[],
  starredProblems: string[]
) {
  if (!uid) return;

  const userDocRef = doc(db, 'users', uid);
  try {
    await setDoc(
      userDocRef,
      {
        dsaProgress: {
          solvedProblems,
          starredProblems,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to save DSA progress to Firestore:', err);
  }
}

/**
 * Unlock Premium status for user in Firestore
 */
export async function unlockPremiumInFirestore(
  uid: string,
  email?: string | null,
  displayName?: string | null
) {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  try {
    const payload: Record<string, any> = {
      isPremium: true,
      updatedAt: serverTimestamp(),
    };
    if (email) payload.email = email;
    if (displayName) payload.displayName = displayName;

    await setDoc(userDocRef, payload, { merge: true });
  } catch (err) {
    console.error('Failed to unlock premium in Firestore:', err);
  }
}

/**
 * Revoke Premium status for user in Firestore
 */
export async function revokePremiumInFirestore(uid: string) {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  try {
    await setDoc(
      userDocRef,
      { isPremium: false, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to revoke premium in Firestore:', err);
  }
}

/**
 * Ensure user metadata is saved to Cloud Firestore when first logged in
 */
export async function ensureUserDocExists(user: User) {
  if (!user || !user.uid) return;
  const userDocRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        isPremium: false,
        readPages: [],
        quizStats: {
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          quizStates: {},
        },
        dsaProgress: {
          solvedProblems: [],
          starredProblems: [],
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userDocRef,
        {
          ...(user.email ? { email: user.email } : {}),
          ...(user.displayName ? { displayName: user.displayName } : {}),
          ...(user.photoURL ? { photoURL: user.photoURL } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error('Failed to ensure user doc in Firestore:', err);
  }
}

/**
 * Reset all quiz progress for a user in Cloud Firestore
 */
export async function resetAllQuizProgressInFirestore(uid: string) {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  try {
    await setDoc(
      userDocRef,
      {
        quizStats: {
          totalQuestionsAnswered: 0,
          totalCorrectAnswers: 0,
          quizStates: {},
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to reset quiz progress in Firestore:', err);
  }
}

/**
 * Save Gamification state to Firestore
 */
export async function saveGamificationToFirestore(
  uid: string,
  gamification: GamificationState
) {
  if (!uid) return;
  const userDocRef = doc(db, 'users', uid);
  try {
    await setDoc(
      userDocRef,
      {
        gamification,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to save gamification to Firestore:', err);
  }
}
