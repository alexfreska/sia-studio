import { create } from 'zustand'

type SettingsState = {
  open: boolean
  toggle: () => void
  openPanel: () => void
  close: () => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  openPanel: () => set({ open: true }),
  close: () => set({ open: false }),
}))
