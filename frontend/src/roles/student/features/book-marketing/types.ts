export interface BookProduct {
  id: number
  titleEn: string
  titleAr: string
  slug: string
  level: string
  price: number
}

export interface BookPackage {
  id: number
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  price: number
  originalPrice: number
  currency: string
  includesTeacherFeedback: boolean
  includesExtraReviewSession: boolean
}

export interface BookProductData {
  book: BookProduct
  package: BookPackage | null
  hasAccess: boolean
  accessStatus: string
  requestStatus: string | null
  canCheckout: boolean
  canPreview: boolean
}

export interface BookCheckoutForm {
  paymentMethod: string
  paymentReference: string
  studentNotes: string
}
