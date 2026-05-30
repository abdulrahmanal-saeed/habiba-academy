import { test, expect, type Page } from '@playwright/test'

const URL = '/student/flashcards'

const MOCK_CARDS = [
  {
    card_type: 'word',
    id: 1,
    front: 'كتب',
    back: 'To write',
    hint: 'Practice 5 sentences using كتب with different subjects.',
    review_state: '',
    next_review_at: null,
    review_count: 0,
    is_mastered: 0,
  },
  {
    card_type: 'mistake',
    id: 2,
    front: 'gender agreement',
    back: 'Arabic words must match masculine/feminine forms.',
    hint: 'Practice 5 sentences with هذا/هذه + noun + color.',
    review_state: 'almost',
    next_review_at: '2026-05-19 08:00:00',
    review_count: 3,
    is_mastered: 0,
  },
]

async function mockApis(page: Page) {
  await page.route('**/api/student/flashcards.php', (route) =>
    route.fulfill({ json: { ok: true, items: MOCK_CARDS } }),
  )
  await page.route('**/api/student/flashcard-review.php', (route) =>
    route.fulfill({ json: { ok: true } }),
  )
}

test.describe('Student Flashcards — happy path', () => {
  test('shows first card front and counter', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    await expect(page.getByText('Flashcards')).toBeVisible()
    await expect(page.getByText('كتب')).toBeVisible()
    await expect(page.getByText('1 / 2')).toBeVisible()
    await expect(page.getByText('Practice Word')).toBeVisible()
  })

  test('reveal shows back and hint', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    await page.getByRole('button', { name: /Reveal/i }).click()
    await expect(page.getByText('To write')).toBeVisible()
    await expect(page.getByText(/Practice 5 sentences/i)).toBeVisible()
  })

  test('Got it advances to next card', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    await page.getByRole('button', { name: /Reveal/i }).click()
    await page.getByRole('button', { name: /Got it/i }).click()

    await expect(page.getByText('gender agreement')).toBeVisible()
    await expect(page.getByText('2 / 2')).toBeVisible()
    await expect(page.getByText('Common Mistake')).toBeVisible()
  })

  test('shows Done for now after all cards rated', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    // Rate first card
    await page.getByRole('button', { name: /Reveal/i }).click()
    await page.getByRole('button', { name: /Got it/i }).click()

    // Rate second card
    await page.getByRole('button', { name: /Reveal/i }).click()
    await page.getByRole('button', { name: /Almost/i }).click()

    await expect(page.getByText('Done for now.')).toBeVisible()
  })

  test('shows review count when card has been reviewed before', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    // Advance to second card (review_count = 3)
    await page.getByRole('button', { name: /Reveal/i }).click()
    await page.getByRole('button', { name: /Got it/i }).click()
    await expect(page.getByText(/Reviewed 3 times/i)).toBeVisible()
  })
})

test.describe('Student Flashcards — empty state', () => {
  test('shows no cards due when list is empty', async ({ page }) => {
    await page.route('**/api/student/flashcards.php', (route) =>
      route.fulfill({ json: { ok: true, items: [] } }),
    )
    await page.goto(URL)
    await expect(page.getByText('No cards due now.')).toBeVisible()
  })
})

test.describe('Student Flashcards — error handling', () => {
  test('shows error when list API fails', async ({ page }) => {
    await page.route('**/api/student/flashcards.php', (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: 'Server error' } }),
    )
    await page.goto(URL)
    await expect(page.getByText(/Failed to load flashcards/i)).toBeVisible()
  })

  test('shows error and stays on card when review POST fails', async ({ page }) => {
    await page.route('**/api/student/flashcards.php', (route) =>
      route.fulfill({ json: { ok: true, items: [MOCK_CARDS[0]] } }),
    )
    await page.route('**/api/student/flashcard-review.php', (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: 'Save failed' } }),
    )
    await page.goto(URL)

    await page.getByRole('button', { name: /Reveal/i }).click()
    await page.getByRole('button', { name: /Got it/i }).click()

    // Card should NOT advance
    await expect(page.getByText('كتب')).toBeVisible()
    await expect(page.getByText(/Save failed|Could not save/i)).toBeVisible()
  })
})

test.describe('Student Flashcards — mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('renders and functions on mobile', async ({ page }) => {
    await mockApis(page)
    await page.goto(URL)

    await expect(page.getByText('Flashcards')).toBeVisible()
    await expect(page.getByText('كتب')).toBeVisible()
    await page.getByRole('button', { name: /Reveal/i }).click()
    await expect(page.getByText('To write')).toBeVisible()
  })
})
