import { lazy, Suspense } from 'react'
import type { FC } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Spinner } from '@/design-system/components'
import { StudentLayout } from './components/StudentLayout'

const StudentDashboard = lazy(() =>
  import('./features/dashboard').then((m) => ({ default: m.StudentDashboard })),
)
const HomeworkPage = lazy(() =>
  import('./features/homework').then((m) => ({ default: m.HomeworkPage })),
)
const HomeworkResultPage = lazy(() =>
  import('./features/homework-result').then((m) => ({ default: m.HomeworkResultPage })),
)
const ReviewPage = lazy(() =>
  import('./features/review').then((m) => ({ default: m.ReviewPage })),
)
const ReviewResultPage = lazy(() =>
  import('./features/review').then((m) => ({ default: m.ReviewResultPage })),
)
const ScenariosPage = lazy(() =>
  import('./features/scenarios').then((m) => ({ default: m.ScenariosPage })),
)
const ScenarioDetailPage = lazy(() =>
  import('./features/scenarios').then((m) => ({ default: m.ScenarioDetailPage })),
)
const MaterialsPage = lazy(() =>
  import('./features/materials').then((m) => ({ default: m.MaterialsPage })),
)
const MaterialDetailPage = lazy(() =>
  import('./features/materials').then((m) => ({ default: m.MaterialDetailPage })),
)
const ProgressPage = lazy(() =>
  import('./features/progress').then((m) => ({ default: m.ProgressPage })),
)
const FlashcardsPage = lazy(() =>
  import('./features/flashcards').then((m) => ({ default: m.FlashcardsPage })),
)
const WeakWordsPage = lazy(() =>
  import('./features/weak-words').then((m) => ({ default: m.WeakWordsPage })),
)
const CommonMistakesPage = lazy(() =>
  import('./features/common-mistakes').then((m) => ({ default: m.CommonMistakesPage })),
)
const BookListPage = lazy(() =>
  import('./features/book').then((m) => ({ default: m.BookListPage })),
)
const BookViewPage = lazy(() =>
  import('./features/book').then((m) => ({ default: m.BookViewPage })),
)
const LessonPage = lazy(() =>
  import('./features/book').then((m) => ({ default: m.LessonPage })),
)
const FeedbackPage = lazy(() =>
  import('./features/book').then((m) => ({ default: m.FeedbackPage })),
)
const BookProductPage = lazy(() =>
  import('./features/book-marketing').then((m) => ({ default: m.BookProductPage })),
)
const BookCheckoutPage = lazy(() =>
  import('./features/book-marketing').then((m) => ({ default: m.BookCheckoutPage })),
)

const Fallback: FC = () => (
  <div className="flex h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
    <Spinner size="lg" />
  </div>
)

const StudentApp: FC = () => (
  <StudentLayout>
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="homework/:id/result" element={<HomeworkResultPage />} />
        <Route path="homework/:id" element={<HomeworkPage />} />
        <Route path="review/:id/result" element={<ReviewResultPage />} />
        <Route path="review/:id" element={<ReviewPage />} />
        <Route path="scenarios/:id" element={<ScenarioDetailPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="materials/:id" element={<MaterialDetailPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="weak-words" element={<WeakWordsPage />} />
        <Route path="common-mistakes" element={<CommonMistakesPage />} />
        <Route path="book/feedback/:submissionId" element={<FeedbackPage />} />
        <Route path="book/view/:bookId" element={<BookViewPage />} />
        <Route path="book/:lessonId" element={<LessonPage />} />
        <Route path="book" element={<BookListPage />} />
        <Route path="book-product"  element={<BookProductPage />} />
        <Route path="book-checkout" element={<BookCheckoutPage />} />
        <Route path="*" element={<StudentDashboard />} />
      </Routes>
    </Suspense>
  </StudentLayout>
)

export default StudentApp
