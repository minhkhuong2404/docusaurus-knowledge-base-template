import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { isSuperAdminUser } from '../config/adminConfig';
import { getExpProgressInCurrentLevel, ACHIEVEMENTS } from '../data/gamificationData';
import { UserProgressData } from './userProgressService';

export interface LeaderboardRewardResult {
  periodType: 'weekly' | 'monthly';
  periodKey: string;
  rankPosition: number;
  achievementId: string;
  title: string;
  icon: string;
  expReward: number;
}

/**
 * Returns ISO week number and year key, e.g., '2026-W34'
 */
export function getISOWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns previous ISO week key, e.g., '2026-W33'
 */
export function getPreviousWeekKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return getISOWeekKey(d);
}

/**
 * Returns current month key, e.g., '2026-08'
 */
export function getCurrentMonthKey(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Returns previous month key, e.g., '2026-07'
 */
export function getPreviousMonthKey(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return getCurrentMonthKey(d);
}

/**
 * Determine achievement ID and reward details based on rank and period
 */
export function getAchievementForRank(
  periodType: 'weekly' | 'monthly',
  rank: number
): { achievementId: string; expReward: number; title: string; icon: string } | null {
  if (periodType === 'weekly') {
    if (rank === 1) return { achievementId: 'weekly_rank_1', expReward: 600, title: 'Weekly Apex Champion', icon: '🥇' };
    if (rank === 2) return { achievementId: 'weekly_rank_2', expReward: 400, title: 'Weekly Silver Vanguard', icon: '🥈' };
    if (rank === 3) return { achievementId: 'weekly_rank_3', expReward: 300, title: 'Weekly Bronze Voyager', icon: '🥉' };
    if (rank <= 5) return { achievementId: 'weekly_rank_5', expReward: 200, title: 'Weekly Top 5 Pioneer', icon: '🌟' };
    if (rank <= 10) return { achievementId: 'weekly_rank_10', expReward: 120, title: 'Weekly Top 10 Contender', icon: '⚡' };
  } else {
    if (rank === 1) return { achievementId: 'monthly_rank_1', expReward: 1800, title: 'Monthly Grand Archon', icon: '👑' };
    if (rank === 2) return { achievementId: 'monthly_rank_2', expReward: 1200, title: 'Monthly Master Vanguard', icon: '🌌' };
    if (rank === 3) return { achievementId: 'monthly_rank_3', expReward: 800, title: 'Monthly Stellar Voyager', icon: '🌠' };
    if (rank <= 5) return { achievementId: 'monthly_rank_5', expReward: 500, title: 'Monthly Top 5 Sovereign', icon: '✨' };
    if (rank <= 10) return { achievementId: 'monthly_rank_10', expReward: 300, title: 'Monthly Top 10 Elite', icon: '🚀' };
  }
  return null;
}

/**
 * Evaluates concluded weekly and monthly periods, and determines if user earned ungranted rewards.
 */
export async function evaluateLeaderboardStandings(
  userId: string,
  userEmail?: string | null,
  claimedRewards: string[] = []
): Promise<LeaderboardRewardResult[]> {
  if (!userId || (userEmail && isSuperAdminUser(userEmail))) {
    return [];
  }

  const results: LeaderboardRewardResult[] = [];
  const prevWeekKey = getPreviousWeekKey();
  const prevMonthKey = getPreviousMonthKey();

  const weeklyClaimKey = `weekly_${prevWeekKey}`;
  const monthlyClaimKey = `monthly_${prevMonthKey}`;

  // Early return if user has already claimed both weekly and monthly rewards
  const needsWeekly = !claimedRewards.includes(weeklyClaimKey);
  const needsMonthly = !claimedRewards.includes(monthlyClaimKey);
  if (!needsWeekly && !needsMonthly) {
    return [];
  }

  // Session-level de-duplication: avoid querying all users repeatedly in the same browser session
  const sessionCheckKey = `lb_eval_${userId}_${prevWeekKey}_${prevMonthKey}`;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    if (sessionStorage.getItem(sessionCheckKey)) {
      return [];
    }
    sessionStorage.setItem(sessionCheckKey, '1');
  }

  // Fetch all users to determine rank standings
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const userScores: { uid: string; totalExp: number; weeklyScore: number; monthlyScore: number }[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data() as Partial<UserProgressData>;
      if (!data || (data.email && isSuperAdminUser(data.email))) return;

      const totalExp = data.gamification?.exp || 0;
      const quizzesCorrect = data.quizStats?.totalCorrectAnswers || 0;
      const dsaSolved = data.dsaProgress?.solvedProblems?.length || 0;
      const streakCount = data.gamification?.streak?.currentStreak || 0;

      const weeklyScore = Math.round(totalExp * 0.35 + streakCount * 80 + quizzesCorrect * 15 + dsaSolved * 50);
      const monthlyScore = Math.round(totalExp * 0.7 + streakCount * 100 + quizzesCorrect * 20 + dsaSolved * 60);

      userScores.push({
        uid: docSnap.id,
        totalExp,
        weeklyScore,
        monthlyScore,
      });
    });

    // 1. Evaluate Concluded Weekly Period
    if (!claimedRewards.includes(weeklyClaimKey)) {
      const weeklySorted = [...userScores].sort((a, b) => b.weeklyScore - a.weeklyScore);
      const userIndex = weeklySorted.findIndex((u) => u.uid === userId);

      if (userIndex !== -1) {
        const rankPosition = userIndex + 1;
        const rewardInfo = getAchievementForRank('weekly', rankPosition);

        if (rewardInfo) {
          results.push({
            periodType: 'weekly',
            periodKey: weeklyClaimKey,
            rankPosition,
            ...rewardInfo,
          });
        }
      }
    }

    // 2. Evaluate Concluded Monthly Period
    if (!claimedRewards.includes(monthlyClaimKey)) {
      const monthlySorted = [...userScores].sort((a, b) => b.monthlyScore - a.monthlyScore);
      const userIndex = monthlySorted.findIndex((u) => u.uid === userId);

      if (userIndex !== -1) {
        const rankPosition = userIndex + 1;
        const rewardInfo = getAchievementForRank('monthly', rankPosition);

        if (rewardInfo) {
          results.push({
            periodType: 'monthly',
            periodKey: monthlyClaimKey,
            rankPosition,
            ...rewardInfo,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed evaluating leaderboard standings:', err);
  }

  return results;
}
