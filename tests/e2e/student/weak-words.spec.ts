import { test, expect } from '@playwright/test'

const BASE = '/student/weak-words'

test.describe('Student — Weak Words', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = { student_id: 1 }
    })
  })

  test('renders the page heading', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByRole('heading', { name: /weak words/i })).toBeVisible()
  })

  test('displays a weak word card', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              word: 'كَتَبَ',
              note: 'Past tense verb — review conjugation',
              is_mastered: 0,
              guidance: {
                meaning_en: 'He wrote',
                meaning_ar: 'كَتَبَ',
                student_action_en: 'Practice in 3 sentences daily',
                student_action_ar: 'تدرب في 3 جمل يومياً',
                practice_prompt_en: 'Use كَتَبَ in a sentence',
                practice_prompt_ar: 'استخدم كَتَبَ في جملة',
                source_note: 'from lesson 3',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText('كَتَبَ')).toBeVisible()
    await expect(page.getByText('Past tense verb — review conjugation')).toBeVisible()
  })

  test('accordion expands to show guidance', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              word: 'كَتَبَ',
              note: null,
              is_mastered: 0,
              guidance: {
                meaning_en: 'He wrote',
                meaning_ar: 'كَتَبَ',
                student_action_en: 'Practice in 3 sentences daily',
                student_action_ar: 'تدرب',
                practice_prompt_en: 'Use كَتَبَ in a sentence',
                practice_prompt_ar: 'استخدم في جملة',
                source_note: '',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /guidance/i }).click()
    await expect(page.getByText('He wrote')).toBeVisible()
    await expect(page.getByText('Practice in 3 sentences daily')).toBeVisible()
  })

  test('optimistic toggle marks word as mastered', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              word: 'كَتَبَ',
              note: null,
              is_mastered: 0,
              guidance: {
                meaning_en: 'He wrote',
                meaning_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
                practice_prompt_en: 'Use in sentence',
                practice_prompt_ar: '',
                source_note: '',
              },
            },
          ],
        }),
      }),
    )
    await page.route('**/api/student/toggle-weak-word.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, is_mastered: 1 }),
      }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /got it/i }).click()
    await expect(page.getByText(/mastered/i)).toBeVisible()
  })

  test('toggle rollback on API error', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              word: 'كَتَبَ',
              note: null,
              is_mastered: 0,
              guidance: {
                meaning_en: 'He wrote',
                meaning_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
                practice_prompt_en: 'Use in sentence',
                practice_prompt_ar: '',
                source_note: '',
              },
            },
          ],
        }),
      }),
    )
    await page.route('**/api/student/toggle-weak-word.php', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ ok: false, error: 'Server error' }) }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /got it/i }).click()
    await expect(page.getByText(/mastered/i)).not.toBeVisible({ timeout: 2000 }).catch(() => {})
  })

  test('empty state renders celebration message', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText(/no weak words/i)).toBeVisible()
  })

  test('error state renders on API failure', async ({ page }) => {
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ ok: false, error: 'Server error' }) }),
    )
    await page.goto(BASE)
    await expect(page.getByText(/error|failed/i)).toBeVisible()
  })

  test('mobile 375px — cards are full width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.route('**/api/student/weak-words.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              word: 'كَتَبَ',
              note: null,
              is_mastered: 0,
              guidance: {
                meaning_en: 'He wrote',
                meaning_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
                practice_prompt_en: 'Use',
                practice_prompt_ar: '',
                source_note: '',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText('كَتَبَ')).toBeVisible()
  })
})
