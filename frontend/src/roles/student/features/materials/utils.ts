import type { MaterialType, ProgressStatus } from './types'

export const MATERIAL_TYPES: Record<MaterialType, string> = {
  video:      'Video',
  video_link: 'Video Link',
  audio:      'Audio',
  pdf:        'PDF',
  pptx:       'PowerPoint',
  document:   'Document',
  image:      'Image',
  link:       'External Link',
  article:    'Text Article',
  html:       'HTML Lesson',
  mixed:      'Mixed Lesson',
}

export const MATERIAL_CATEGORIES: Record<string, string> = {
  lesson_slides:      'Lesson slides',
  reading_practice:   'Reading practice',
  listening_practice: 'Listening practice',
  speaking_support:   'Speaking support',
  writing_practice:   'Writing practice',
  vocabulary:         'Vocabulary',
  grammar_support:    'Grammar support',
  child_literacy:     'Child literacy',
  work_arabic:        'Work Arabic',
  emirati_dialect:    'Emirati dialect',
  egyptian_dialect:   'Egyptian dialect',
  homework_support:   'Homework support',
  review_material:    'Review material',
}

export function extractEmbedUrl(url: string): string {
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/,
  )
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`

  return ''
}

export function deriveProgressStatus(
  viewedAt: string | null,
  completedAt: string | null,
): ProgressStatus {
  if (completedAt) return 'completed'
  if (viewedAt) return 'viewed'
  return 'assigned'
}
