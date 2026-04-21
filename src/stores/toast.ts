import { create } from 'zustand'

type Toast = {
  id: number
  message: string
  leaving: boolean
}

type ToastState = {
  toasts: Toast[]
  addToast: (message: string) => void
  removeToast: (id: number) => void
}

let nextId = 0
const VISIBLE_MS = 2500
const EXIT_MS = 200

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message, leaving: false }] }))
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) =>
          t.id === id ? { ...t, leaving: true } : t,
        ),
      }))
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, EXIT_MS)
    }, VISIBLE_MS)
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
