import type { FC } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AcademyLayout } from './components/AcademyLayout'
import { AcademyDashboardPage } from './features/dashboard'
import { AcademyStudentsPage } from './features/students'
import { BriefsPage, BriefDetailPage, NewBriefPage } from './features/briefs'
import { AcademyNotificationsPage } from './features/notifications'

const AcademyApp: FC = () => (
  <AcademyLayout>
    <Routes>
      <Route index element={<AcademyDashboardPage />} />
      <Route path="students" element={<AcademyStudentsPage />} />
      <Route path="briefs" element={<BriefsPage />} />
      <Route path="briefs/new" element={<NewBriefPage />} />
      <Route path="briefs/:id" element={<BriefDetailPage />} />
      <Route path="notifications" element={<AcademyNotificationsPage />} />
    </Routes>
  </AcademyLayout>
)

export default AcademyApp
