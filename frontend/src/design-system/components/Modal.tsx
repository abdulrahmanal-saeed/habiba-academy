import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import { X } from 'lucide-react'
import { modalVariant, modalBackdrop } from '@/design-system/animations'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  hideClose?: boolean
  children: ReactNode
  footer?: ReactNode
}

const SIZE: Record<NonNullable<ModalProps['size']>, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  full: 'max-w-[95vw]',
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  hideClose = false,
  children,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!isOpen) return

    const prevFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    /* Auto-focus first focusable element */
    const raf = requestAnimationFrame(() => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      focusable?.[0]?.focus()
    })

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      prevFocus?.focus()
    }
  }, [isOpen])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              key="dialog"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-desc' : undefined}
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full ${SIZE[size]} bg-card rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] flex flex-col max-h-[90vh]`}
            >
              {/* Header */}
              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-[color:var(--border-soft)]">
                  <div>
                    {title && <h2 id="modal-title" className="text-xl font-semibold text-ink">{title}</h2>}
                    {description && <p id="modal-desc" className="mt-1 text-sm text-muted">{description}</p>}
                  </div>
                  {!hideClose && (
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={onClose}
                      className="shrink-0 p-1.5 rounded-[var(--radius-sm)] text-muted hover:text-ink hover:bg-accent-soft transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="p-6 pt-4 border-t border-[color:var(--border-soft)] flex justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
