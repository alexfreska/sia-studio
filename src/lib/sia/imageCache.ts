import type { PinnedObject, Sdk } from '@siafoundation/sia-storage'

// Module-level cache keyed by objectId. Blob URLs persist for the page
// lifetime — fine for a demo; revoked explicitly on delete.
const urls = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

export function getImageBlobUrl(
  sdk: Sdk,
  objectId: string,
  object: PinnedObject,
): Promise<string> {
  const hit = urls.get(objectId)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(objectId)
  if (pending) return pending
  const promise = (async () => {
    try {
      const blob = await new Response(
        sdk.download(object, { maxInflight: 10 }),
      ).blob()
      const url = URL.createObjectURL(blob)
      urls.set(objectId, url)
      return url
    } finally {
      inflight.delete(objectId)
    }
  })()
  inflight.set(objectId, promise)
  return promise
}

export function evictImage(objectId: string): void {
  const url = urls.get(objectId)
  if (url) URL.revokeObjectURL(url)
  urls.delete(objectId)
  inflight.delete(objectId)
}
