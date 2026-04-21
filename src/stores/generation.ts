import { PinnedObject, type ShardProgress } from '@siafoundation/sia-storage'
import { create } from 'zustand'
import { DATA_SHARDS, PARITY_SHARDS } from '../lib/constants'
import { sha256Hex } from '../lib/hash'
import { getProvider } from '../lib/providers'
import { describeError } from '../lib/redact'
import { evictImage } from '../lib/sia/imageCache'
import { encodeMetadata, makeImageMetadata } from '../lib/sia/metadata'
import type { ImageMetadata } from '../types/image'
import type {
  ModelCapabilities,
  ProviderId,
  ProviderModel,
} from '../types/providers'
import { getProviderKey } from './apiKeys'
import { useAuthStore } from './auth'
import { useGalleryStore } from './gallery'

export type GenerationStage =
  | 'preparing'
  | 'generating'
  | 'uploading'
  | 'finalizing'

export type Inflight = {
  tempId: string
  threadId: string
  prompt: string
  modelId: string
  providerId: ProviderId
  stage: GenerationStage
  abort: AbortController
  startedAt: number
}

type StartArgs = {
  prompt: string
  model: ProviderModel
  threadId: string
  parentImageId?: string
}

type GenerationState = {
  prompt: string
  selectedModelId: string | null
  selectedThreadId: string | null
  parentImageId: string | null
  // Per-thread draft prompts, so switching threads restores what was typed.
  drafts: Record<string, string>
  inflight: Record<string, Inflight>

  setPrompt: (prompt: string) => void
  selectModel: (id: string | null) => void
  selectThread: (id: string | null) => void
  setParentImageId: (id: string | null) => void
  cancel: (tempId: string) => void
  startGeneration: (args: StartArgs) => Promise<void>
}

