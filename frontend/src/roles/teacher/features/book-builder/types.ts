export interface BuilderLesson {
  id: number
  lesson_number: number
  unit_type: string
  title_en: string
  title_ar: string
  slug: string
  status: string
  has_content: boolean
}

export interface BuilderBook {
  id: number
  title_en: string
  title_ar: string
  slug: string
  level: string
  status: string
  lesson_count: number
  lessons: BuilderLesson[]
}

export interface BooksListData {
  books: BuilderBook[]
}

export interface BuilderLessonDetail {
  id: number
  book_id: number
  lesson_number: number
  unit_type: string
  title_en: string
  title_ar: string
  slug: string
  status: string
  book_title_en: string
  has_content: boolean
}

export interface BuilderLessonData {
  lesson: BuilderLessonDetail
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any> | null
}

export interface SaveLessonPayload {
  lesson_id?: number
  book_id?: number
  title_en?: string
  title_ar?: string
  slug?: string
  unit_type?: string
  status?: string
  sort_order?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: Record<string, any>
}

export interface SaveLessonResult {
  lesson_id: number
  created?: boolean
  updated?: boolean
  lesson_number?: number
}

// Section types for the builder form
export type SectionKind =
  | 'title'
  | 'passage'
  | 'audio'
  | 'video'
  | 'image'
  | 'vocab'
  | 'grammar'
  | 'dialogue'
  | 'mcq'
  | 'match'
  | 'writing'
  | 'speaking'

export interface BuilderSection {
  id: string
  kind: SectionKind
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}
