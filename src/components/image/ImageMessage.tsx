import { useEffect, useState } from 'react'
import { findModel } from '../../lib/providers'
import { getImageBlobUrl } from '../../lib/sia/imageCache'
import { useAuthStore } from '../../stores/auth'
import type { ImageRecord } from '../../stores/gallery'
import { useGenerationStore } from '../../stores/generation'

export function ImageMessage({
  record,
  onOpenDetail,
}: {
  record: ImageRecord
  onOpenDetail: (id: string) => void
}) {
  const sdk = useAuthStore((s) => s.sdk)
  const setParent = useGenerationStore((s) => s.setParentImageId)
  const [url, setUrl] = useState<string | null>(record.localPreviewUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  // Shared blob URL cache handles dedupe across mounts; depend on stable
  // objectId rather than the PinnedObject reference.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (url) return
    if (!record.objectId || !record.object || !sdk) return
    let cancelled = false
    getImageBlobUrl(sdk, record.objectId, record.object)
      .then((u) => {
        if (!cancelled) setUrl(u)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Download failed')
        }
      })
    return () => {
      cancelled = true
    }
  }, [record.objectId, sdk])

  const timeLabel = new Date(record.metadata.createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
  const modelLabel =
    findModel(record.metadata.model)?.displayName ?? record.metadata.model

  return (
    <div className="flex items-start gap-3 animate-fade-in group">
      <div className="flex-1 max-w-md space-y-2">
        <button
          type="button"
          onClick={() => record.objectId && onOpenDetail(record.objectId)}
          className="relative block w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-border-subtle bg-bg-2 hover:border-border-strong active:scale-[0.98] btn-transition"
        >
          {url ? (
            <img
              src={url}
              alt={record.metadata.prompt}
              loading="lazy"
              className="w-full h-full object-cover animate-reveal img-outline"
            />
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center text-danger text-xs p-4 text-center">
              {error}
            </div>
          ) : (
            <div className="w-full h-full animate-shimmer" />
          )}
        </button>
        <div className="flex items-center gap-3 text-[11px] text-fg-subtle">
          <span className="tabular-nums">{timeLabel}</span>
          <span>·</span>
          <span>{modelLabel}</span>
          <button
            type="button"
            onClick={() => record.objectId && setParent(record.objectId)}
            className="ml-auto text-fg-muted hover:text-accent active:scale-[0.96] btn-transition"
          >
            Use as reference
          </button>
        </div>
      </div>
    </div>
  )
}