export const useGenerationStore = create<GenerationState>()((set, get) => ({
  prompt: '',
  selectedModelId: null,
  selectedThreadId: null,
  parentImageId: null,
  drafts: {},
  inflight: {},

  setPrompt: (prompt) => {
    const threadId = get().selectedThreadId
    set((state) => ({
      prompt,
      drafts: threadId ? { ...state.drafts, [threadId]: prompt } : state.drafts,
    }))
  },

  selectModel: (id) => set({ selectedModelId: id }),

  selectThread: (id) =>
    set((state) => ({
      selectedThreadId: id,
      prompt: id ? (state.drafts[id] ?? '') : '',
      parentImageId: null,
    })),

  setParentImageId: (id) => set({ parentImageId: id }),

  cancel: (tempId) => {
    get().inflight[tempId]?.abort.abort()
  },

  startGeneration: async ({ prompt, model, threadId, parentImageId }) => {
    const sdk = useAuthStore.getState().sdk
    if (!sdk) return
    const apiKey = getProviderKey(model.providerId)
    const provider = getProvider(model.providerId)
    if (!apiKey) {
      const tempId = `temp_${crypto.randomUUID()}`
      useGalleryStore.getState().upsertImage({
        id: tempId,
        tempId,
        status: 'error',
        error: `Add a ${provider.displayName} API key in Settings to use ${model.displayName}.`,
        metadata: makeImageMetadata({
          provider: model.providerId,
          model: model.id,
          modelParams: {},
          prompt,
          threadId,
          parentImageId,
          name: prompt.slice(0, 48) || 'Untitled',
          type: 'image/png',
          size: 0,
          hash: '',
          createdAt: Date.now(),
        }),
      })
      return
    }

    const tempId = `temp_${crypto.randomUUID()}`
    const abort = new AbortController()

    // First image in a brand-new thread becomes the root and carries the
    // initial title (derived from its prompt unless the user renames later).
    const isRoot = !hasImagesInThread(threadId)

    const metaBase = {
      provider: model.providerId,
      model: model.id,
      modelParams: {},
      prompt,
      threadId,
      parentImageId,
      threadTitle: isRoot
        ? prompt.slice(0, 40) || 'Untitled thread'
        : undefined,
    }

    useGalleryStore.getState().upsertImage({
      id: tempId,
      tempId,
      status: 'pending',
      metadata: makeImageMetadata({
        ...metaBase,
        name: prompt.slice(0, 48) || 'Untitled',
        type: 'image/png',
        size: 0,
        hash: '',
        createdAt: Date.now(),
      }),
    })

    set((state) => ({
      inflight: {
        ...state.inflight,
        [tempId]: {
          tempId,
          threadId,
          prompt,
          modelId: model.id,
          providerId: model.providerId,
          stage: 'preparing',
          abort,
          startedAt: Date.now(),
        },
      },
      drafts: { ...state.drafts, [threadId]: '' },
      prompt: '',
    }))

    const setStage = (stage: GenerationStage) => {
      set((s) => {
        const current = s.inflight[tempId]
        if (!current) return s
        return { inflight: { ...s.inflight, [tempId]: { ...current, stage } } }
      })
    }

    const clearInflight = () => {
      set((s) => {
        const next = { ...s.inflight }
        delete next[tempId]
        return { inflight: next }
      })
    }

    try {
      // Thread context: prior prompts always flow into the text so even
      // non-edit models have continuity; prior images fill the reference
      // slots after the explicit parent, up to the model's cap.
      const context = collectThreadContext(threadId)
      const refIds = pickReferenceIds(
        model.capabilities,
        parentImageId,
        context.priorImageIds,
      )
      const references = refIds.length
        ? await loadReferences(sdk, refIds)
        : undefined

      setStage('generating')
      const result = await provider.generate({
        prompt: composePrompt(prompt, context.priorPrompts),
        model,
        params: {},
        apiKey,
        references,
        signal: abort.signal,
      })

      const hash = await sha256Hex(result.bytes)
      const blob = new Blob([new Uint8Array(result.bytes)], {
        type: result.contentType,
      })
      useGalleryStore.getState().updateImage(tempId, {
        status: 'uploading',
        bytes: result.bytes,
        localPreviewUrl: URL.createObjectURL(blob),
      })

      setStage('uploading')
      const encodedTotal = Math.ceil(
        result.bytes.byteLength * ((DATA_SHARDS + PARITY_SHARDS) / DATA_SHARDS),
      )
      let shardsDone = 0
      let bytesUploaded = 0
      const pinned = await sdk.upload(new PinnedObject(), blob.stream(), {
        maxInflight: 10,
        dataShards: DATA_SHARDS,
        parityShards: PARITY_SHARDS,
        onShardUploaded: (p: ShardProgress) => {
          shardsDone++
          bytesUploaded += p.shardSize
          useGalleryStore.getState().updateImage(tempId, {
            uploadProgress: {
              shardsDone,
              bytesUploaded,
              total: encodedTotal,
            },
          })
        },
      })

      setStage('finalizing')
      const meta: ImageMetadata = makeImageMetadata({
        ...metaBase,
        name: prompt.slice(0, 48) || 'Untitled',
        type: result.contentType,
        size: result.bytes.byteLength,
        hash,
        createdAt: Date.now(),
        providerAssetUrl: result.providerAssetUrl,
      })
      pinned.updateMetadata(encodeMetadata(meta))
      await sdk.pinObject(pinned)
      await sdk.updateObjectMetadata(pinned)

      useGalleryStore.getState().commitImage(tempId, pinned.id(), pinned, meta)
      clearInflight()
    } catch (e) {
      if (abort.signal.aborted) {
        useGalleryStore.getState().removeImage(tempId)
        clearInflight()
        return
      }
      useGalleryStore.getState().updateImage(tempId, {
        status: 'error',
        error: describeError(e, apiKey),
      })
      clearInflight()
    }
  },
}))

function hasImagesInThread(threadId: string): boolean {
  return Object.values(useGalleryStore.getState().imagesById).some(
    (i) => i.metadata.threadId === threadId && i.status === 'ready',
  )
}

// How many prior prompts to include in the preamble. Keeps text bounded
// for prompt-length-sensitive models while still giving continuity.
const MAX_HISTORY_PROMPTS = 6

function collectThreadContext(threadId: string): {
  priorPrompts: string[]
  priorImageIds: string[]
} {
  const records = Object.values(useGalleryStore.getState().imagesById)
    .filter((r) => r.metadata.threadId === threadId && r.status === 'ready')
    .sort((a, b) => a.metadata.createdAt - b.metadata.createdAt)
  return {
    priorPrompts: records.map((r) => r.metadata.prompt),
    priorImageIds: records.map((r) => r.id),
  }
}

