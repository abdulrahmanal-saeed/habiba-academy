import { test, expect, type Page } from '@playwright/test'

const LIST_URL   = '/student/materials'
const DETAIL_URL = '/student/materials/1'

const MOCK_LIST = [
  {
    id: 1,
    title: 'Lesson 5 Vocabulary PDF',
    type: 'pdf',
    href: '/uploads/materials/mat_1.pdf',
    is_file: true,
    description: 'Key vocabulary for lesson 5.',
    sort_order: 1,
    category: 'vocabulary',
    level: 'A2',
    language: 'both',
    estimated_study_minutes: 15,
    viewed_at: null,
    completed_at: null,
  },
  {
    id: 2,
    title: 'Pronunciation Video',
    type: 'video_link',
    href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    is_file: false,
    description: null,
    sort_order: 2,
    category: 'speaking_support',
    level: '',
    language: 'both',
    estimated_study_minutes: 0,
    viewed_at: '2026-01-10 10:00:00',
    completed_at: null,
  },
]

const MOCK_DETAIL = {
  ...MOCK_LIST[0],
  allow_download: 1,
  mime_type: 'application/pdf',
  original_filename: 'lesson5.pdf',
  progress_status: 'assigned',
  download_count: 0,
}

async function mockApis(page: Page) {
  await page.route('**/api/student/materials.php', (route) =>
    route.fulfill({ json: { ok: true, items: MOCK_LIST } }),
  )
  await page.route('**/api/student/material-detail.php**', (route) =>
    route.fulfill({ json: { ok: true, data: MOCK_DETAIL } }),
  )
  await page.route('**/api/student/material-progress.php', (route) =>
    route.fulfill({ json: { ok: true } }),
  )
}

test.describe('Student Materials — happy path', () => {
  test('shows material list with cards and metadata', async ({ page }) => {
    await mockApis(page)
    await page.goto(LIST_URL)

    await expect(page.getByText('My Materials')).toBeVisible()
    await expect(page.getByText('Lesson 5 Vocabulary PDF')).toBeVisible()
    await expect(page.getByText('Pronunciation Video')).toBeVisible()
    await expect(page.getByText('Vocabulary')).toBeVisible()
    await expect(page.getByText('A2')).toBeVisible()
    await expect(page.getByText('15 min')).toBeVisible()
    await expect(page.getByText('New')).toBeVisible()
    await expect(page.getByText('Viewed')).toBeVisible()
  })

  test('filters materials by text search', async ({ page }) => {
    await mockApis(page)
    await page.goto(LIST_URL)

    await page.getByPlaceholder('Search materials…').fill('vocabulary')
    await expect(page.getByText('Lesson 5 Vocabulary PDF')).toBeVisible()
    await expect(page.getByText('Pronunciation Video')).not.toBeVisible()
  })

  test('filters materials by type', async ({ page }) => {
    await mockApis(page)
    await page.goto(LIST_URL)

    await page.locator('select').first().selectOption('pdf')
    await expect(page.getByText('Lesson 5 Vocabulary PDF')).toBeVisible()
    await expect(page.getByText('Pronunciation Video')).not.toBeVisible()
  })

  test('navigates to detail page and shows viewer and buttons', async ({ page }) => {
    await mockApis(page)
    await page.goto(DETAIL_URL)

    await expect(page.getByText('Lesson 5 Vocabulary PDF')).toBeVisible()
    await expect(page.getByText('Mark Completed')).toBeVisible()
    await expect(page.getByText('Download')).toBeVisible()
    await expect(page.getByText('A2')).toBeVisible()
    await expect(page.getByText('15 min')).toBeVisible()
  })

  test('mark completed changes button state', async ({ page }) => {
    await mockApis(page)
    await page.goto(DETAIL_URL)

    await page.getByRole('button', { name: /Mark Completed/i }).click()
    await expect(page.getByText('Completed')).toBeVisible()
  })

  test('shows YouTube embed for video_link type', async ({ page }) => {
    const videoDetail = { ...MOCK_DETAIL, id: 2, title: 'Pronunciation Video',
      type: 'video_link', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      is_file: false, allow_download: 0 }
    await page.route('**/api/student/materials.php', (route) =>
      route.fulfill({ json: { ok: true, items: MOCK_LIST } }),
    )
    await page.route('**/api/student/material-detail.php**', (route) =>
      route.fulfill({ json: { ok: true, data: videoDetail } }),
    )
    await page.route('**/api/student/material-progress.php', (route) =>
      route.fulfill({ json: { ok: true } }),
    )

    await page.goto('/student/materials/2')
    const iframe = page.frameLocator('iframe[src*="youtube.com/embed"]')
    await expect(iframe.owner()).toBeVisible()
  })
})

test.describe('Student Materials — error state', () => {
  test('shows error when list API fails', async ({ page }) => {
    await page.route('**/api/student/materials.php', (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: 'Server error' } }),
    )
    await page.goto(LIST_URL)
    await expect(page.getByText(/Failed to load materials/i)).toBeVisible()
  })

  test('shows error when detail not found', async ({ page }) => {
    await page.route('**/api/student/material-detail.php**', (route) =>
      route.fulfill({ status: 404, json: { ok: false, error: 'Material not found' } }),
    )
    await page.goto(DETAIL_URL)
    await expect(page.getByText(/Material not found/i)).toBeVisible()
  })

  test('shows empty state when no materials', async ({ page }) => {
    await page.route('**/api/student/materials.php', (route) =>
      route.fulfill({ json: { ok: true, items: [] } }),
    )
    await page.goto(LIST_URL)
    await expect(page.getByText('No materials assigned yet.')).toBeVisible()
  })
})

test.describe('Student Materials — mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('list and detail render correctly on mobile', async ({ page }) => {
    await mockApis(page)
    await page.goto(LIST_URL)

    await expect(page.getByText('My Materials')).toBeVisible()
    await expect(page.getByText('Lesson 5 Vocabulary PDF')).toBeVisible()

    await page.getByText('Lesson 5 Vocabulary PDF').click()
    await expect(page.getByText('Mark Completed')).toBeVisible()
  })
})
