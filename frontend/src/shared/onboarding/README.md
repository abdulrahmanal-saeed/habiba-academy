# Shared Onboarding Tour

Role-aware guided tour system using a spotlight + tooltip overlay. Renders via `createPortal` into `document.body`.

## Usage

Mount `<OnboardingTour />` once in each role's root layout. Then trigger tours with `useTour`:

```tsx
// In role root layout
import { OnboardingTour } from '@/shared/onboarding'
<OnboardingTour />

// In any component
import { useTour } from '@/shared/onboarding'
import type { TourConfig } from '@/shared/onboarding'

const STUDENT_TOUR: TourConfig = {
  id: 'student-dashboard-v1',
  role: 'student',
  steps: [
    {
      id: 'nav',
      targetId: 'sidebar-nav',
      title: 'قائمة التنقل',
      description: 'من هنا يمكنك التنقل بين أقسام لوحة التحكم.',
      placement: 'right',
    },
  ],
}

function Dashboard() {
  const { startTour, isCompleted } = useTour()
  useEffect(() => {
    if (!isCompleted(STUDENT_TOUR.id)) startTour(STUDENT_TOUR)
  }, [])
}
```

## Architecture

- **`onboarding.store.ts`** — Zustand store, persists only `completedTours` to localStorage
- **`OnboardingTour.tsx`** — Portal-based orchestrator; measures target element via `getBoundingClientRect()`, re-measures on window resize
- **`TourOverlay.tsx`** — SVG full-screen backdrop with rectangular cutout via `<mask>` element. Click outside to skip.
- **`TourSpotlight.tsx`** — Animated pulsing border ring drawn with `box-shadow`
- **`TourTooltip.tsx`** — Floating card positioned relative to target rect + placement prop

## Notes

- Tours are skipped automatically if `tourId` is already in `completedTours`
- Skipping a tour marks it as completed (won't show again)
- Target elements need an `id` matching `step.targetId`
- `scrollIntoView` runs before `getBoundingClientRect()` with a 300ms delay
