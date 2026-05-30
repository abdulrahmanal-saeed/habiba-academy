# API_CONTRACTS.md — Habiba Nabil Arabic Academy
# Frontend ↔ Backend API Contracts

> Base URL: `https://mshabibanabil.com` (VITE_API_BASE_URL)
> Auth: PHP session cookie (httpOnly, Secure, SameSite=Lax)
> Credentials: always `include` in fetch/axios
>
> SUCCESS format: `{ ok: true, ...data }`  ← from lib/helpers.php json_ok()
> ERROR format:   `{ ok: false, error: "message" }` ← from json_err()
>
> IMPORTANT: Check `ok: false`, not just HTTP status code.

---

## Global TypeScript Types

```typescript
// core/types/index.ts

export type RoleType =
  | 'student'
  | 'teacher'
  | 'owner'
  | 'parent'
  | 'academy'
  | 'media-buyer'

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  role: RoleType
  createdAt: string
}

export interface ApiOk<T = Record<string, unknown>> {
  ok: true
} & T

export interface ApiError {
  ok: false
  error: string
}

export type ApiResponse<T = Record<string, unknown>> = ApiOk<T> | ApiError

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
```

---

## Auth Endpoints

### POST /api/auth/login
```typescript
Request:  { email: string; password: string; role: RoleType; _csrf: string }
Response: ApiOk<{ user: User; role: RoleType; redirectUrl: string }>
Errors:   { ok: false, error: 'Invalid credentials' }  // 401
          { ok: false, error: 'Wrong role' }            // 403
```

### POST /api/auth/logout
```typescript
Request:  { _csrf: string }
Response: ApiOk
```

### GET /api/auth/me
```typescript
Response: ApiOk<{ user: User; role: RoleType }>
Error:    { ok: false, error: 'Unauthorized' }  // 401
```

---

## Student Endpoints

### GET /api/student/dashboard
```typescript
Response: ApiOk<{
  upcomingLesson:  { date: string; teacherName: string; type: string } | null
  pendingHomework: number
  pendingReviews:  number
  balance:         number
  streak:          number
  recentActivity:  ActivityItem[]
  bookProgress?:   { lessonsCompleted: number; totalLessons: number }
}>

interface ActivityItem {
  type: 'homework_submitted' | 'review_completed' | 'material_viewed'
  title: string
  timestamp: string
}
```

### GET /api/student/homework
```typescript
Query:    { status?: 'pending' | 'submitted' | 'reviewed'; page?: number }
Response: ApiOk<{ items: Homework[]; total: number }>

export interface Homework {
  id: number
  title: string
  teacherName: string
  dueDate: string
  status: 'pending' | 'submitted' | 'reviewed'
  hasAudio: boolean
  hasVideo: boolean
  teacherFeedback?: string
  rating?: 1 | 2 | 3 | 4 | 5
  createdAt: string
}
```

### POST /api/review/submit   ← (homework submission uses review API)
```typescript
Request:  FormData {
  review_id: number
  answers: string       // JSON stringified answers
  audio_files?: File[]  // webm recordings
  _csrf: string
}
Response: ApiOk<{ submittedAt: string }>
```

### GET /api/student/materials
```typescript
Response: ApiOk<{ items: Material[] }>

export interface Material {
  id: number
  title: string
  type: 'pdf' | 'pptx' | 'doc' | 'other'
  fileUrl: string
  fileSizeKb: number
  uploadedAt: string
}
```

### GET /api/student/flashcards    ← lib/flashcards.php
```typescript
Response: ApiOk<{
  dueToday:     Flashcard[]
  totalCards:   number
  masteredCount: number
}>

export interface Flashcard {
  id: number
  arabicWord: string
  englishTranslation: string
  exampleSentence?: string
  difficulty: 'new' | 'learning' | 'review' | 'mastered'
  nextReviewAt: string
}
```

---

## Teacher Endpoints

### GET /api/teacher/dashboard ← inferred from usage patterns
```typescript
Response: ApiOk<{
  todayLessons:       number
  pendingHomework:    number
  pendingReviews:     number
  activeStudents:     number
  newSubmissions:     number        // api/teacher/new-submissions.php
  todaySchedule:      ScheduleItem[]
  recentSubmissions:  Submission[]
}>
```

### GET /api/teacher/students  ← api/teacher/student-*.php
```typescript
Query:    { search?: string; status?: 'active' | 'inactive'; page?: number }
Response: ApiOk<{ items: StudentSummary[]; total: number }>

export interface StudentSummary {
  id: number
  name: string
  email: string
  avatar?: string
  packageName: string
  sessionsRemaining: number
  lastLessonDate?: string
  status: 'active' | 'inactive'
  parentLinked: boolean
  hasBook: boolean
}
```

### POST /api/teacher/create-homework
```typescript
Request: {
  student_id: number
  title: string
  instructions: string
  due_date: string
  has_audio_question?: boolean
  questions?: HomeworkQuestion[]
  _csrf: string
}
Response: ApiOk<{ id: number; createdAt: string }>
```

### POST /api/teacher/session-save
```typescript
Request: {
  student_id: number
  date: string
  duration_minutes: number
  type: string
  notes?: string
  _csrf: string
}
Response: ApiOk<{ id: number }>
```

### POST /api/teacher/generate-month-sessions
```typescript
Request: { student_id: number; month: string; pattern: SessionPattern; _csrf: string }
Response: ApiOk<{ created: number; sessions: ScheduleItem[] }>
```

