import { useOnboardingStore } from './onboarding.store'
import type { TourConfig } from './types'

export function useTour() {
  const {
    startTour,
    nextStep,
    prevStep,
    skipTour,
    activeTourId,
    completedTours,
  } = useOnboardingStore()

  const isActive = activeTourId !== null

  const isCompleted = (tourId: string) => completedTours.includes(tourId)

  return {
    startTour: (config: TourConfig) => startTour(config),
    nextStep,
    prevStep,
    skipTour,
    isActive,
    isCompleted,
  }
}
