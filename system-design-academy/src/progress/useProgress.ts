import { create } from 'zustand'
import {
  loadProgress,
  markLibraryRead,
  recordLevelPass,
  recordQuiz,
  type ProgressState,
} from './storage'
import type { SimulationResult } from '../types/game'

interface ProgressStore extends ProgressState {
  hydrate: () => void
  completeLevel: (
    levelId: string,
    result: SimulationResult,
    xpReward: number,
    unlockNext: string | null,
  ) => void
  completeQuiz: (quizId: string, score: number, total: number, xp: number) => void
  readChapter: (chapterId: string) => void
}

export const useProgress = create<ProgressStore>((set, get) => ({
  ...loadProgress(),
  hydrate: () => set(loadProgress()),
  completeLevel: (levelId, result, xpReward, unlockNext) => {
    set(recordLevelPass(get(), levelId, result, xpReward, unlockNext))
  },
  completeQuiz: (quizId, score, total, xp) => {
    set(recordQuiz(get(), quizId, score, total, xp))
  },
  readChapter: (chapterId) => set(markLibraryRead(get(), chapterId)),
}))
