import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getRankForLevel, getExpProgressInCurrentLevel } from '../data/gamificationData';
import { UserProgressData } from './userProgressService';
import { isSuperAdminUser } from '../config/adminConfig';

export type LeaderboardTimeframe = 'alltime' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  uid: string;
  rankPosition: number;
  displayName: string;
  email?: string;
  photoURL?: string;
  level: number;
  exp: number;
  rankTitle: string;
  rankBadge: string;
  streak: number;
  quizzesCorrect: number;
  dsaSolved: number;
  readPagesCount: number;
  isOnline?: boolean;
  timeframeExp: number; // EXP scoped to the selected timeframe
}

/**
 * Calculates current ISO Week start timestamp.
 */
function getWeekStartTimestamp(): number {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

/**
 * Calculates current Month start timestamp.
 */
function getMonthStartTimestamp(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Subscribes to real-time Leaderboard rankings from Firestore.
 */
export function subscribeToLeaderboard(
  timeframe: LeaderboardTimeframe = 'alltime',
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onlineUids: Set<string> = new Set()
): () => void {
  const usersCol = collection(db, 'users');

  return onSnapshot(
    usersCol,
    (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      const now = Date.now();
      const weekStart = getWeekStartTimestamp();
      const monthStart = getMonthStartTimestamp();

      snapshot.forEach((docSnap) => {
        const raw = docSnap.data() as Partial<UserProgressData>;
        if (!raw) return;

        // Exclude Super Admin from public rankings
        if (raw.email && isSuperAdminUser(raw.email)) {
          return;
        }

        const uid = docSnap.id;
        const totalExp = raw.gamification?.exp || 0;
        const { currentLevel } = getExpProgressInCurrentLevel(totalExp);
        const rank = getRankForLevel(currentLevel);

        const streak = raw.gamification?.streak?.currentStreak || 0;
        const quizzesCorrect = raw.quizStats?.totalCorrectAnswers || 0;
        const dsaSolved = raw.dsaProgress?.solvedProblems?.length || 0;
        const readPagesCount = raw.readPages?.length || 0;

        // Calculate timeframe-scoped EXP
        let timeframeExp = totalExp;
        const activeDates = raw.gamification?.streak?.activeDates || [];
        
        if (timeframe === 'weekly') {
          // Count active days this week as a multiplier/slice of EXP
          const recentWeeklyDays = activeDates.filter((dateStr) => {
            const dateTimestamp = new Date(dateStr).getTime();
            return dateTimestamp >= weekStart;
          }).length;
          // Weighted weekly score based on daily activity and overall progress
          timeframeExp = Math.round(totalExp * 0.35 + recentWeeklyDays * 120 + quizzesCorrect * 15 + dsaSolved * 50);
        } else if (timeframe === 'monthly') {
          // Count active days this month
          const recentMonthlyDays = activeDates.filter((dateStr) => {
            const dateTimestamp = new Date(dateStr).getTime();
            return dateTimestamp >= monthStart;
          }).length;
          timeframeExp = Math.round(totalExp * 0.7 + recentMonthlyDays * 100 + quizzesCorrect * 20 + dsaSolved * 60);
        }

        entries.push({
          uid,
          rankPosition: 0,
          displayName: raw.displayName || raw.email?.split('@')[0] || `Learner_${uid.slice(0, 5)}`,
          email: raw.email,
          photoURL: raw.photoURL,
          level: currentLevel,
          exp: totalExp,
          rankTitle: rank.title,
          rankBadge: rank.badge,
          streak,
          quizzesCorrect,
          dsaSolved,
          readPagesCount,
          isOnline: onlineUids.has(uid),
          timeframeExp,
        });
      });

      // Sort by timeframe EXP (descending), tie-break with Level and Quizzes
      entries.sort((a, b) => {
        if (b.timeframeExp !== a.timeframeExp) return b.timeframeExp - a.timeframeExp;
        if (b.level !== a.level) return b.level - a.level;
        return b.quizzesCorrect - a.quizzesCorrect;
      });

      // Assign 1-based rank positions
      const rankedEntries = entries.map((entry, index) => ({
        ...entry,
        rankPosition: index + 1,
      }));

      onUpdate(rankedEntries);
    },
    (err) => {
      console.warn('Firestore leaderboard subscription error:', err);
      onUpdate([]);
    }
  );
}
