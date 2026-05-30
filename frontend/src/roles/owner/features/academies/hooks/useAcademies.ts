import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAcademies, getStudentOptions, saveAcademy, deleteAcademy } from '../api'

const QK = ['owner-academies'] as const
const STUDENTS_QK = ['owner-academy-students'] as const

export function useAcademies() {
  return useQuery({ queryKey: QK, queryFn: getAcademies, staleTime: 30_000 })
}

export function useStudentOptions() {
  return useQuery({ queryKey: STUDENTS_QK, queryFn: getStudentOptions, staleTime: 120_000 })
}

export function useSaveAcademy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) => saveAcademy(form),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteAcademy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAcademy(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: QK }),
  })
}
