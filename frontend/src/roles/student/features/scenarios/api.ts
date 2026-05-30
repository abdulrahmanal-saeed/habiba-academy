import { get, postForm } from '@/core/lib/apiClient'
import type { ApiOk } from '@/core/types'
import type { Scenario, ScenarioDetail, SubmitScenarioResult } from './types'

export async function getScenarios(): Promise<Scenario[]> {
  const res = await get<ApiOk<{ items: Scenario[] }>>('/api/student/scenarios.php')
  return res.items
}

export async function getScenarioDetail(id: number): Promise<ScenarioDetail> {
  const res = await get<ApiOk<{ data: ScenarioDetail }>>(
    `/api/student/scenario-detail.php?scenario_id=${id}`,
  )
  return res.data
}

export async function submitScenario(
  scenarioId: number,
  takeNo: number,
  audio: Blob,
): Promise<SubmitScenarioResult> {
  const fd = new FormData()
  fd.append('scenario_id', String(scenarioId))
  fd.append('take_no', String(takeNo))
  const ext = audio.type === 'audio/mp4' ? 'mp4' : 'webm'
  fd.append('audio', audio, `sc_${scenarioId}_t${takeNo}.${ext}`)
  const res = await postForm<ApiOk<SubmitScenarioResult>>(
    '/api/student/submit-scenario.php',
    fd,
  )
  return { recording_id: res.recording_id, take_no: res.take_no, audio_path: res.audio_path }
}
