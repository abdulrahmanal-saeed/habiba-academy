export type CardType = 'word' | 'mistake'
export type ReviewState = 'got_it' | 'almost' | 'missed'

export interface FlashCard {
  card_type: CardType
  id: number
  front: string
  back: string | null
  hint: string
  review_state: ReviewState | ''
  next_review_at: string | null
  review_count: number
  is_mastered: 0 | 1
}
