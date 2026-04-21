import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { APP_KEY } from '../lib/constants'
import { PROVIDER_IDS } from '../lib/providers'
import { maskedSuffix } from '../lib/redact'
import type { ProviderId } from '../types/providers'

type ProviderMeta = {
  configured: true
  addedAt: number
  suffix: string
}

type KeyMetaState = {
  meta: Partial<Record<ProviderId, ProviderMeta>>
  setMeta: (id: ProviderId, suffix: string) => void
  removeMeta: (id: ProviderId) => void
  clearMeta: () => void
}

// The raw-key store deliberately exposes only read/write helpers below.
// Keeping the actual map off the public API makes it harder to accidentally
// subscribe to, render, or log secret material from a component.
type SecretsState = {
  keys: Partial<Record<ProviderId, string>>
  set: (id: ProviderId, key: string) => void
  remove: (id: ProviderId) => void
  clear: () => void
}

const persistSuffix = APP_KEY.slice(0, 16)

export const useKeyMetaStore = create<KeyMetaState>()(
  persist(
    (set) => ({
      meta: {},
      setMeta: (id, suffix) =>
        set((state) => ({
          meta: {
            ...state.meta,
            [id]: { configured: true, addedAt: Date.now(), suffix },
          },
        })),
      removeMeta: (id) =>
        set((state) => {
          const next = { ...state.meta }
          delete next[id]
          return { meta: next }
        }),
      clearMeta: () => set({ meta: {} }),
    }),
    {
      name: `sia-studio-ai-keys-meta-${persistSuffix}`,
      partialize: (state) => ({ meta: state.meta }),
    },
  ),
)

const secretsStore = create<SecretsState>()(
  persist(
    (set) => ({
      keys: {},
      set: (id, key) =>
        set((state) => ({ keys: { ...state.keys, [id]: key } })),
      remove: (id) =>
        set((state) => {
          const next = { ...state.keys }
          delete next[id]
          return { keys: next }
        }),
      clear: () => set({ keys: {} }),
    }),
    {
      name: `sia-studio-ai-keys-secret-${persistSuffix}`,
      partialize: (state) => ({ keys: state.keys }),
    },
  ),
)

export function setProviderKey(id: ProviderId, key: string): void {
  const trimmed = key.trim()
  if (!trimmed) return
  secretsStore.getState().set(id, trimmed)
  useKeyMetaStore.getState().setMeta(id, maskedSuffix(trimmed))
}

export function removeProviderKey(id: ProviderId): void {
  secretsStore.getState().remove(id)
  useKeyMetaStore.getState().removeMeta(id)
}

export function removeAllProviderKeys(): void {
  secretsStore.getState().clear()
  useKeyMetaStore.getState().clearMeta()
}

export function getProviderKey(id: ProviderId): string | undefined {
  return secretsStore.getState().keys[id]
}

export function hasAnyKey(meta: KeyMetaState['meta']): boolean {
  return Object.keys(meta).length > 0
}

export function configuredMap(
  meta: KeyMetaState['meta'],
): Record<ProviderId, boolean> {
  const out = {} as Record<ProviderId, boolean>
  for (const id of PROVIDER_IDS) out[id] = Boolean(meta[id])
  return out
}
