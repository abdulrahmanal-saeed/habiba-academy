import type { FC } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ParentLayout } from './components/ParentLayout'
import { ParentDashboardPage } from './features/dashboard'
import { ChildHomeworkPage } from './features/child-homework'
import { ChildProgressPage } from './features/child-progress'
import { ChildReviewsPage } from './features/child-reviews'
import { ChildMaterialsPage } from './features/child-materials'
import { ChildBookPage } from './features/child-book'
import { ChildSchedulePage } from './features/child-schedule'

const ParentApp: FC = () => (
  <ParentLayout>
    <Routes>
      <Route index element={<ParentDashboardPage />} />
      <Route path="children/:id/homework"  element={<ChildHomeworkPage />} />
      <Route path="children/:id/progress"  element={<ChildProgressPage />} />
      <Route path="children/:id/reviews"   element={<ChildReviewsPage />} />
      <Route path="children/:id/materials" element={<ChildMaterialsPage />} />
      <Route path="children/:id/book"      element={<ChildBookPage />} />
      <Route path="children/:id/schedule"  element={<ChildSchedulePage />} />
    </Routes>
  </ParentLayout>
)

export default ParentApp
