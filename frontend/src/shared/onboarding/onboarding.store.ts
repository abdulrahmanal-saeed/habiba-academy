import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TourConfig } from './types'

interface OnboardingState {
  completedTours: string[]
  activeTourId: string | null
  activeConfig: TourConfig | null
  currentStep: number
}

interface OnboardingActions {
  startTour: (config: TourConfig) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
}

type OnboardingStore = OnboardingState & OnboardingActions

const INITIAL: OnboardingState = {
  completedTours: [],
  activeTourId: null,
  activeConfig: null,
  currentStep: 0,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      startTour(config) {
        const { completedTours } = get()
        if (completedTours.includes(config.id)) return
        set({ activeTourId: config.id, activeConfig: config, currentStep: 0 })
      },

      nextStep() {
        const { activeConfig, currentStep } = get()
        if (!activeConfig) return
        const isLast = currentStep >= activeConfig.steps.length - 1
        if (isLast) {
          set((s) => ({
            completedTours: [...s.completedTours, s.activeTourId!],
            activeTourId: null,
            activeConfig: null,
            currentStep: 0,
          }))
        } else {
          set({ currentStep: currentStep + 1 })
        }
      },

      prevStep() {
        const { currentStep } = get()
        if (currentStep > 0) set({ currentStep: currentStep - 1 })
      },

      skipTour() {
        set((s) => ({
          completedTours: s.activeTourId
            ? [...s.completedTours, s.activeTourId]
            : s.completedTours,
          activeTourId: null,
          activeConfig: null,
          currentStep: 0,
        }))
      },
    }),
    {
      name: 'habiba-onboarding',
      partialize: (s) => ({ completedTours: s.completedTours }),
    },
  ),
)
