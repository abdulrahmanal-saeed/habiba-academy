export interface AccessLinkEntry {
  name: string
  sub: string | null
  access_code: string | null
}

export interface AccessLinksData {
  base_url: string
  academies: AccessLinkEntry[]
  parents: AccessLinkEntry[]
  media_buyers: AccessLinkEntry[]
  login_urls: {
    academy: string
    parent: string
    media_buyer: string
  }
}

export interface AccessLinksResponse {
  ok: boolean
  data: AccessLinksData
}
