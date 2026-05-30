import type { FC } from 'react'
import { Routes, Route } from 'react-router-dom'
import { OwnerLayout } from './components/OwnerLayout'
import { DashboardPage } from './features/dashboard'
import { AnalyticsPage } from './features/analytics'
import { PaymentsPage } from './features/payments'
import { OwnerSettingsPage } from './features/settings'
import { ArticlesPage } from './features/articles'
import { VideosPage } from './features/videos'
import { AcademiesPage } from './features/academies'
import { AcademyBriefsPage, AcademyBriefDetailPage } from './features/academy-briefs'
import { MediaBuyersPage, MediaBuyerAgreementPage } from './features/media-buyers'
import { BookLaunchPage, BookActivationRequestsPage } from './features/book-launch'
import { AISettingsPage } from './features/ai-settings'
import { AILogsPage } from './features/ai-logs'
import { ParentsPage } from './features/parents'
import { AccessLinksPage } from './features/access-links'
import { StudentsPage } from './features/students'
import { HelpCmsPage } from './features/help-cms'
import { TestimonialsPage } from './features/testimonials'
import { AuditLogPage } from './features/audit-log'

const OwnerApp: FC = () => (
  <OwnerLayout>
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="help-cms" element={<HelpCmsPage />} />
      <Route path="analytics" element={<AnalyticsPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="settings" element={<OwnerSettingsPage />} />
      <Route path="articles" element={<ArticlesPage />} />
      <Route path="videos" element={<VideosPage />} />
      <Route path="academies" element={<AcademiesPage />} />
      <Route path="academy-briefs" element={<AcademyBriefsPage />} />
      <Route path="academy-briefs/:id" element={<AcademyBriefDetailPage />} />
      <Route path="media-buyers" element={<MediaBuyersPage />} />
      <Route path="media-buyers/agreement" element={<MediaBuyerAgreementPage />} />
      <Route path="book-launch" element={<BookLaunchPage />} />
      <Route path="book-launch/requests" element={<BookActivationRequestsPage />} />
      <Route path="ai-settings" element={<AISettingsPage />} />
      <Route path="ai-logs" element={<AILogsPage />} />
      <Route path="parents" element={<ParentsPage />} />
      <Route path="access-links" element={<AccessLinksPage />} />
      <Route path="testimonials" element={<TestimonialsPage />} />
      <Route path="audit-log" element={<AuditLogPage />} />
    </Routes>
  </OwnerLayout>
)

export default OwnerApp
