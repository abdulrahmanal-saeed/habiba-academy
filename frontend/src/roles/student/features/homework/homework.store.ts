import { create } from 'zustand'

interface ProgressSnapshot {
  mcq: Record<string, string>
  writing: Record<string, string>
  step: number
}

function lsKey(studentId: number, homeworkId: number): string {
  return `hw_prog_${studentId}_${homeworkId}`
}

interface HomeworkStore {
  currentStep: number
  mcqAnswers: Record<string, string>
  writingAnswers: Record<string, string>
  speakingBlobs: Record<string, Blob>
  progressRestored: boolean

  setStep: (step: number) => void
  setMcqAnswer: (qid: string, answer: string) => void
  setWritingAnswer: (qid: string, text: string) => void
  setSpeakingBlob: (qid: string, blob: Blob) => void
  saveProgress: (studentId: number, homeworkId: number) => void
  loadProgress: (studentId: number, homeworkId: number) => void
  clearProgress: (studentId: number, homeworkId: number) => void
  reset: () => void
}

const INITIAL: Pick<
  HomeworkStore,
  'currentStep' | 'mcqAnswers' | 'writingAnswers' | 'speakingBlobs' | 'progressRestored'
> = {
  currentStep: 0,
  mcqAnswers: {},
  writingAnswers: {},
  speakingBlobs: {},
  progressRestored: false,
}

export const useHomeworkStore = create<HomeworkStore>((set, get) => ({
  ...INITIAL,

  setStep: (step) => set({ currentStep: step }),

  setMcqAnswer: (qid, answer) =>
    set((s) => ({ mcqAnswers: { ...s.mcqAnswers, [qid]: answer } })),

  setWritingAnswer: (qid, text) =>
    set((s) => ({ writingAnswers: { ...s.writingAnswers, [qid]: text } })),

  setSpeakingBlob: (qid, blob) =>
    set((s) => ({ speakingBlobs: { ...s.speakingBlobs, [qid]: blob } })),

  saveProgress: (studentId, homeworkId) => {
    try {
      const { mcqAnswers, writingAnswers, currentStep } = get()
      const snapshot: ProgressSnapshot = { mcq: mcqAnswers, writing: writingAnswers, step: currentStep }
      localStorage.setItem(lsKey(studentId, homeworkId), JSON.stringify(snapshot))
    } catch { /* silent */ }
  },

  loadProgress: (studentId, homeworkId) => {
    try {
      const raw = localStorage.getItem(lsKey(studentId, homeworkId))
      if (!raw) return
      const data = JSON.parse(raw) as Partial<ProgressSnapshot>
      const mcq     = data.mcq     && Object.keys(data.mcq).length     > 0 ? data.mcq     : {}
      const writing  = data.writing && Object.keys(data.writing).length > 0 ? data.writing  : {}
      const step     = typeof data.step === 'number' && data.step > 0      ? data.step     : 0
      const restored = Object.keys(mcq).length > 0 || Object.keys(writing).length > 0
      set({ mcqAnswers: mcq, writingAnswers: writing, currentStep: step, progressRestored: restored })
    } catch { /* silent */ }
  },

  clearProgress: (studentId, homeworkId) => {
    try { localStorage.removeItem(lsKey(studentId, homeworkId)) } catch { /* silent */ }
  },

  reset: () => set(INITIAL),
}))
