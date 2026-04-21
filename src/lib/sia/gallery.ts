import type { ObjectEvent, PinnedObject } from '@siafoundation/sia-storage'
import { type ImageMetadata, isImageMetadata } from '../../types/image'
import { decodeMetadata } from './metadata'

export type ImageEntry = {
  objectId: string
  object: PinnedObject
  metadata: ImageMetadata
  updatedAt: Date
}

// Pulls images out of an objectEvents window. Anything not a current-version
// image (legacy uploads, deleted records) is skipped.
export function digestImages(events: ObjectEvent[]): ImageEntry[] {
  const out: ImageEntry[] = []
  for (const event of events) {
    if (event.deleted || !event.object) continue
    const meta = decodeMetadata(event.object.metadata())
    if (!isImageMetadata(meta)) continue
    out.push({
      objectId: event.id,
      object: event.object,
      metadata: meta,
      updatedAt: event.updatedAt,
    })
  }
  return out
}

export type ThreadView = {
  threadId: string
  title: string
  rootImageId: string
  images: Array<{ objectId: string; metadata: ImageMetadata }>
  updatedAt: number
}

// Group images by threadId. Title comes from the root image's `threadTitle`
// (set on rename) or its prompt. Order within a thread is by createdAt;
// branching via parentImageId is supported in the data model but rendered
// as a flat chain for now.
export function deriveThreads(
  images: Array<{ objectId: string; metadata: ImageMetadata }>,
): ThreadView[] {
  const groups = new Map<string, typeof images>()
  for (const img of images) {
    const arr = groups.get(img.metadata.threadId) ?? []
    arr.push(img)
    groups.set(img.metadata.threadId, arr)
  }

  const out: ThreadView[] = []
  for (const [threadId, arr] of groups) {
    arr.sort((a, b) => a.metadata.createdAt - b.metadata.createdAt)
    // Display root: the parentless image if still here, else the earliest
    // remaining image (handles the case where the original root was deleted).
    const root = arr.find((i) => !i.metadata.parentImageId) ?? arr[0]
    // threadTitle may live on any image in the thread — deleting the old
    // bearer promotes it to another image (see generation.ts:deleteImage).
    const titled = arr.find((i) => i.metadata.threadTitle)
    const latest = arr[arr.length - 1]
    out.push({
      threadId,
      title:
        titled?.metadata.threadTitle ||
        root.metadata.prompt.slice(0, 40) ||
        'Untitled thread',
      rootImageId: root.objectId,
      images: arr,
      updatedAt: latest.metadata.createdAt,
    })
  }
  return out
}
