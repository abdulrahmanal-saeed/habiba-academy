import { test, expect, type Page } from '@playwright/test'

const URL = '/student/progress'

const MOCK_PROGRESS = {
  full_name: 'Fatima Al-Ahmad',
  level: 'B1',
  hw_count: 7,
  avg_pct: 85,
  sc_count: 3,
  perf_count: 2,
  sess_count: 4,
  streak: 5,
  score_history: [
    { title: 'Lesson 1', mcq_score: 8, mcq_total: 10, submitted_at: '2026-05-01 10:00:00' },
    { title: 'Lesson 2', mcq_score: 9, mcq_total: 10, submitted_at: '2026-05-05 10:00:00' },
    { title: 'Lesson 3', mcq_score: 6, mcq_total: 10, submitted_at: '2026-05-10 10:00:00' },
  ],
  achievements: [
    { emoji: '🎯', title_en: 'First Homework', title_ar: 'أول واجب' },
    { emoji: '📝', title_en: '5 Homeworks',    title_ar: '5 واجبات' },
    { emoji: '🎙️', title_en: 'First Recording', title_ar: 'أول تسجيل' },
    { emoji: '⭐', title_en: 'High Achiever',  title_ar: 'متفوق' },
  ],
  all_achievements: [
    { emoji: '🎯', title_en: 'First Homework', title_ar: 'أول واجب' },
    { emoji: '📝', title_en: '5 Homeworks',    title_ar: '5 واجبات' },
    { emoji: '📚', title_en: 'Homework Hero',  title_ar: 'بطل الواجبات' },
    { emoji: '💯', title_en: 'Perfect Score',  title_ar: 'درجة كاملة' },
    { emoji: '🎙️', title_en: 'First Recording', title_ar: 'أول تسجيل' },
    { emoji: '🗣️', title_en: 'Vocal Learner', title_ar: 'متعلم نشيط' },
    { emoji: '🔥', title_en: '3-Day Streak',   title_ar: '3 أيام متواصلة' },
    { emoji: '⚡', title_en: 'Week Warrior',   title_ar: 'محارب الأسبوع' },
    { emoji: '⭐', title_en: 'High Achiever',  title_ar: 'متفوق' },
    { emoji: '📈', title_en: 'Rising Star',    title_ar: 'نجم صاعد' },
  ],
}

async function mockApi(page: Page) {
  await page.route('**/api/student/progress.php', (route) =>
    route.fulfill({ json: { ok: true, data: MOCK_PROGRESS } }),
  )
}

test.describe('Student Progress — happy path', () => {
  test('shows level hero with CEFR badge and student name', async ({ page }) => {
    await mockApi(page)
    await page.goto(URL)

    await expect(page.getByText('My Progress')).toBeVisible()
    await expect(page.getByText('B1')).toBeVisible()
    await expect(page.getByText(/Intermediate/i)).toBeVisible()
    await expect(page.getByText('Fatima Al-Ahmad')).toBeVisible()
    await expect(page.getByText(/4 sessions completed/i)).toBeVisible()
  })

  test('shows stat chips with correct values', async ({ page }) => {
    await mockApi(page)
    await page.goto(URL)

    await expect(page.getByText('7')).toBeVisible()  // hw_count
    await expect(page.getByText('85%')).toBeVisible() // avg_pct
    await expect(page.getByText('3')).toBeVisible()   // sc_count
    await expect(page.getByText(/🔥5/)).toBeVisible() // streak
    await expect(page.getByText('4')).toBeVisible()   // sess_count
  })

  test('omits sessions chip when sess_count is 0', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ json: { ok: true, data: { ...MOCK_PROGRESS, sess_count: 0 } } }),
    )
    await page.goto(URL)
    await expect(page.getByText('Sessions')).not.toBeVisible()
  })

  test('shows — for avg_pct when null', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ json: { ok: true, data: { ...MOCK_PROGRESS, avg_pct: null } } }),
    )
    await page.goto(URL)
    await expect(page.getByText('—')).toBeVisible()
  })

  test('renders score chart with bars', async ({ page }) => {
    await mockApi(page)
    await page.goto(URL)
    await expect(page.getByText('MCQ Score History')).toBeVisible()
    await expect(page.getByText('Last 3 graded homeworks')).toBeVisible()
  })

  test('hides score chart when history is empty', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ json: { ok: true, data: { ...MOCK_PROGRESS, score_history: [] } } }),
    )
    await page.goto(URL)
    await expect(page.getByText('MCQ Score History')).not.toBeVisible()
  })

  test('shows earned and locked achievements', async ({ page }) => {
    await mockApi(page)
    await page.goto(URL)

    await expect(page.getByText('Achievements')).toBeVisible()
    await expect(page.getByText('First Homework')).toBeVisible()
    await expect(page.getByText('High Achiever')).toBeVisible()
    await expect(page.getByText('Coming Up')).toBeVisible()
    await expect(page.getByText('Homework Hero')).toBeVisible()
  })

  test('shows empty achievement message when none earned', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ json: { ok: true, data: { ...MOCK_PROGRESS, achievements: [] } } }),
    )
    await page.goto(URL)
    await expect(page.getByText(/Complete your first homework/i)).toBeVisible()
  })

  test('shows "Level not set yet" when level is null', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ json: { ok: true, data: { ...MOCK_PROGRESS, level: null } } }),
    )
    await page.goto(URL)
    await expect(page.getByText('Level not set yet')).toBeVisible()
  })
})

test.describe('Student Progress — error state', () => {
  test('shows error when API fails', async ({ page }) => {
    await page.route('**/api/student/progress.php', (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: 'Server error' } }),
    )
    await page.goto(URL)
    await expect(page.getByText(/Failed to load progress/i)).toBeVisible()
  })
})

test.describe('Student Progress — mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('renders correctly on mobile', async ({ page }) => {
    await mockApi(page)
    await page.goto(URL)

    await expect(page.getByText('My Progress')).toBeVisible()
    await expect(page.getByText('B1')).toBeVisible()
    await expect(page.getByText('Achievements')).toBeVisible()
  })
})
