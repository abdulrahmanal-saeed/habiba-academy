import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HeroSection } from './components/HeroSection'
import { StatsBar } from './components/StatsBar'
import { FeaturesGrid } from './components/FeaturesGrid'
import { HowItWorks } from './components/HowItWorks'
import { TestimonialsSection } from './components/TestimonialsSection'
import { PricingSection } from './components/PricingSection'
import { TeacherBio } from './components/TeacherBio'
import { getTestimonials, getPricingPlans } from './api'
import { STALE } from '@/core/lib/queryClient'

export const LandingPage: FC = () => {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['public', 'testimonials'],
    queryFn: getTestimonials,
    staleTime: STALE.articles,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['public', 'pricing'],
    queryFn: getPricingPlans,
    staleTime: STALE.settings,
  })

  return (
    <main>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <TestimonialsSection testimonials={testimonials} />
      <PricingSection plans={plans} />
      <TeacherBio />
    </main>
  )
}
