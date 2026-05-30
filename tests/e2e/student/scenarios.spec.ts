import { test, expect, type Page } from '@playwright/test'

const SCENARIOS_URL = '/student/scenarios'
const DETAIL_URL    = '/student/scenarios/1'

const MOCK_SCENARIOS = [
  {
    id: 1,
    title: 'At the Coffee Shop',
    sc_date: new Date().toISOString().slice(0, 10),
    publish_at: null,
    time_limit_seconds: 60,
    situation: 'You are ordering a drink.',
    prompt: 'Order a coffee and ask for the price.',
    keywords: ['قهوة', 'سعر'],
    model_answer: 'ممكن قهوة لو سمحت، بكام؟',
    recording_count: 0,
  },
]

const MOCK_DETAIL = {
  data: {
    scenario: { ...MOCK_SCENARIOS[0], recording_count: 0 },
    recordings: [],
    next_take: 1,
  },
}

async function mockApis(page: Page) {
  await page.route('**/api/student/scenarios.php', (route) =>
    route.fulfill({ json: { ok: true, items: MOCK_SCENARIOS } }),
  )
  await page.route('**/api/student/scenario-detail.php**', (route) =>
    route.fulfill({ json: { ok: true, ...MOCK_DETAIL } }),
  )
  await page.route('**/api/student/submit-scenario.php', (route) =>
    route.fulfill({ json: { ok: true, recording_id: 99, take_no: 1, audio_path: '/uploads/scenario/1/sc_1_t1.webm' } }),
  )
}

// Mock MediaRecorder so tests work without a real microphone
async function mockMediaRecorder(page: Page) {
  await page.addInitScript(() => {
    const fakeBlob = new Blob(['fake-audio'], { type: 'audio/webm' })
    class FakeMediaRecorder extends EventTarget {
      static isTypeSupported(type: string) { return type === 'audio/webm' }
      state: string = 'inactive'
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
        setTimeout(() => {
          if (this.ondataavailable) this.ondataavailable({ data: fakeBlob })
          this.state = 'inactive'
          if (this.onstop) this.onstop()
        }, 100)
      }
      stop() {
        this.state = 'inactive'
        if (this.onstop) this.onstop()
      }
    }
    // @ts-expect-error override global
    window.MediaRecorder = FakeMediaRecorder
    // @ts-expect-error override getUserMedia
    navigator.mediaDevices = {
      getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop: () => {} }] }),
    }
  })
}

test.describe('Student Scenarios — happy path', () => {
  test('shows scenario list and navigates to detail', async ({ page }) => {
    await mockApis(page)
    await page.goto(SCENARIOS_URL)

    await expect(page.getByText('Speaking Scenarios')).toBeVisible()
    await expect(page.getByText('At the Coffee Shop')).toBeVisible()
    await expect(page.getByText('Today')).toBeVisible()

    await page.getByText('At the Coffee Shop').click()
    await expect(page).toHaveURL(DETAIL_URL)
    await expect(page.getByText('Record Your Answer')).toBeVisible()
  })

  test('records and submits a take, then shows confidence rating', async ({ page }) => {
    await mockApis(page)
    await mockMediaRecorder(page)
    await page.goto(DETAIL_URL)

    await page.getByRole('button', { name: /Start Recording/i }).click()
    await page.waitForTimeout(200)
    await expect(page.getByRole('button', { name: /Submit Recording/i })).toBeVisible()

    await page.getByRole('button', { name: /Submit Recording/i }).click()
    await expect(page.getByText(/How confident were you/i)).toBeVisible()

    await page.getByRole('button', { name: /Pretty good/i }).click()
  })

  test('shows context, mission and keywords on detail page', async ({ page }) => {
    await mockApis(page)
    await page.goto(DETAIL_URL)

    await expect(page.getByText('📍 Context')).toBeVisible()
    await expect(page.getByText('You are ordering a drink.')).toBeVisible()
    await expect(page.getByText('🎯 Your Mission')).toBeVisible()
    await expect(page.getByText('قهوة')).toBeVisible()
  })

  test('model answer visible after first recording in list', async ({ page }) => {
    const detailWithRec = {
      data: {
        scenario: { ...MOCK_SCENARIOS[0], recording_count: 1 },
        recordings: [
          { id: 1, take_no: 1, audio_path: '/uploads/scenario/1/sc_1_t1.webm',
            teacher_note: null, submitted_at: '01 Jan 2026 10:00', chips: [] },
        ],
        next_take: 2,
      },
    }
    await page.route('**/api/student/scenarios.php', (route) =>
      route.fulfill({ json: { ok: true, items: [{ ...MOCK_SCENARIOS[0], recording_count: 1 }] } }),
    )
    await page.route('**/api/student/scenario-detail.php**', (route) =>
      route.fulfill({ json: { ok: true, ...detailWithRec } }),
    )
    await page.goto(DETAIL_URL)

    await expect(page.getByText('Model Answer')).toBeVisible()
    await expect(page.getByText('Previous Recordings')).toBeVisible()
    await expect(page.getByText('Take #1')).toBeVisible()
  })
})

test.describe('Student Scenarios — error state', () => {
  test('shows error when scenarios list fails', async ({ page }) => {
    await page.route('**/api/student/scenarios.php', (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: 'Server error' } }),
    )
    await page.goto(SCENARIOS_URL)
    await expect(page.getByText(/Failed to load scenarios/i)).toBeVisible()
  })

  test('shows error when scenario detail not found', async ({ page }) => {
    await page.route('**/api/student/scenario-detail.php**', (route) =>
      route.fulfill({ status: 404, json: { ok: false, error: 'Scenario not found' } }),
    )
    await page.goto(DETAIL_URL)
    await expect(page.getByText(/Scenario not found/i)).toBeVisible()
  })
})

test.describe('Student Scenarios — mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('list and detail render correctly on mobile', async ({ page }) => {
    await mockApis(page)
    await page.goto(SCENARIOS_URL)

    await expect(page.getByText('Speaking Scenarios')).toBeVisible()
    const card = page.locator('.rounded-xl').first()
    await expect(card).toBeVisible()

    await page.getByText('At the Coffee Shop').click()
    await expect(page.getByRole('button', { name: /Start Recording/i })).toBeVisible()
  })
})
