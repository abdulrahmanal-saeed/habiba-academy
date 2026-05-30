import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

/* ── CSRF token — fetched once on app mount, injected on all mutations ── */
let _csrf = ''

export function setCsrfToken(token: string): void {
  _csrf = token
}

/* ── Axios instance ─────────────────────────────────────────────────── */
const instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,           // PHP session cookie always sent
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/* ── Request interceptor: inject _csrf on mutations ─────────────────── */
instance.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? ''
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) || !_csrf) {
    return config
  }

  if (config.data instanceof FormData) {
    config.data.append('_csrf', _csrf)
  } else {
    const existing = (config.data as Record<string, unknown> | null | undefined) ?? {}
    config.data = { ...existing, _csrf }
  }

  return config
})

/* ── Response interceptor: surface ok:false as Error ────────────────── */
instance.interceptors.response.use((response) => {
  const d: unknown = response.data
  if (
    d !== null &&
    typeof d === 'object' &&
    'ok' in d &&
    (d as { ok: unknown }).ok === false
  ) {
    const msg = (d as { error?: string }).error ?? 'Request failed'
    return Promise.reject(new Error(msg))
  }
  return response
})

/* ── Fetch CSRF token from server (call once on app mount) ──────────── */
export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await instance.get<{ ok: boolean; csrf?: string }>('/api/auth/csrf')
    if (res.data.ok && res.data.csrf) {
      _csrf = res.data.csrf
    }
  } catch {
    // Silent — app still works; mutations will fail gracefully server-side
  }
}

/* ── Typed helpers ──────────────────────────────────────────────────── */

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await instance.get<T>(url, config)
  return res.data
}

export async function post<T>(
  url: string,
  data?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await instance.post<T>(url, data, config)
  return res.data
}

export async function postForm<T>(
  url: string,
  form: FormData | object,
  config?: AxiosRequestConfig,
): Promise<T> {
  let formData: FormData
  if (form instanceof FormData) {
    formData = form
  } else {
    formData = new FormData()
    Object.entries(form as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, String(v))
    })
  }
  const res = await instance.post<T>(url, formData, {
    ...config,
    headers: { 'Content-Type': 'multipart/form-data', ...config?.headers },
  })
  return res.data
}

export const apiClient = { get, post, postForm }

export default instance
