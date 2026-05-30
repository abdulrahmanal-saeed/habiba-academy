import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DrawerSide = 'start' | 'end' | 'top' | 'bottom'

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  side?: DrawerSide
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hideClose?: boolean
  children: ReactNode
  footer?: ReactNode
}

const SIDE_CLASSES: Record<DrawerSide, string> = {
  start:  'inset-y-0 start-0 h-full',
  end:    'inset-y-0 end-0 h-full',
  top:    'inset-x-0 top-0 w-full',
  bottom: 'inset-x-0 bottom-0 w-full',
}

const SIDE_INIT: Record<DrawerSide, Record<string, string>> = {
  start:  { x: '-100%' },
  end:    { x: '100%' },
  top:    { y: '-100%' },
  bottom: { y: '100%' },
}

const SIZE_W: Record<NonNullable<DrawerProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export const Drawer: FC<DrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  side = 'end',
  size = 'md',
  hideClose = false,
  children,
  footer,
}) => {
  const isVertical = side === 'top' || side === 'bottom'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  key="drawer-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  key="drawer-content"
                  initial={{ ...SIDE_INIT[side], opacity: 0.6 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ ...SIDE_INIT[side], opacity: 0.6 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className={cn(
                    'fixed z-[1001] flex flex-col bg-card shadow-[var(--shadow-lg)]',
                    'focus:outline-none',
                    SIDE_CLASSES[side],
                    !isVertical && SIZE_W[size],
                    side === 'start' && 'border-e border-[color:var(--border)]',
                    side === 'end'   && 'border-s border-[color:var(--border)]',
                    side === 'top'   && 'border-b border-[color:var(--border)]',
                    side === 'bottom'&& 'border-t border-[color:var(--border)]',
                  )}
                >
                  {/* Header */}
                  {(title || !hideClose) && (
                    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border-soft)] px-6 py-4">
                      <div>
                        {title && (
                          <Dialog.Title className="text-lg font-semibold text-ink">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-0.5 text-sm text-muted">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {!hideClose && (
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            aria-label="Close"
                            className="shrink-0 rounded-[var(--radius-sm)] p-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-ink"
                          >
                            <X size={18} />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

                  {/* Footer */}
                  {footer && (
                    <div className="flex justify-end gap-3 border-t border-[color:var(--border-soft)] px-6 py-4">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
