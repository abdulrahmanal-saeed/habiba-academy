export type { AcademyStudent, AcademyKPIs } from '../dashboard/types'

export interface AcademyStudentsData {
  students: import('../dashboard/types').AcademyStudent[]
  kpis: import('../dashboard/types').AcademyKPIs
}
