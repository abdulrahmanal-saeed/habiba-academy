import { apiClient } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { ScenarioCreatePayload, ScenarioItem, ScenarioRecording } from './types'

interface CreateScenarioResponse {
  scenario_id: number
  title: string
  publish_at: string | null
  effective_status: string
}

interface StudentScenariosResponse {
  scenarios: ScenarioItem[]
}

interface StudentConversationsResponse {
  conversations: ScenarioRecording[]
}

export const scenariosApi = {
  createScenario: (payload: ScenarioCreatePayload) =>
    apiClient.postForm<ApiOk<CreateScenarioResponse>>('/api/teacher/create-scenario.php', payload),

  deleteScenario: (id: number) =>
    apiClient.postForm<ApiOk<Record<string, never>>>('/api/teacher/scenario-delete.php', { id }),

  getStudentScenarios: (studentId: number) =>
    apiClient.get<ApiOk<StudentScenariosResponse>>(
      `/api/teacher/student-scenarios.php?student_id=${studentId}`,
    ),

  getStudentConversations: (studentId: number) =>
    apiClient.get<ApiOk<StudentConversationsResponse>>(
      `/api/teacher/student-conversations.php?student_id=${studentId}`,
    ),
}
