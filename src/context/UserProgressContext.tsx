import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';

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
  defaultGamificationState,
  GamificationState,
  subscribeToUserProgress,
  toggleDocPageRead,
  saveQuizStateToFirestore,
  saveDSAProgressToFirestore,
  unlockPremiumInFirestore,
  revokePremiumInFirestore,
  ensureUserDocExists,
  resetAllQuizProgressInFirestore,
  saveGamificationToFirestore,
  QuizStateItem,
} from '../services/userProgressService';
import { isTrackableArticle, TOTAL_TRACKABLE_ARTICLES_DEFAULT } from '../utils/trackablePages';
import {
  getAdminEmails,
  saveAdminEmail,
  removeAdminEmail as deleteAdminEmail,
  checkIsAdmin,
  isSuperAdminUser,
  subscribeToAdminEmails,
} from '../config/adminConfig';
import {
  getLevelFromExp,
  getExpProgressInCurrentLevel,
  ACHIEVEMENTS,
  getTodayDateString,
  getQuestsForDate,
  AchievementDef,
} from '../data/gamificationData';
import { triggerFireworks } from '../utils/fireworks';

export interface GamificationToast {
  id: number;
  type: 'levelup' | 'achievement' | 'quest' | 'streak';
  title: string;
  subtitle: string;
  icon: string;
  exp?: number;
}

interface UserProgressContextType {
  currentUser: User | null;
  progress: UserProgressData;
  isLoading: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminEmails: string[];
  addAdminEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  removeAdminEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  totalArticlesCount: number;
  setTotalArticlesCount: (count: number) => void;
  isPageRead: (pagePath: string) => boolean;
  togglePageRead: (pagePath: string) => Promise<void>;
  markPageAsRead: (pagePath: string) => Promise<void>;
  isManuallyUnmarked: (pagePath: string) => boolean;
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

  // 🎮 Gamification APIs
  gamification: GamificationState;
  addExp: (amount: number, reason?: string) => void;
  boostToGodLevel: () => void;
  recordActivity: (type: 'read_article' | 'quiz_answer' | 'solve_dsa' | 'play_game', count?: number) => void;
  unlockAchievement: (achievementId: string) => void;
  claimQuestBonus: () => void;
  saveMiniGameScore: (gameId: string, score: number) => void;
  toast: GamificationToast | null;
  dismissToast: () => void;
}

