export interface StudentTestimonial {
  id: number
  student_id: number
  student_name: string
  student_level: string | null
  rating: number
  testimonial_text: string | null
  review_status: 'pending' | 'approved' | 'rejected'
  is_published: 0 | 1
  updated_at: string
}

export interface PlatformTestimonial {
  id: number
  submitter_type: string
  public_display_name: string
  level: string
  rating: number
  testimonial_text: string | null
  audio_url: string | null
  media_type: string
  review_status: string
  is_published: 0 | 1
  created_at: string
}

export interface PublicTestimonial {
  id: number
  name: string
  level: string
  rating: number
  message: string
  is_approved: 0 | 1
  submitted_at: string
}

export interface TestimonialsData {
  student: StudentTestimonial[]
  platform: PlatformTestimonial[]
  public: PublicTestimonial[]
}
