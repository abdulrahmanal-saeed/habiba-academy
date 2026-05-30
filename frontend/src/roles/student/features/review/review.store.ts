import { create } from 'zustand'

interface ProgressSnapshot {
  mcq: Record<string, string>
  matching: Record<string, Record<string, string>>
  fill: Record<string, string>
  writing: Record<string, string>
}

function lsKey(studentId: number, reviewId: number): string {
  return `rev_prog_${studentId}_${reviewId}`
}

export interface ReviewStore {
  mcqAnswers: Record<string, string>
  matchingAnswers: Record<string, Record<string, string>>
  fillAnswers: Record<string, string>
  writingAnswers: Record<string, string>
  progressRestored: boolean

  setMcqAnswer: (qid: string, answer: string) => void
  setMatchingAnswer: (exId: string, leftId: string, rightId: string) => void
  setFillAnswer: (qid: string, text: string) => void
  setWritingAnswer: (qid: string, text: string) => void
  saveProgress: (studentId: number, reviewId: number) => void
  loadProgress: (studentId: number, reviewId: number) => void
  clearProgress: (studentId: number, reviewId: number) => void
  reset: () => void
}

const INITIAL: Pick<
  ReviewStore,
  'mcqAnswers' | 'matchingAnswers' | 'fillAnswers' | 'writingAnswers' | 'progressRestored'
> = {
  mcqAnswers: {},
  matchingAnswers: {},
  fillAnswers: {},
  writingAnswers: {},
  progressRestored: false,
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  ...INITIAL,

  setMcqAnswer: (qid, answer) =>
    set((s) => ({ mcqAnswers: { ...s.mcqAnswers, [qid]: answer } })),

  setMatchingAnswer: (exId, leftId, rightId) =>
    set((s) => ({
      matchingAnswers: {
        ...s.matchingAnswers,
        [exId]: { ...(s.matchingAnswers[exId] ?? {}), [leftId]: rightId },
      },
    })),

  setFillAnswer: (qid, text) =>
    set((s) => ({ fillAnswers: { ...s.fillAnswers, [qid]: text } })),

  setWritingAnswer: (qid, text) =>
    set((s) => ({ writingAnswers: { ...s.writingAnswers, [qid]: text } })),

  saveProgress: (studentId, reviewId) => {
    try {
      const { mcqAnswers, matchingAnswers, fillAnswers, writingAnswers } = get()
      const snapshot: ProgressSnapshot = {
        mcq: mcqAnswers,
        matching: matchingAnswers,
        fill: fillAnswers,
        writing: writingAnswers,
      }
      localStorage.setItem(lsKey(studentId, reviewId), JSON.stringify(snapshot))
    } catch { /* silent */ }
  },

  loadProgress: (studentId, reviewId) => {
    try {
      const raw = localStorage.getItem(lsKey(studentId, reviewId))
      if (!raw) return
      const data = JSON.parse(raw) as Partial<ProgressSnapshot>
      const mcq      = data.mcq      && Object.keys(data.mcq).length      > 0 ? data.mcq      : {}
      const matching  = data.matching  && Object.keys(data.matching).length  > 0 ? data.matching  : {}
      const fill      = data.fill      && Object.keys(data.fill).length      > 0 ? data.fill      : {}
      const writing   = data.writing   && Object.keys(data.writing).length   > 0 ? data.writing   : {}
      const restored  = [mcq, matching, fill, writing].some((m) => Object.keys(m).length > 0)
      set({ mcqAnswers: mcq, matchingAnswers: matching, fillAnswers: fill, writingAnswers: writing, progressRestored: restored })
    } catch { /* silent */ }
  },

  clearProgress: (studentId, reviewId) => {
    try { localStorage.removeItem(lsKey(studentId, reviewId)) } catch { /* silent */ }
  },

  reset: () => set(INITIAL),
}))
