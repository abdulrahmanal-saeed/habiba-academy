export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItemData {
  id: string
  variant: ToastVariant
  message: string
  duration: number
}

type Listener = (items: ToastItemData[]) => void

let _items: ToastItemData[] = []
const _listeners = new Set<Listener>()

export function subscribeToasts(listener: Listener): () => void {
  _listeners.add(listener)
  return () => { _listeners.delete(listener) }
}

export function dismissToast(id: string): void {
  _items = _items.filter(t => t.id !== id)
  _listeners.forEach(l => l([..._items]))
}

function addToast(variant: ToastVariant, message: string, duration: number): void {
  const id = Math.random().toString(36).slice(2, 9)
  _items = [..._items, { id, variant, message, duration }]
  _listeners.forEach(l => l([..._items]))
  setTimeout(() => dismissToast(id), duration)
}

/* Imperative API — call from anywhere: toast.success('Saved!') */
export const toast = {
  success: (message: string, duration = 4000) => addToast('success', message, duration),
  error:   (message: string, duration = 5000) => addToast('error',   message, duration),
  warning: (message: string, duration = 4500) => addToast('warning', message, duration),
  info:    (message: string, duration = 4000) => addToast('info',    message, duration),
}
