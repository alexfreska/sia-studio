import { useEffect, useState } from 'react'
import { getImageBlobUrl } from '../../lib/sia/imageCache'
import { useAuthStore } from '../../stores/auth'
import type { ImageRecord } from '../../stores/gallery'

export function ReferenceImageChip({
  image,
  onRemove,
}: {
  image: ImageRecord
  onRemove: () => void
}) {
  const sdk = useAuthStore((s) => s.sdk)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    image.localPreviewUrl ?? null,
  )

  // Shared cache — hits immediately if the user already opened/scrolled past
  // this image in the thread.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    if (previewUrl) return
    if (!image.objectId || !image.object || !sdk) return
    let cancelled = false
    getImageBlobUrl(sdk, image.objectId, image.object)
      .then((u) => {
        if (!cancelled) setPreviewUrl(u)
      })
      .catch(() => {
        // Thumbnail is non-essential; the reference still works without it.
      })
    return () => {
      cancelled = true
    }
  }, [image.objectId, sdk])

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-bg-2 border border-border-subtle">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Reference"
          className="w-6 h-6 rounded object-cover img-outline"
        />
      ) : (
        <div className="w-6 h-6 rounded bg-bg-3 animate-shimmer" />
      )}
      <span className="text-xs text-fg-muted">Reference</span>
      <button
        type="button"
        onClick={onRemove}
        className="relative text-fg-subtle hover:text-fg active:scale-[0.96] btn-transition before:absolute before:content-[''] before:-inset-3"
        aria-label="Remove reference"
      >
        <svg
          className="w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 3l6 6M3 9l6-6" />
        </svg>
      </button>
    </div>
  )
}
