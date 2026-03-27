type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners: Set<Listener> = new Set()

function notify() {
  listeners.forEach((fn) => fn([...toasts]))
}

export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getToasts() {
  return [...toasts]
}

function addToast(message: string, type: ToastType, duration = 3500) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, duration)
}

export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error', 4500),
  info: (message: string) => addToast(message, 'info'),
}
