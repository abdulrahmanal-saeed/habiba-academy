import * as RadixLabel from '@radix-ui/react-label'
import type { FC } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends RadixLabel.LabelProps {
  required?: boolean
}

export const Label: FC<LabelProps> = ({ className, children, required, ...props }) => (
  <RadixLabel.Root
    className={cn('block text-sm font-medium text-ink', className)}
    {...props}
  >
    {children}
    {required && <span className="ms-0.5 text-danger" aria-hidden="true">*</span>}
  </RadixLabel.Root>
)
