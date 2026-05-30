export type TourPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TourStep {
  id: string
  targetId: string
  title: string
  description: string
  placement: TourPlacement
}

export interface TourConfig {
  id: string
  role: string
  steps: TourStep[]
}
