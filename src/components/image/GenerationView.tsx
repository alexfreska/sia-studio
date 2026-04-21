import { useEffect, useMemo, useRef, useState } from 'react'
import { deriveThreads } from '../../lib/sia/gallery'
import { useAuthStore } from '../../stores/auth'
import { useGalleryStore } from '../../stores/gallery'
import { useGenerationStore } from '../../stores/generation'
import { EmptyThreadState } from './EmptyThreadState'
import { ImageDetailDrawer } from './ImageDetailDrawer'
import { MessageList } from './MessageList'
import { PromptBar } from './PromptBar'
import { ThreadHeader } from './ThreadHeader'
import { ThreadSidebar } from './ThreadSidebar'

const POLL_INTERVAL_MS = 30_000

export function GenerationView() {
  const sdk = useAuthStore((s) => s.sdk)
  const loaded = useGalleryStore((s) => s.loaded)
  const loading = useGalleryStore((s) => s.loading)
  const refresh = useGalleryStore((s) => s.refresh)
  const sync = useGalleryStore((s) => s.sync)
  const images = useGalleryStore((s) => s.imagesById)
  const selectedThreadId = useGenerationStore((s) => s.selectedThreadId)
  const selectThread = useGenerationStore((s) => s.selectThread)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const initialAutoSelect = useRef(false)

  const threads = useMemo(() => {
    const all = Object.values(images).map((i) => ({
      objectId: i.id,
      metadata: i.metadata,
    }))
    return deriveThreads(all).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [images])

  useEffect(() => {
    if (!sdk || loaded) return
    refresh(sdk)
  }, [sdk, loaded, refresh])

  // Fires once when the gallery first hydrates. Clicking "New thread"
  // deselects — that must not retrigger selection, hence the ref guard.
  useEffect(() => {
    if (initialAutoSelect.current || !loaded) return
    initialAutoSelect.current = true
    if (selectedThreadId) return
    if (threads[0]) selectThread(threads[0].threadId)
  }, [loaded, threads, selectedThreadId, selectThread])

  // Background sync: poll while the tab is visible. Skipped when hidden so
  // backgrounded tabs don't burn requests.
  useEffect(() => {
    if (!sdk || !loaded) return
    const poll = () => {
      if (document.visibilityState === 'visible') sync(sdk).catch(() => {})
    }
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', poll)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [sdk, loaded, sync])

  const hasMessages = useGalleryStore((s) =>
    selectedThreadId
      ? Object.values(s.imagesById).some(
          (i) => i.metadata.threadId === selectedThreadId,
        )
      : false,
  )

  return (
    <div className="flex-1 flex min-h-0">
      <ThreadSidebar variant="desktop" />
      <ThreadSidebar
        variant="drawer"
        open={mobileSidebar}
        onClose={() => setMobileSidebar(false)}
      />
      <section className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="border-b border-border-subtle flex items-center">
          <button
            type="button"
            onClick={() => setMobileSidebar(true)}
            className="md:hidden p-3 text-fg-muted hover:text-fg active:scale-[0.96] btn-transition"
            aria-label="Open threads"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <ThreadHeader threadId={selectedThreadId} />
          </div>
        </div>
        {loading && !loaded ? (
          <div className="flex-1 flex items-center justify-center text-fg-subtle text-sm">
            Loading images from Sia…
          </div>
        ) : selectedThreadId && hasMessages ? (
          <MessageList threadId={selectedThreadId} onOpenDetail={setDetailId} />
        ) : (
          <EmptyThreadState />
        )}
        <PromptBar />
      </section>
      <ImageDetailDrawer imageId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
