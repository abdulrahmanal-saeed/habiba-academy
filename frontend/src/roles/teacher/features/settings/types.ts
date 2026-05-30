export type SiteSettings = Record<string, string>

export interface SettingsResponse {
  settings: SiteSettings
}

export interface UpdateSettingResponse {
  key: string
  value: string
}

export interface SettingDefinition {
  key: string
  label: string
  description: string
  group: string
  type: 'toggle' | 'text'
}

export const KNOWN_SETTINGS: SettingDefinition[] = [
  { key: 'enable_videos_page',       label: 'Videos Page',             description: 'Show videos page on public site',    group: 'Content', type: 'toggle' },
  { key: 'show_videos_on_homepage',  label: 'Videos on Homepage',      description: 'Feature videos on the homepage',     group: 'Content', type: 'toggle' },
  { key: 'enable_articles_page',     label: 'Articles Page',           description: 'Show articles page on public site',  group: 'Content', type: 'toggle' },
  { key: 'show_articles_on_homepage',label: 'Articles on Homepage',    description: 'Feature articles on the homepage',   group: 'Content', type: 'toggle' },
]
