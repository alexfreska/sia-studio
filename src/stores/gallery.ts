import type { PinnedObject, Sdk } from '@siafoundation/sia-storage'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { APP_KEY } from '../lib/constants'
import { digestImages } from '../lib/sia/gallery'
import type { ImageMetadata } from '../types/image'

export type ImageStatus = 'pending' | 'uploading' | 'ready' | 'error'

export type ImageRecord = {
  id: string
  objectId?: string
  tempId?: string
  object?: PinnedObject
  metadata: ImageMetadata
  status: ImageStatus
  localPreviewUrl?: string
  bytes?: Uint8Array
  error?: string
  uploadProgress?: { shardsDone: number; bytesUploaded: number; total: number }
}

type GalleryState = {
  imagesById: Record<string, ImageRecord>
  loaded: boolean
  loading: boolean
  // Latest event.updatedAt we've applied (ms). Polls only merge events newer
  // than this. Persisted across reloads.
  lastEventMs: number
  refresh: (sdk: Sdk) => Promise<void>
  sync: (sdk: Sdk) => Promise<void>
  upsertImage: (record: ImageRecord) => void
  commitImage: (
    tempId: string,
    objectId: string,
    object: PinnedObject,
    metadata: ImageMetadata,
  ) => void
  updateImage: (id: string, patch: Partial<ImageRecord>) => void
  removeImage: (id: string) => void
}

function maxUpdatedAt(events: Array<{ updatedAt: Date }>): number {
  let max = 0
  for (const e of events) {
    const ms = e.updatedAt.getTime()
    if (ms > max) max = ms
  }
  return max
}

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set, get) => ({
      imagesById: {},
      loaded: false,
      loading: false,
      lastEventMs: 0,

      refresh: async (sdk) => {
        set({ loading: true })
        const events = await sdk.objectEvents(undefined, 500)
        const images = digestImages(events)

        const imagesById: Record<string, ImageRecord> = {}
        for (const img of images) {
          imagesById[img.objectId] = {
            id: img.objectId,
            objectId: img.objectId,
            object: img.object,
            metadata: img.metadata,
            status: 'ready',
          }
        }

        // Preserve in-flight (pending/uploading/error) records.
        for (const [id, rec] of Object.entries(get().imagesById)) {
          if (rec.status !== 'ready' && !imagesById[id]) {
            imagesById[id] = rec
          }
        }

        set({
          imagesById,
          loaded: true,
          loading: false,
          lastEventMs: maxUpdatedAt(events),
        })
      },

      // Cursor-by-Date in the SDK doesn't round-trip through WASM, so we
      // fetch the recent window and filter client-side by lastEventMs.
      sync: async (sdk) => {
        const prevMs = get().lastEventMs
        const events = await sdk.objectEvents(undefined, 200)
        const fresh = events.filter((e) => e.updatedAt.getTime() > prevMs)
        if (fresh.length === 0) return

        set((state) => {
          const imagesById = { ...state.imagesById }
          for (const event of fresh) {
            if (event.deleted) {
              delete imagesById[event.id]
            }
          }
          for (const img of digestImages(fresh)) {
            imagesById[img.objectId] = {
              id: img.objectId,
              objectId: img.objectId,
              object: img.object,
              metadata: img.metadata,
              status: 'ready',
            }
          }
          return { imagesById }
        })

        set({ lastEventMs: maxUpdatedAt(fresh) })
      },

      upsertImage: (record) =>
        set((state) => ({
          imagesById: { ...state.imagesById, [record.id]: record },
        })),

      commitImage: (tempId, objectId, object, metadata) =>
        set((state) => {
          const next = { ...state.imagesById }
          const prev = next[tempId]
          // Revoke the generation-time blob URL: its backing buffer is gone
          // once `bytes` is cleared, and a zombie URL shows as a broken <img>.
          if (prev?.localPreviewUrl) URL.revokeObjectURL(prev.localPreviewUrl)
          delete next[tempId]
          next[objectId] = {
            ...prev,
            id: objectId,
            objectId,
            tempId: undefined,
            object,
            metadata,
            status: 'ready',
            bytes: undefined,
            localPreviewUrl: undefined,
            error: undefined,
            uploadProgress: undefined,
          }
          return { imagesById: next }
        }),

      updateImage: (id, patch) =>
        set((state) => {
          const prev = state.imagesById[id]
          if (!prev) return state
          return {
            imagesById: { ...state.imagesById, [id]: { ...prev, ...patch } },
          }
        }),

      removeImage: (id) =>
        set((state) => {
          const next = { ...state.imagesById }
          delete next[id]
          return { imagesById: next }
        }),
    }),
    {
      name: `sia-studio-gallery-${APP_KEY.slice(0, 16)}`,
      partialize: (state) => ({ lastEventMs: state.lastEventMs }),
    },
  ),
)
