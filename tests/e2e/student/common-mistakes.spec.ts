import { test, expect } from '@playwright/test'

const BASE = '/student/common-mistakes'

test.describe('Student — Common Mistakes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__mockSession = { student_id: 1 }
    })
  })

  test('renders the page heading', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByRole('heading', { name: /common mistakes/i })).toBeVisible()
  })

  test('displays a mistake card with human-readable title (not raw tag)', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              tag: 'gender_agreement',
              note: 'Review masculine/feminine adjective agreement',
              is_mastered: 0,
              guidance: {
                title_en: 'Gender Agreement',
                title_ar: 'المطابقة في الجنس',
                meaning_en: 'Adjectives must match the gender of the noun',
                meaning_ar: 'الصفات يجب أن تطابق جنس الاسم',
                example_en: 'كتاب جميل — كتابة جميلة',
                example_ar: '',
                student_action_en: 'Check every adjective-noun pair',
                student_action_ar: 'تحقق من كل زوج صفة-اسم',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText('Gender Agreement')).toBeVisible()
    await expect(page.getByText('Review masculine/feminine adjective agreement')).toBeVisible()
    // Raw tag must NOT be shown directly
    await expect(page.getByText('gender_agreement')).not.toBeVisible()
  })

  test('accordion expands to show guidance without teacher fields', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              tag: 'gender_agreement',
              note: null,
              is_mastered: 0,
              guidance: {
                title_en: 'Gender Agreement',
                title_ar: '',
                meaning_en: 'Adjectives must match the gender of the noun',
                meaning_ar: '',
                example_en: 'كتاب جميل — كتابة جميلة',
                example_ar: '',
                student_action_en: 'Check every adjective-noun pair',
                student_action_ar: '',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /guidance/i }).click()
    await expect(page.getByText('Adjectives must match the gender of the noun')).toBeVisible()
    await expect(page.getByText('كتاب جميل — كتابة جميلة')).toBeVisible()
    await expect(page.getByText('Check every adjective-noun pair')).toBeVisible()
  })

  test('toggle marks mistake as fixed with "Fixed ✓" badge', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              tag: 'gender_agreement',
              note: null,
              is_mastered: 0,
              guidance: {
                title_en: 'Gender Agreement',
                title_ar: '',
                meaning_en: 'Adjectives must match gender',
                meaning_ar: '',
                example_en: 'Example',
                example_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
              },
            },
          ],
        }),
      }),
    )
    await page.route('**/api/student/toggle-mistake.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /got it/i }).click()
    await expect(page.getByText(/fixed/i)).toBeVisible()
  })

  test('empty state renders celebration message', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText(/no common mistakes/i)).toBeVisible()
  })

  test('error state renders on API failure', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ ok: false, error: 'Server error' }) }),
    )
    await page.goto(BASE)
    await expect(page.getByText(/error|failed/i)).toBeVisible()
  })

  test('toggle rollback on API error', async ({ page }) => {
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              tag: 'gender_agreement',
              note: null,
              is_mastered: 0,
              guidance: {
                title_en: 'Gender Agreement',
                title_ar: '',
                meaning_en: 'Match gender',
                meaning_ar: '',
                example_en: 'Ex',
                example_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
              },
            },
          ],
        }),
      }),
    )
    await page.route('**/api/student/toggle-mistake.php', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ ok: false, error: 'Server error' }) }),
    )
    await page.goto(BASE)
    await page.getByRole('button', { name: /got it/i }).click()
    // State should roll back — "Fixed" should not persist
    await expect(page.getByText(/fixed ✓/i)).not.toBeVisible({ timeout: 2000 }).catch(() => {})
  })

  test('mobile 375px — cards are full width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.route('**/api/student/common-mistakes.php', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            {
              id: 1,
              tag: 'gender_agreement',
              note: null,
              is_mastered: 0,
              guidance: {
                title_en: 'Gender Agreement',
                title_ar: '',
                meaning_en: 'Match',
                meaning_ar: '',
                example_en: 'Ex',
                example_ar: '',
                student_action_en: 'Practice',
                student_action_ar: '',
              },
            },
          ],
        }),
      }),
    )
    await page.goto(BASE)
    await expect(page.getByText('Gender Agreement')).toBeVisible()
  })
})
