import { Routes, Route } from 'react-router-dom'
import type { FC } from 'react'
import { TeacherLayout } from './components/TeacherLayout'
import { TeacherDashboard } from './features/dashboard/TeacherDashboard'
import { StudentsPage } from './features/students/StudentsPage'
import { StudentDetailPage } from './features/student-detail'
import { HomeworkCreatePage } from './features/homework-create'
import { LessonPlanningPage } from './features/lesson-planning'
import { LevelTestPage } from './features/level-test'
import { BookSubmissionsPage } from './features/book-submissions'
import { BookBuilderPage } from './features/book-builder'
import { AIToolsPage } from './features/ai-tools'
import { SettingsPage } from './features/settings'
import { HelpCenterCmsPage } from './features/help-center-cms'

const TeacherApp: FC = () => (
  <TeacherLayout>
    <Routes>
      <Route index element={<TeacherDashboard />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="students/:id" element={<StudentDetailPage />} />
      <Route path="students/:id/lesson-plan" element={<LessonPlanningPage />} />
      <Route path="homework/create" element={<HomeworkCreatePage />} />
      <Route path="level-test" element={<LevelTestPage />} />
      <Route path="book-submissions" element={<BookSubmissionsPage />} />
      <Route path="book-builder" element={<BookBuilderPage />} />
      <Route path="ai-tools" element={<AIToolsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="help-center" element={<HelpCenterCmsPage />} />
    </Routes>
  </TeacherLayout>
)

export default TeacherApp