### GET /api/teacher/lesson-plan-data
```typescript
Query:    { student_id: number; session_id?: number }
Response: ApiOk<{
  student:       StudentSummary
  lastSessions:  Session[]
  homework:      Homework[]
  weakWords:     WeakWord[]
  mistakes:      Mistake[]
  materials:     Material[]
  aiSuggestions?: string[]
}>
```

---

## Teacher AI Endpoints (15 total)

All follow same pattern:

```typescript
// POST /api/teacher/ai/[tool].php
Request: {
  student_id?: number
  context?: string
  [tool-specific-params]: unknown
  _csrf: string
}
Response: ApiOk<{ result: string; tokens_used?: number }>

// Tools:
// analyze-student, apply-article, article, feedback-draft,
// homework, internal-note, lesson, mistake-event, mistake-tags,
// performance-summary, review-priority, scenario, sessions,
// student-snapshot, suggestion-action, writing-assist
```

---

## Review / Assessment Endpoints

### POST /api/review/create
```typescript
Request: {
  student_id: number
  title: string
  type: 'review' | 'test' | 'scenario'
  questions: ReviewQuestion[]
  _csrf: string
}
Response: ApiOk<{ id: number }>
```

### GET /api/review/student-list
```typescript
Query:    { student_id: number }
Response: ApiOk<{ items: Review[] }>
```

### POST /api/review/submit  (student submits)
```typescript
// Same as homework submission above
```

---

## Level Test Endpoints

### POST /api/leveltest/start
```typescript
Request:  { name?: string; email?: string }
Response: ApiOk<{ session_id: string; questions: LevelTestQuestion[] }>
```

### POST /api/leveltest/submit
```typescript
Request:  { session_id: string; answers: LevelTestAnswer[]; _csrf: string }
Response: ApiOk<{ level: string; score: number; recommendations: string[] }>
```

---

## Interactive Book Endpoints

### POST /api/book-submit-lesson.php
```typescript
Request:  FormData { lesson_id: number; answers: string; _csrf: string }
Response: ApiOk<{ score: number; feedback?: string }>
```

### POST /api/book-upload-speaking.php
```typescript
Request:  FormData { lesson_id: number; question_id: number; audio: File; _csrf: string }
Response: ApiOk<{ upload_id: number; url: string }>
```

### POST /api/book-save-draft.php
```typescript
Request:  { lesson_id: number; answers: Record<string, unknown>; _csrf: string }
Response: ApiOk
```

### POST /api/book-add-weak-word.php
```typescript
Request:  { word: string; translation?: string; context?: string; _csrf: string }
Response: ApiOk<{ id: number }>
```

---

## Notifications (Shared — all roles)

### GET /api/notifications
```typescript
Response: ApiOk<{
  unreadCount: number
  items: Notification[]
}>

export interface Notification {
  id: number
  type: 'homework_feedback' | 'new_material' | 'lesson_reminder'
       | 'review_result' | 'book_feedback' | 'general'
  title: string
  body: string
  isRead: boolean
  link?: string
  createdAt: string
}
```

### POST /api/notifications/[id]/read
```typescript
Response: ApiOk
```

### POST /notifications/read-all
```typescript
Response: ApiOk<{ markedCount: number }>
```

---

## Push Notifications (FCM)

### POST /api/push/subscribe
```typescript
Request:  { endpoint: string; keys: { p256dh: string; auth: string }; _csrf: string }
Response: ApiOk
// VAPID_PUBLIC_KEY from env for subscription
```

---

## Help Center (Shared)

### GET /api/help/articles
```typescript
Query:    { role: RoleType; search?: string; category?: string }
Response: ApiOk<{ items: HelpArticle[] }>

export interface HelpArticle {
  id: number
  slug: string
  title: string
  category: string
  excerpt: string
  role: RoleType | 'all'
  updatedAt: string
}
```

### POST /api/help/tour-progress
```typescript
Request:  { tour_id: string; step: number; completed: boolean; _csrf: string }
Response: ApiOk
```

---

## Public Endpoints (no auth)

### GET /api/public/pricing  ← lib/payment-pages.php
```typescript
Response: ApiOk<{ plans: PricingPlan[] }>

export interface PricingPlan {
  slug: string
  title: string
  price: string         // "499" (AED)
  sessions: number
  features: string[]
  isPopular: boolean
  isActive: boolean
}
```

### POST /api/public/checkout/initiate  ← lib/ziina.php
```typescript
Request:  { planSlug: string; name: string; email: string; phone: string; _csrf: string }
Response: ApiOk<{ paymentUrl: string; orderId: string }>
// Frontend: window.location.href = paymentUrl (Ziina hosted page)
```

### GET /api/public/testimonials  ← lib/testimonials.php
```typescript
// Uses storage/cache/published-testimonials.json for performance
Response: ApiOk<{ items: Testimonial[] }>
```

### GET /api/public/articles  ← lib/articles.php
```typescript
Query:    { page?: number; category?: string }
Response: ApiOk<{ items: Article[]; total: number }>
```

### GET /api/public/videos  ← lib/videos.php
```typescript
Response: ApiOk<{ items: Video[] }>
```

---

## Error Handling Pattern (Frontend)

```typescript
// core/lib/apiClient.ts
const res = await apiClient.post('/teacher/create-homework', data)
if (!res.data.ok) {
  throw new Error(res.data.error)  // surfaces in TanStack Query's error state
}
return res.data
```
