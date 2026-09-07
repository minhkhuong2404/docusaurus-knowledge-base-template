import type { SimulationResult, SystemMetrics } from '../types/game'

export interface LevelProgress {
  stars: 0 | 1 | 2 | 3
  bestResult?: Pick<
    SimulationResult,
    'pass' | 'stars' | 'cost' | 'complexity' | 'metrics'
  >
  completedAt?: string
}

export interface ProgressState {
  xp: number
  unlocked: string[]
  levels: Record<string, LevelProgress>
  quizzes: Record<string, { score: number; total: number; completedAt: string }>
  libraryRead: string[]
}

const KEY = 'sda-progress-v1'

const DEFAULT: ProgressState = {
  xp: 0,
  unlocked: ['L01'],
  levels: {},
  quizzes: {},
  libraryRead: [],
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, unlocked: [...DEFAULT.unlocked] }
    const parsed = JSON.parse(raw) as ProgressState
    return {
      ...DEFAULT,
      ...parsed,
      unlocked: parsed.unlocked?.length ? parsed.unlocked : ['L01'],
      levels: parsed.levels ?? {},
      quizzes: parsed.quizzes ?? {},
      libraryRead: parsed.libraryRead ?? [],
    }
  } catch {
    return { ...DEFAULT, unlocked: [...DEFAULT.unlocked] }
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function recordLevelPass(
  state: ProgressState,
  levelId: string,
  result: SimulationResult,
  xpReward: number,
  unlockNext: string | null,
): ProgressState {
  const prev = state.levels[levelId]
  const firstClear = !prev?.stars
  const better = !prev || result.stars > prev.stars
  const next: ProgressState = {
    ...state,
    xp: state.xp + (firstClear ? xpReward : better ? Math.floor(xpReward * 0.25) : 0),
    unlocked: unlockNext
      ? [...new Set([...state.unlocked, unlockNext])]
      : state.unlocked,
    levels: {
      ...state.levels,
      [levelId]: {
        stars: Math.max(prev?.stars ?? 0, result.stars) as 0 | 1 | 2 | 3,
        bestResult: better || !prev?.bestResult
          ? {
              pass: result.pass,
              stars: result.stars,
              cost: result.cost,
              complexity: result.complexity,
              metrics: result.metrics,
            }
          : prev.bestResult,
        completedAt: new Date().toISOString(),
      },
    },
  }
  saveProgress(next)
  return next
}

export function recordQuiz(
  state: ProgressState,
  quizId: string,
  score: number,
  total: number,
  xp: number,
): ProgressState {
  const already = state.quizzes[quizId]
  const next: ProgressState = {
    ...state,
    xp: state.xp + (already ? 0 : xp),
    quizzes: {
      ...state.quizzes,
      [quizId]: { score, total, completedAt: new Date().toISOString() },
    },
  }
  saveProgress(next)
  return next
}

export function markLibraryRead(state: ProgressState, chapterId: string): ProgressState {
  if (state.libraryRead.includes(chapterId)) return state
  const next = {
    ...state,
    xp: state.xp + 15,
    libraryRead: [...state.libraryRead, chapterId],
  }
  saveProgress(next)
  return next
}

export function emptyMetrics(): SystemMetrics {
  return {
    rpsCapable: 0,
    p95Ms: 0,
    errorRate: 0,
    dbCpu: 0,
    cacheHitRatio: 0,
    queueLag: 0,
    connections: 0,
    reliability: 0,
  }
}
