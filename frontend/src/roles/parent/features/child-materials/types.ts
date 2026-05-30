export interface MaterialItem {
  id: number
  title: string
  type: string
  category: string
  description: string | null
  external_url: string | null
  sort_order: number
  viewed: boolean
}

export interface ChildMaterialsData {
  child: { id: number; full_name: string; login_code: string; level: string }
  materials: MaterialItem[]
}
