export interface Testimonial {
  id: number
  name: string
  avatar?: string
  country: string
  rating: number
  body: string
  createdAt: string
}

export interface PricingPlan {
  id: number
  slug: string
  name: string
  priceAed: number      // stored in fils (AED × 100)
  periodLabel: string   // e.g. "شهرياً"
  description: string
  features: string[]
  isPopular: boolean
  ctaLabel?: string
}

export interface Article {
  id: number
  slug: string
  title: string
  excerpt: string
  coverUrl?: string
  publishedAt: string
}

export interface Video {
  id: number
  slug: string
  title: string
  thumbnailUrl?: string
  durationSeconds: number
  publishedAt: string
}
