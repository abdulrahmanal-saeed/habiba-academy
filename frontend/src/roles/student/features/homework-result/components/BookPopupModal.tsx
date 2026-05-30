import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Modal } from '@/design-system/components'
import { Button } from '@/design-system/components'
import { bookMarketingEvent } from '../api'
import type { BookPopupConfig } from '../types'

export interface BookPopupModalProps {
  config: BookPopupConfig
}

const PENDING_KEY  = 'book_pending_popup'
const SUPPRESS_KEY = 'book_homework_popup_until'
const SUPPRESS_MS  = 3 * 24 * 60 * 60 * 1000   // 3 days (PHP logic)
const DELAY_MS     = 700

function shouldTrigger(allowed: boolean): boolean {
  if (!allowed) return false
  try {
    if (localStorage.getItem(PENDING_KEY) !== 'homework') return false
    const until = parseInt(localStorage.getItem(SUPPRESS_KEY) ?? '0', 10)
    return !until || Date.now() >= until
  } catch {
    return false
  }
}

export const BookPopupModal: FC<BookPopupModalProps> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!shouldTrigger(config.allowed)) return

    // Consume pending flag + set 3-day suppression before showing
    try {
      localStorage.removeItem(PENDING_KEY)
      localStorage.setItem(SUPPRESS_KEY, String(Date.now() + SUPPRESS_MS))
    } catch { /* silent */ }

    // Fire analytics (non-blocking)
    void bookMarketingEvent('book_popup_homework_last_shown', String(config.offerId))

    // Show after 700ms delay — setIsOpen inside setTimeout is async, not lint-blocked
    const timer = setTimeout(() => setIsOpen(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [config.allowed, config.offerId])

  const productUrl  = `/student-book-product.php?book_id=${config.offerId}`
  const checkoutUrl = `/student-book-checkout.php?book_id=${config.offerId}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="🎉 أحسنتِ! تم تسليم الواجب"
      size="sm"
      footer={
        <div className="flex flex-col gap-2 w-full">
          <Button as="a" href={checkoutUrl} size="sm">
            اشتري / طلب تفعيل
          </Button>
          <Button as="a" href={productUrl} variant="secondary" size="sm">
            اعرفي المزيد
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            لاحقاً
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-sm" style={{ color: 'var(--fg)' }} dir="rtl">
        <p>هل تريدين تدريباً إضافياً قبل الحصة القادمة؟</p>
        <p style={{ color: 'var(--muted)' }}>
          الكتاب التفاعلي متوفر داخل حسابك — استمعي، تدرّبي، اكتبي، سجّلي محادثات، واحصلي على تصحيح المدرّسة.
        </p>
        <ul className="flex flex-col gap-1 ps-4" style={{ color: 'var(--muted)', listStyleType: 'disc' }}>
          <li>الكتاب التفاعلي كاملاً</li>
          <li>تصحيح المدرّسة</li>
          <li>حصة مراجعة إضافية</li>
        </ul>
        <div
          className="rounded-xl px-4 py-3 text-center font-bold text-lg mt-1"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          80 درهم{' '}
          <del className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
            120 درهم
          </del>
        </div>
      </div>
    </Modal>
  )
}
