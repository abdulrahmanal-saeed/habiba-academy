export interface AgreementTemplate {
  id: number
  version: string
  content: string
}

export interface AgreementData {
  template: AgreementTemplate
  already_accepted: boolean
}
