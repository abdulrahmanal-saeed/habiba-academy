export interface FeatureFlags {
  enable_videos_page: boolean
  show_videos_on_homepage: boolean
  enable_articles_page: boolean
  show_articles_on_homepage: boolean
}

export interface ProfileSettings {
  contact_whatsapp: string
  social_instagram: string
  social_facebook: string
  social_youtube: string
  social_tiktok: string
  teacher_photo_v: string
}

export interface OwnerSettings {
  flags: FeatureFlags
  profile: ProfileSettings
}

export type FlagKey = keyof FeatureFlags

export const FLAG_LABELS: Record<FlagKey, { label: string; desc: string }> = {
  enable_videos_page:        { label: 'Enable Videos Page',        desc: 'Show the Videos link publicly and allow /videos access.' },
  show_videos_on_homepage:   { label: 'Show Videos on Homepage',   desc: 'Render the Videos section on the landing page.' },
  enable_articles_page:      { label: 'Enable Articles Page',      desc: 'Show the Articles link publicly and allow /articles access.' },
  show_articles_on_homepage: { label: 'Show Articles on Homepage', desc: 'Render the Articles section on the landing page.' },
}

export interface OwnerSettingsResponse {
  ok: boolean
  data: OwnerSettings
}

export interface SettingsActionResponse {
  ok: boolean
  data: { message: string }
}
