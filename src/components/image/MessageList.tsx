import { useEffect, useMemo, useRef } from 'react'
import type { ImageRecord } from '../../stores/gallery'
import { useGalleryStore } from '../../stores/gallery'
import { useGenerationStore } from '../../stores/generation'
import { ImageMessage } from './ImageMessage'
import { PendingMessage } from './PendingMessage'
import { PromptMessage } from './PromptMessage'

type Group = { prompt: string; createdAt: number; images: ImageRecord[] }

// Collapse consecutive images that share a prompt into one bubble group — e.g.
// an original + variants from the same prompt render as a single section.
function groupByPrompt(records: ImageRecord[]): Group[] {
  const groups: Group[] = []
  for (const r of records) {
    const tail = groups[groups.length - 1]
    if (tail && tail.prompt === r.metadata.prompt) {
      tail.images.push(r)
    } else {
      groups.push({
        prompt: r.metadata.prompt,
        createdAt: r.metadata.createdAt,
        images: [r],
      })
    }
  }
  return groups
}

export function MessageList({
  threadId,
  onOpenDetail,
}: {
  threadId: string
  onOpenDetail: (id: string) => void
}) {
  const images = useGalleryStore((s) => s.imagesById)
  const inflight = useGenerationStore((s) => s.inflight)
  const cancel = useGenerationStore((s) => s.cancel)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const threadImages = useMemo(
    () =>
      Object.values(images)
        .filter((r) => r.metadata.threadId === threadId)
        .sort((a, b) => a.metadata.createdAt - b.metadata.createdAt),
    [images, threadId],
  )
  const groups = useMemo(() => groupByPrompt(threadImages), [threadImages])

  // biome-ignore lint/correctness/useExhaustiveDependencies: length changes drive the scroll-to-bottom
  useEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [threadImages.length, groups.length])

  return (
    <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {groups.map((g) => (
          <div key={`${g.createdAt}-${g.prompt}`} className="space-y-3">
            <PromptMessage prompt={g.prompt} timestamp={g.createdAt} />
            <div className="space-y-3">
              {g.images.map((img) => {
                if (img.status === 'pending' || img.status === 'uploading') {
                  return (
                    <PendingMessage
                      key={img.id}
                      image={img}
                      inflight={img.tempId ? inflight[img.tempId] : undefined}
                      onCancel={() => img.tempId && cancel(img.tempId)}
                    />
                  )
                }
                if (img.status === 'error') {
                  return (
                    <div
                      key={img.id}
                      className="max-w-md rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
                    >
                      <p className="font-medium">Generation failed</p>
                      <p className="text-xs text-fg-muted mt-1">
                        {img.error ?? 'Unknown error.'}
                      </p>
                    </div>
                  )
                }
                return (
                  <ImageMessage
                    key={img.id}
                    record={img}
                    onOpenDetail={onOpenDetail}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
