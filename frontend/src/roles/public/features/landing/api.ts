import { get } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Testimonial, PricingPlan, Article, Video } from './types'

export async function getTestimonials(): Promise<Testimonial[]> {
  const data = await get<ApiOk<{ items: Testimonial[] }>>('/api/public/testimonials')
  return data.items
}

export async function getPricingPlans(): Promise<PricingPlan[]> {
  const data = await get<ApiOk<{ items: PricingPlan[] }>>('/api/public/pricing')
  return data.items
}

export async function getArticles(): Promise<Article[]> {
  const data = await get<ApiOk<{ items: Article[] }>>('/api/public/articles')
  return data.items
}

export async function getVideos(): Promise<Video[]> {
  const data = await get<ApiOk<{ items: Video[] }>>('/api/public/videos')
  return data.items
}
