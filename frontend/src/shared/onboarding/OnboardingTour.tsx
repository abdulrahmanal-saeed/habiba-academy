import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from './onboarding.store'
import { TourOverlay } from './components/TourOverlay'
import { TourSpotlight } from './components/TourSpotlight'
import { TourTooltip } from './components/TourTooltip'

export const OnboardingTour: FC = () => {
  const { activeConfig, currentStep, nextStep, prevStep, skipTour } = useOnboardingStore()
  const [rect, setRect] = useState<DOMRect | null>(null)

  const step = activeConfig?.steps[currentStep]

  useEffect(() => {
    if (!step) return

    const measure = () => {
      const el = document.getElementById(step.targetId)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setRect(el.getBoundingClientRect()), 300)
    }

    measure()

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [step])

  const isActive = Boolean(activeConfig && step)

  return createPortal(
    <AnimatePresence>
      {isActive && rect && step && activeConfig && (
        <>
          <TourOverlay key="overlay" rect={rect} onSkip={skipTour} />
          <TourSpotlight key="spotlight" rect={rect} />
          <TourTooltip
            key={`tooltip-${step.id}`}
            rect={rect}
            placement={step.placement}
            title={step.title}
            description={step.description}
            currentStep={currentStep}
            totalSteps={activeConfig.steps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
          />
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