function composePrompt(current: string, priorPrompts: string[]): string {
  if (priorPrompts.length === 0) return current
  const tail = priorPrompts.slice(-MAX_HISTORY_PROMPTS)
  const lines = tail.map((p, i) => `${i + 1}. ${p}`).join('\n')
  return `Previous requests in this thread:\n${lines}\n\nCurrent request: ${current}`
}

// Explicit parent takes slot 0; remaining slots filled with the newest
// thread-history images (excluding the parent). Capped at maxReferences.
function pickReferenceIds(
  capabilities: ModelCapabilities,
  parentImageId: string | undefined,
  historyIds: string[],
): string[] {
  if (!capabilities.supportsEdit) return []
  const slots = capabilities.maxReferences || 1
  const ids: string[] = []
  if (parentImageId) ids.push(parentImageId)
  const remaining = slots - ids.length
  if (remaining > 0) {
    const secondary = historyIds
      .filter((id) => id !== parentImageId)
      .slice(-remaining)
    ids.push(...secondary)
  }
  return ids.slice(0, slots)
}

async function loadReferences(
  sdk: NonNullable<ReturnType<typeof useAuthStore.getState>['sdk']>,
  ids: string[],
): Promise<Array<{ bytes: Uint8Array; contentType: string }>> {
  const out: Array<{ bytes: Uint8Array; contentType: string }> = []
  for (const id of ids) {
    const r = useGalleryStore.getState().imagesById[id]
    if (!r) continue
    let bytes = r.bytes
    if (!bytes && r.object) {
      bytes = await readAll(sdk.download(r.object, { maxInflight: 10 }))
      useGalleryStore.getState().updateImage(id, { bytes })
    }
    if (!bytes) continue
    out.push({ bytes, contentType: r.metadata.type })
  }
  return out
}

async function readAll(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.byteLength
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    merged.set(c, offset)
    offset += c.byteLength
  }
  return merged
}

// The image that currently carries threadTitle for a thread. Falls back to
// the display root (parentless), then to the earliest remaining image.
// Deletion can orphan the original root, so this can't assume parentImageId
// is the source of truth.
function findTitleBearer(
  threadId: string,
  excludeId?: string,
):
  | ReturnType<typeof useGalleryStore.getState>['imagesById'][string]
  | undefined {
  const inThread = Object.values(useGalleryStore.getState().imagesById)
    .filter(
      (i) =>
        i.metadata.threadId === threadId &&
        i.status === 'ready' &&
        i.object &&
        i.id !== excludeId,
    )
    .sort((a, b) => a.metadata.createdAt - b.metadata.createdAt)
  return (
    inThread.find((i) => i.metadata.threadTitle) ??
    inThread.find((i) => !i.metadata.parentImageId) ??
    inThread[0]
  )
}

export async function renameThread(
  threadId: string,
  newTitle: string,
): Promise<void> {
  const sdk = useAuthStore.getState().sdk
  if (!sdk) return
  const bearer = findTitleBearer(threadId)
  if (!bearer?.object) return

  const updated: ImageMetadata = { ...bearer.metadata, threadTitle: newTitle }
  useGalleryStore.getState().updateImage(bearer.id, { metadata: updated })
  bearer.object.updateMetadata(encodeMetadata(updated))
  await sdk.updateObjectMetadata(bearer.object)
}

export async function deleteImage(objectId: string): Promise<void> {
  const sdk = useAuthStore.getState().sdk
  if (!sdk) return
  const gallery = useGalleryStore.getState()
  const target = gallery.imagesById[objectId]

  // If this image was carrying the thread's custom title, promote it to
  // another image first so rename survives the delete.
  if (target?.metadata.threadTitle) {
    const next = findTitleBearer(target.metadata.threadId, target.id)
    if (next?.object) {
      const updated: ImageMetadata = {
        ...next.metadata,
        threadTitle: target.metadata.threadTitle,
      }
      gallery.updateImage(next.id, { metadata: updated })
      next.object.updateMetadata(encodeMetadata(updated))
      await sdk.updateObjectMetadata(next.object)
    }
  }

  await sdk.deleteObject(objectId)
  useGalleryStore.getState().removeImage(objectId)
  evictImage(objectId)
}