const UserProgressContext = createContext<UserProgressContextType>({
  currentUser: null,
  progress: defaultUserProgress,
  isLoading: true,
  isPremium: false,
  isAdmin: false,
  isSuperAdmin: false,
  adminEmails: [],
  addAdminEmail: async () => ({ success: false, message: '' }),
  removeAdminEmail: async () => ({ success: false, message: '' }),
  totalArticlesCount: TOTAL_TRACKABLE_ARTICLES_DEFAULT,
  setTotalArticlesCount: () => {},
  isPageRead: () => false,
  togglePageRead: async () => {},
  markPageAsRead: async () => {},
  isManuallyUnmarked: () => false,
  saveQuiz: async () => {},
  saveDSA: async () => {},
  unlockPremium: async () => false,
  revokePremium: async () => {},
  resetQuizProgress: async () => {},

  gamification: defaultGamificationState,
  addExp: () => {},
  boostToGodLevel: () => {},
  recordActivity: () => {},
  unlockAchievement: () => {},
  claimQuestBonus: () => {},
  saveMiniGameScore: () => {},
  toast: null,
  dismissToast: () => {},
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

export function normalizePagePath(rawPath?: string | null): string {
  if (!rawPath) return '';
  let p = rawPath.trim();
  p = p.split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) {
    p = p.replace(/\/+$/, '');
  }
  return p;
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

  // Merge gamification safely
  const localGame = localData.gamification || defaultGamificationState;
  const remoteGame = remoteData.gamification || defaultGamificationState;
  const higherExp = Math.max(localGame.exp || 0, remoteGame.exp || 0);
  const currentStreak = Math.max(localGame.streak?.currentStreak || 0, remoteGame.streak?.currentStreak || 0);
  const longestStreak = Math.max(localGame.streak?.longestStreak || 0, remoteGame.streak?.longestStreak || 0, currentStreak);

  const mergedAchievements = Array.from(
    new Set([...(localGame.unlockedAchievements || []), ...(remoteGame.unlockedAchievements || [])])
  );

  const mergedActiveDates = Array.from(
    new Set([...(localGame.streak?.activeDates || []), ...(remoteGame.streak?.activeDates || [])])
  );

  const mergedMiniGameScores = {
    ...(localGame.miniGameScores || {}),
    ...(remoteGame.miniGameScores || {}),
  };
  Object.keys(localGame.miniGameScores || {}).forEach((k) => {
    mergedMiniGameScores[k] = Math.max(localGame.miniGameScores?.[k] || 0, remoteGame.miniGameScores?.[k] || 0);
  });

  const combinedPages = [...(localData.readPages || []), ...(remoteData.readPages || [])]
    .map(normalizePagePath)
    .filter(Boolean);

  return {
    ...remoteData,
    isPremium: remoteData.isPremium || localData.isPremium,
    readPages: Array.from(new Set(combinedPages)),
    quizStats: {
      totalQuestionsAnswered: Math.max(totalAnswered, remoteData.quizStats?.totalQuestionsAnswered || 0),
      totalCorrectAnswers: Math.max(localData.quizStats?.totalCorrectAnswers || 0, remoteData.quizStats?.totalCorrectAnswers || 0),
      quizStates: mergedQuizStates,
    },
    gamification: {
      exp: higherExp,
      level: getLevelFromExp(higherExp),
      streak: {
        currentStreak,
        longestStreak,
        lastActiveDate: remoteGame.streak?.lastActiveDate || localGame.streak?.lastActiveDate || '',
        shieldsRemaining: remoteGame.streak?.shieldsRemaining ?? localGame.streak?.shieldsRemaining ?? 1,
        activeDates: mergedActiveDates,
      },
      unlockedAchievements: mergedAchievements,
      dailyQuests: remoteGame.dailyQuests?.date === getTodayDateString() ? remoteGame.dailyQuests : localGame.dailyQuests,
      miniGameScores: mergedMiniGameScores,
    },
  };
}

import { startPresenceTracker } from '../services/presenceService';
import { evaluateLeaderboardStandings } from '../services/leaderboardRewardService';

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminEmails, setAdminEmails] = useState<string[]>(() => getAdminEmails());
  const [toast, setToast] = useState<GamificationToast | null>(null);

  const isSuperAdmin = useMemo(() => {
    if (!currentUser?.email) return false;
    return isSuperAdminUser(currentUser.email);
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    if (!currentUser?.email) return false;
    return checkIsAdmin(currentUser.email, adminEmails);
  }, [currentUser, adminEmails]);

  useEffect(() => {
    const unsubscribe = subscribeToAdminEmails((latestEmails) => {
      setAdminEmails(latestEmails);
    });
    return () => unsubscribe();
  }, []);

  const addAdminEmail = async (email: string) => {
    const res = await saveAdminEmail(email, currentUser?.email);
    if (res.success) {
      setAdminEmails(res.updatedList);
    }
    return res;
  };

  const removeAdminEmail = async (email: string) => {
    const res = await deleteAdminEmail(email, currentUser?.email);
    if (res.success) {
      setAdminEmails(res.updatedList);
    }
    return res;
  };

  const [progress, setProgressState] = useState<UserProgressData>(() => {
    const cached = loadCachedProgress();
    return cached || defaultUserProgress;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalArticlesCount, setTotalArticlesCountState] = useState<number>(() => {
    if (typeof window === 'undefined') return TOTAL_TRACKABLE_ARTICLES_DEFAULT;
    try {
      const saved = localStorage.getItem('total_articles_count');
      const parsed = saved ? parseInt(saved, 10) : 0;
      if (parsed > 0 && parsed <= 2000) {
        return parsed;
      }
      return TOTAL_TRACKABLE_ARTICLES_DEFAULT;
    } catch {
      return TOTAL_TRACKABLE_ARTICLES_DEFAULT;
    }
  });

  const setTotalArticlesCount = useCallback((count: number) => {
    if (count > 0 && count <= 2000) {
      setTotalArticlesCountState((prev) => {
        if (prev === count) return prev;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('total_articles_count', count.toString());
          } catch {
            // Ignore localStorage errors
          }
        }
        return count;
      });
    }
  }, []);

  const setProgress = useCallback((updater: React.SetStateAction<UserProgressData>) => {
    setProgressState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveCachedProgress(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((t: Omit<GamificationToast, 'id'>) => {
    setToast({
      ...t,
      id: Date.now(),
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 🎮 Gamification Engine Functions
  // ──────────────────────────────────────────────────────────────────────────

  const checkAchievementsWithData = useCallback((data: UserProgressData, customUnlockId?: string) => {
    const game = data.gamification || defaultGamificationState;
    const currentUnlocked = new Set(game.unlockedAchievements || []);
    const newlyUnlocked: AchievementDef[] = [];

    const readCount = (data.readPages || []).filter(isTrackableArticle).length;
    const quizCorrect = data.quizStats?.totalCorrectAnswers || 0;
    const dsaSolved = (data.dsaProgress?.solvedProblems || []).length;
    const streakDays = game.streak?.currentStreak || 0;

    ACHIEVEMENTS.forEach((ach) => {
      if (currentUnlocked.has(ach.id)) return;

      let qualified = false;
      if (ach.metric === 'read_pages' && readCount >= ach.targetCount) qualified = true;
      if (ach.metric === 'quiz_correct' && quizCorrect >= ach.targetCount) qualified = true;
      if (ach.metric === 'dsa_solved' && dsaSolved >= ach.targetCount) qualified = true;
      if (ach.metric === 'streak_days' && streakDays >= ach.targetCount) qualified = true;
      if (ach.metric === 'special' && customUnlockId === ach.id) qualified = true;
      if (ach.metric === 'topic_completed' && ach.topicPrefix) {
        const countInTopic = (data.readPages || []).filter((p) =>
          p.toLowerCase().includes(ach.topicPrefix!.toLowerCase())
        ).length;
        if (countInTopic >= ach.targetCount) qualified = true;
      }

      if (qualified) {
        newlyUnlocked.push(ach);
        currentUnlocked.add(ach.id);
      }
    });

    if (newlyUnlocked.length > 0) {
      let totalBonusExp = 0;
      newlyUnlocked.forEach((unlocked) => {
        totalBonusExp += unlocked.expReward;
        showToast({
          type: 'achievement',
          title: `🏆 Trophy Unlocked: ${unlocked.title}`,
          subtitle: unlocked.description,
          icon: unlocked.icon,
          exp: unlocked.expReward,
        });
      });
      triggerFireworks(4000);

      const nextExp = (game.exp || 0) + totalBonusExp;
      const nextLevel = getLevelFromExp(nextExp);
      const updatedGamification: GamificationState = {
        ...game,
        exp: nextExp,
        level: nextLevel,
        unlockedAchievements: Array.from(currentUnlocked),
      };

      setProgress((prev) => ({
        ...prev,
        gamification: updatedGamification,
      }));

      if (currentUser) {
        saveGamificationToFirestore(currentUser.uid, updatedGamification).catch(console.error);
      }
    }
  }, [currentUser, setProgress, showToast]);

  const addExp = useCallback((amount: number, reason?: string) => {
    if (amount <= 0) return;

    setProgress((prev) => {
      const game = prev.gamification || defaultGamificationState;
      const prevExp = game.exp || 0;
      const prevLevel = game.level || 1;
      const newExp = prevExp + amount;
      const newLevel = getLevelFromExp(newExp);

      if (newLevel > prevLevel) {
        showToast({
          type: 'levelup',
          title: `⚡ Level Up! Reached Level ${newLevel}`,
          subtitle: `Congratulations! Your cosmic engineer rank has elevated.`,
          icon: '🚀',
          exp: amount,
        });
        triggerFireworks(5000);
      } else if (reason) {
        // Subtle toast or mini notification
      }

      const updatedGamification: GamificationState = {
        ...game,
        exp: newExp,
        level: newLevel,
      };

      if (currentUser) {
        saveGamificationToFirestore(currentUser.uid, updatedGamification).catch(console.error);
      }

      const nextData: UserProgressData = {
        ...prev,
        gamification: updatedGamification,
      };

      setTimeout(() => {
        checkAchievementsWithData(nextData);
      }, 100);

      return nextData;
    });
  }, [currentUser, setProgress, showToast, checkAchievementsWithData]);

  const boostToGodLevel = useCallback(() => {
    const godExp = 250000; // Level 185 (Super Level God Trophy)
    const godLevel = getLevelFromExp(godExp);
    const allAchievementIds = ACHIEVEMENTS.map((a) => a.id);
    const today = getTodayDateString();

    const dailyQuestsDefs = getQuestsForDate(today);
    const godGamification: GamificationState = {
      exp: godExp,
      level: godLevel,
      streak: {
        currentStreak: 365,
        longestStreak: 365,
        lastActiveDate: today,
        shieldsRemaining: 3,
        activeDates: [today],
      },
      unlockedAchievements: allAchievementIds,
      dailyQuests: {
        date: today,
        completedQuestIds: dailyQuestsDefs.map((q) => q.id),
        claimedBonus: true,
        dailyCounts: {
          readPagesCount: 10,
          quizAnsweredCount: 10,
          dsaSolvedCount: 5,
          gamesPlayedCount: 5,
        },
      },
      miniGameScores: {
        'outage-boss': 9999,
        'flashcard-arena': 9999,
        'spot-bug-duel': 9999,
      },
    };

    setProgress((prev) => {
      const next: UserProgressData = {
        ...prev,
        gamification: godGamification,
      };
      saveCachedProgress(next);
      return next;
    });

    if (currentUser) {
      saveGamificationToFirestore(currentUser.uid, godGamification).catch(console.error);
    }

    showToast({
      type: 'levelup',
      title: `⚡ SUPER GOD ACTIVATED: Level ${godLevel}`,
      subtitle: 'Elevated to Super God Celestial Masterpiece with 250,000 EXP & all achievements unlocked!',
      icon: '👑',
      exp: godExp,
    });
    triggerFireworks(6000);
  }, [currentUser, setProgress, showToast]);

  // Auto-elevate Super Admin to the Highest Super God Level
  useEffect(() => {
    if (isSuperAdmin && (progress.gamification?.level || 1) < 121) {
      boostToGodLevel();
    }
  }, [isSuperAdmin, progress.gamification?.level, boostToGodLevel]);

  const recordActivity = useCallback((type: 'read_article' | 'quiz_answer' | 'solve_dsa' | 'play_game', count: number = 1) => {
    const today = getTodayDateString();

    setProgress((prev) => {
      const game = prev.gamification || defaultGamificationState;
      const streak = game.streak || defaultGamificationState.streak;
      const lastActive = streak.lastActiveDate;

      let nextStreakCount = streak.currentStreak;
      let nextShields = streak.shieldsRemaining;

      if (!lastActive) {
        nextStreakCount = 1;
      } else if (lastActive === today) {
        // Already active today, streak intact
      } else {
        // Calculate days difference
        const prevDate = new Date(lastActive);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          nextStreakCount += 1;
          // Award extra shield for every 3 days of continuous learning (recovers streak if missed)
          if (nextStreakCount % 3 === 0) {
            nextShields = Math.min(3, nextShields + 1);
            showToast({
              type: 'streak',
              title: `🛡️ Extra Shield Earned! (${nextShields}/3)`,
              subtitle: `3 days of continuous learning! You have ${nextShields} shield(s) to protect your streak.`,
              icon: '🛡️',
            });
          }
          showToast({
            type: 'streak',
            title: `🔥 Daily Streak: ${nextStreakCount} Days!`,
            subtitle: `Keep the fire burning! Continuous learning multiplier active.`,
            icon: '🔥',
            exp: 20 * Math.min(3, 1 + nextStreakCount * 0.1),
          });
        } else if (diffDays > 1) {
          if (nextShields > 0) {
            // Protected by oxygen shield freeze!
            nextShields -= 1;
            nextStreakCount += 1;
            showToast({
              type: 'streak',
              title: `🛡️ Oxygen Shield Activated!`,
              subtitle: `Your streak was protected from resetting. ${nextShields} shields remaining.`,
              icon: '🛡️',
            });
          } else {
            nextStreakCount = 1;
          }
        }
      }

      const activeDates = Array.from(new Set([...(streak.activeDates || []), today]));
      const longestStreak = Math.max(streak.longestStreak || 0, nextStreakCount);

      // Update daily quests
      const quests = game.dailyQuests?.date === today
        ? game.dailyQuests
        : {
            date: today,
            completedQuestIds: [],
            claimedBonus: false,
            dailyCounts: {
              readPagesCount: 0,
              quizAnsweredCount: 0,
              dsaSolvedCount: 0,
              gamesPlayedCount: 0,
            },
          };

      const dailyCounts = { ...quests.dailyCounts };
      if (type === 'read_article') dailyCounts.readPagesCount += count;
      if (type === 'quiz_answer') dailyCounts.quizAnsweredCount += count;
      if (type === 'solve_dsa') dailyCounts.dsaSolvedCount += count;
      if (type === 'play_game') dailyCounts.gamesPlayedCount += count;

      // Check quest completions
      const activeDailyQuests = getQuestsForDate(today);
      const completedSet = new Set(quests.completedQuestIds || []);
      let questBonusExp = 0;

      activeDailyQuests.forEach((q) => {
        if (completedSet.has(q.id)) return;
        let isDone = false;
        if (q.type === 'read_article' && dailyCounts.readPagesCount >= q.target) isDone = true;
        if (q.type === 'quiz_answer' && dailyCounts.quizAnsweredCount >= q.target) isDone = true;
        if (q.type === 'solve_dsa' && dailyCounts.dsaSolvedCount >= q.target) isDone = true;
        if (q.type === 'play_game' && dailyCounts.gamesPlayedCount >= q.target) isDone = true;

        if (isDone) {
          completedSet.add(q.id);
          questBonusExp += q.expReward;
          showToast({
            type: 'quest',
            title: `🎯 Quest Complete: ${q.title}`,
            subtitle: `+${q.expReward} EXP claimed for daily mission!`,
            icon: q.icon,
            exp: q.expReward,
          });
        }
      });

      const nextExp = (game.exp || 0) + questBonusExp;
      const nextLevel = getLevelFromExp(nextExp);

      const updatedGamification: GamificationState = {
        ...game,
        exp: nextExp,
        level: nextLevel,
        streak: {
          currentStreak: nextStreakCount,
          longestStreak,
          lastActiveDate: today,
          shieldsRemaining: nextShields,
          activeDates,
        },
        dailyQuests: {
          date: today,
          completedQuestIds: Array.from(completedSet),
          claimedBonus: quests.claimedBonus,
          dailyCounts,
        },
      };

      if (currentUser) {
        saveGamificationToFirestore(currentUser.uid, updatedGamification).catch(console.error);
      }

      const nextData: UserProgressData = {
        ...prev,
        gamification: updatedGamification,
      };

      setTimeout(() => {
        checkAchievementsWithData(nextData);
      }, 100);

      return nextData;
    });
  }, [currentUser, setProgress, showToast, checkAchievementsWithData]);

  const unlockAchievement = useCallback((achievementId: string) => {
    checkAchievementsWithData(progress, achievementId);
  }, [checkAchievementsWithData, progress]);

  const claimQuestBonus = useCallback(() => {
    const today = getTodayDateString();
    const game = progress.gamification || defaultGamificationState;
    const quests = game.dailyQuests;
    const dailyQuests = getQuestsForDate(today);
    const completedSet = new Set(quests?.completedQuestIds || []);
    const isAllQuestsCompleted = dailyQuests.every((q) => completedSet.has(q.id)) || (completedSet.size >= dailyQuests.length && dailyQuests.length > 0);

    if (quests?.date === today && !quests.claimedBonus && isAllQuestsCompleted) {
      const bonusExp = 150;
      addExp(bonusExp, 'Daily Mission Control 3/3 Bounty Box');
      showToast({
        type: 'quest',
        title: '🎁 Supernova Bounty Box Opened!',
        subtitle: 'You completed all 3 daily missions! +150 EXP and cosmic glory.',
        icon: '🎁',
        exp: bonusExp,
      });
      triggerFireworks(5000);

      setProgress((prev) => {
        const nextGame: GamificationState = {
          ...(prev.gamification || defaultGamificationState),
          dailyQuests: {
            ...((prev.gamification || defaultGamificationState).dailyQuests),
            date: today,
            completedQuestIds: Array.from(completedSet),
            dailyCounts: quests.dailyCounts,
            claimedBonus: true,
          },
        };
        if (currentUser) {
          saveGamificationToFirestore(currentUser.uid, nextGame).catch(console.error);
        }
        return {
          ...prev,
          gamification: nextGame,
        };
      });
    }
  }, [progress, addExp, showToast, setProgress, currentUser]);

  const saveMiniGameScore = useCallback((gameId: string, score: number) => {
    setProgress((prev) => {
      const game = prev.gamification || defaultGamificationState;
      const prevScore = game.miniGameScores?.[gameId] || 0;
      const newHighScore = Math.max(prevScore, score);

      const updatedScores = {
        ...(game.miniGameScores || {}),
        [gameId]: newHighScore,
      };

      const nextGame: GamificationState = {
        ...game,
        miniGameScores: updatedScores,
      };

      if (currentUser) {
        saveGamificationToFirestore(currentUser.uid, nextGame).catch(console.error);
      }

      return {
        ...prev,
        gamification: nextGame,
      };
    });

    recordActivity('play_game', 1);
  }, [setProgress, currentUser, recordActivity]);

  // ──────────────────────────────────────────────────────────────────────────
  // Firebase Auth & Doc Subscription
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
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

  // Keep EXP ref updated for heartbeat without restarting interval on every exp change
  const expRef = useRef(progress.gamification?.exp || 0);
  expRef.current = progress.gamification?.exp || 0;

  // Start Real-Time Presence Heartbeat for Active User
  useEffect(() => {
    if (!currentUser) return;
    const unsubPresence = startPresenceTracker(currentUser, () => expRef.current);
    return () => unsubPresence();
  }, [currentUser?.uid]);

  // Evaluate & Grant Concluded Weekly & Monthly Leaderboard Standings Rewards
  useEffect(() => {
    if (!currentUser || isLoading) return;

    const claimed = progress.gamification?.claimedPeriodRewards || [];
    evaluateLeaderboardStandings(currentUser.uid, currentUser.email, claimed).then((rewards) => {
      if (rewards.length === 0) return;

      let totalBonusExp = 0;
      const newClaimedKeys = [...claimed];
      const newAchievements = new Set(progress.gamification?.unlockedAchievements || []);

      rewards.forEach((r) => {
        totalBonusExp += r.expReward;
        newClaimedKeys.push(r.periodKey);
        newAchievements.add(r.achievementId);

        showToast({
          type: 'achievement',
          title: `🏆 ${r.title} (Rank #${r.rankPosition})`,
          subtitle: `Concluded ${r.periodType} in the top tier! +${r.expReward} EXP granted.`,
          icon: r.icon,
          exp: r.expReward,
        });
      });

      triggerFireworks(5000);

      setProgress((prev) => {
        const game = prev.gamification || defaultGamificationState;
        const nextExp = (game.exp || 0) + totalBonusExp;
        const nextLevel = getLevelFromExp(nextExp);

        const updatedGame: GamificationState = {
          ...game,
          exp: nextExp,
          level: nextLevel,
          unlockedAchievements: Array.from(newAchievements),
          claimedPeriodRewards: Array.from(new Set(newClaimedKeys)),
        };

        if (currentUser) {
          saveGamificationToFirestore(currentUser.uid, updatedGame).catch(console.error);
        }

        return {
          ...prev,
          gamification: updatedGame,
        };
      });
    }).catch(console.error);
  }, [currentUser, isLoading]);

  const [manuallyUnmarkedPages, setManuallyUnmarkedPages] = useState<Set<string>>(new Set());

  // Track articles read today in current session to allow re-reading to count for daily quests
  const recordArticleReadSession = (pagePath: string): boolean => {
    const today = getTodayDateString();
    const norm = normalizePagePath(pagePath);
    const sessionKey = `docusaurus_read_today_${today}_${norm}`;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        if (sessionStorage.getItem(sessionKey)) {
          return false; // Already recorded today in this session
        }
        sessionStorage.setItem(sessionKey, '1');
      }
    } catch {
      // Ignore storage errors
    }
    return true;
  };

  const isPageRead = useCallback((pagePath: string): boolean => {
    if (!pagePath) return false;
    const norm = normalizePagePath(pagePath);
    return (progress.readPages || []).some((p) => normalizePagePath(p) === norm);
  }, [progress.readPages]);

  const isManuallyUnmarked = useCallback((pagePath: string): boolean => {
    if (!pagePath) return false;
    const norm = normalizePagePath(pagePath);
    return manuallyUnmarkedPages.has(norm);
  }, [manuallyUnmarkedPages]);

  const togglePageRead = useCallback(async (pagePath: string): Promise<void> => {
    if (!pagePath) return;
    const norm = normalizePagePath(pagePath);
    const isCurrentlyRead = (progress.readPages || []).some((p) => normalizePagePath(p) === norm);
    const isReadNow = !isCurrentlyRead;

    setManuallyUnmarkedPages((prev) => {
      const next = new Set(prev);
      if (isCurrentlyRead) {
        next.add(norm);
      } else {
        next.delete(norm);
      }
      return next;
    });

    setProgress((prev) => {
      const exists = (prev.readPages || []).some((p) => normalizePagePath(p) === norm);
      const updated = exists
        ? (prev.readPages || []).filter((p) => normalizePagePath(p) !== norm)
        : [...(prev.readPages || []).filter((p) => normalizePagePath(p) !== norm), norm];
      return { ...prev, readPages: updated };
    });

    if (isReadNow) {
      addExp(25, 'Completed Article');
      recordArticleReadSession(norm);
      recordActivity('read_article', 1);
    }

    if (currentUser) {
      await toggleDocPageRead(currentUser.uid, norm, isReadNow);
    }
  }, [progress.readPages, setProgress, addExp, recordActivity, currentUser]);

  const markPageAsRead = useCallback(async (pagePath: string): Promise<void> => {
    if (!pagePath) return;
    const norm = normalizePagePath(pagePath);
    if (manuallyUnmarkedPages.has(norm)) return;

    const isAlreadyRead = (progress.readPages || []).some((p) => normalizePagePath(p) === norm);
    const isNewToday = recordArticleReadSession(norm);

    if (!isAlreadyRead) {
      setProgress((prev) => {
        if ((prev.readPages || []).some((p) => normalizePagePath(p) === norm)) return prev;
        return { ...prev, readPages: [...(prev.readPages || []).filter((p) => normalizePagePath(p) !== norm), norm] };
      });

      addExp(25, 'Completed Article');
      recordActivity('read_article', 1);

      if (currentUser) {
        await toggleDocPageRead(currentUser.uid, norm, true);
      }
    } else if (isNewToday) {
      // Re-reading an already completed article today!
      // Valid for daily quest completion (e.g. Deep Exploration & Cosmic Discovery)
      recordActivity('read_article', 1);
      addExp(10, 'Re-read Technical Article');
    }
  }, [manuallyUnmarkedPages, progress.readPages, setProgress, addExp, recordActivity, currentUser]);

  const saveQuiz = useCallback(async (
    quizKey: string,
    quizState: QuizStateItem,
    answeredDelta: number = 0,
    correctDelta: number = 0
  ): Promise<void> => {
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

    if (answeredDelta > 0) {
      recordActivity('quiz_answer', answeredDelta);
    }
    if (correctDelta > 0) {
      addExp(correctDelta * 10, 'Quiz Correct Answers');
    }

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
  }, [setProgress, recordActivity, addExp, currentUser]);

  const isPremiumUnlocked = !!progress.isPremium;

  const unlockPremium = useCallback(async (inputKey: string): Promise<boolean> => {
    if (!inputKey || !inputKey.trim()) return false;

    const valid = await verifyMasterKey(inputKey);
    if (!valid) return false;

    setProgress((prev) => ({ ...prev, isPremium: true }));

    if (currentUser) {
      unlockPremiumInFirestore(currentUser.uid, currentUser.email, currentUser.displayName).catch((err) => {
        console.error('Background Firestore sync error:', err);
      });
    }
    return true;
  }, [currentUser, setProgress]);

  const revokePremium = useCallback(async (): Promise<void> => {
    setProgress((prev) => ({ ...prev, isPremium: false }));
    if (currentUser) {
      await revokePremiumInFirestore(currentUser.uid);
    }
  }, [currentUser, setProgress]);

  const resetQuizProgress = useCallback(async (): Promise<void> => {
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
  }, [currentUser, setProgress]);

  const saveDSA = useCallback(async (solved: string[], starred: string[]): Promise<void> => {
    const prevSolved = progress.dsaProgress?.solvedProblems || [];
    const newSolvedCount = Math.max(0, solved.length - prevSolved.length);

    setProgress((prev) => ({
      ...prev,
      dsaProgress: { solvedProblems: solved, starredProblems: starred },
    }));

    if (newSolvedCount > 0) {
      addExp(newSolvedCount * 50, 'DSA Problem Solved');
      recordActivity('solve_dsa', newSolvedCount);
    } else if (solved.length > 0 && solved.length >= prevSolved.length) {
      recordActivity('solve_dsa', 1);
    }

    if (currentUser) {
      await saveDSAProgressToFirestore(currentUser.uid, solved, starred);
    }
  }, [progress.dsaProgress?.solvedProblems, setProgress, addExp, recordActivity, currentUser]);

  const gamification = progress.gamification || defaultGamificationState;

  const contextValue = useMemo(() => ({
    currentUser,
    progress,
    isLoading,
    isPremium: isPremiumUnlocked,
    isAdmin,
    isSuperAdmin,
    adminEmails,
    addAdminEmail,
    removeAdminEmail,
    totalArticlesCount,
    setTotalArticlesCount,
    isPageRead,
    togglePageRead,
    markPageAsRead,
    isManuallyUnmarked,
    saveQuiz,
    saveDSA,
    unlockPremium,
    revokePremium,
    resetQuizProgress,

    gamification,
    addExp,
    boostToGodLevel,
    recordActivity,
    unlockAchievement,
    claimQuestBonus,
    saveMiniGameScore,
    toast,
    dismissToast,
  }), [
    currentUser,
    progress,
    isLoading,
    isPremiumUnlocked,
    isAdmin,
    isSuperAdmin,
    adminEmails,
    addAdminEmail,
    removeAdminEmail,
    totalArticlesCount,
    setTotalArticlesCount,
    isPageRead,
    togglePageRead,
    markPageAsRead,
    isManuallyUnmarked,
    saveQuiz,
    saveDSA,
    unlockPremium,
    revokePremium,
    resetQuizProgress,
    gamification,
    addExp,
    boostToGodLevel,
    recordActivity,
    unlockAchievement,
    claimQuestBonus,
    saveMiniGameScore,
    toast,
    dismissToast,
  ]);

  return (
    <UserProgressContext.Provider value={contextValue}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => useContext(UserProgressContext);
