import type { FC } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { pageTransition } from '@/design-system/animations'
import { StepIndicator } from './components/StepIndicator'
import { RegistrationStep } from './components/RegistrationStep'
import { ListeningStep } from './components/ListeningStep'
import { ReadingStep } from './components/ReadingStep'
import { WritingStep } from './components/WritingStep'
import { SpeakingStep } from './components/SpeakingStep'
import { ResultStep } from './components/ResultStep'
import { useLevelTest } from './hooks/useLevelTest'

export const LevelTestPage: FC = () => {
  const wizard = useLevelTest()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <StepIndicator currentStep={wizard.step} />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizard.step}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            {wizard.step === 'registration' && (
              <RegistrationStep
                onSubmit={wizard.registerMutation.mutate}
                isLoading={wizard.registerMutation.isPending}
              />
            )}

            {wizard.step === 'listening' && (
              <ListeningStep
                blocks={wizard.testData?.listeningBlocks ?? []}
                isLoading={wizard.isLoadingTest}
                answers={wizard.listeningAnswers}
                onAnswer={wizard.answerListening}
                onNext={() => wizard.setStep('reading')}
              />
            )}

            {wizard.step === 'reading' && (
              <ReadingStep
                blocks={wizard.testData?.readingBlocks ?? []}
                isLoading={wizard.isLoadingTest}
                answers={wizard.readingAnswers}
                onAnswer={wizard.answerReading}
                onNext={() => wizard.setStep('writing')}
              />
            )}

            {wizard.step === 'writing' && (
              <WritingStep
                task1Prompt={wizard.testData?.writingTask1 ?? ''}
                task2Prompt={wizard.testData?.writingTask2 ?? ''}
                task1Value={wizard.writingTask1}
                task2Value={wizard.writingTask2}
                onChange1={wizard.setWritingTask1}
                onChange2={wizard.setWritingTask2}
                onNext={() => wizard.setStep('speaking')}
              />
            )}

            {wizard.step === 'speaking' && (
              <SpeakingStep
                prompts={wizard.testData?.speakingPrompts ?? []}
                recordings={wizard.recordings}
                onRecord={wizard.saveRecording}
                onSubmit={wizard.handleSubmit}
                isSubmitting={wizard.isSubmitting}
              />
            )}

            {wizard.step === 'result' && wizard.result && (
              <ResultStep result={wizard.result} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default LevelTestPage
