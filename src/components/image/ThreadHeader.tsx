import { useEffect, useMemo, useRef, useState } from 'react'
import { deriveThreads } from '../../lib/sia/gallery'
import { useGalleryStore } from '../../stores/gallery'
import { renameThread } from '../../stores/generation'

export function ThreadHeader({ threadId }: { threadId: string | null }) {
  const images = useGalleryStore((s) => s.imagesById)

  const thread = useMemo(() => {
    if (!threadId) return undefined
    const ready = Object.values(images)
      .filter((i) => i.status === 'ready' && i.objectId)
      .map((i) => ({ objectId: i.objectId as string, metadata: i.metadata }))
    return deriveThreads(ready).find((t) => t.threadId === threadId)
  }, [images, threadId])

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (thread) setDraft(thread.title)
  }, [thread])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function commit() {
    setEditing(false)
    if (!threadId || !thread) return
    const trimmed = draft.trim()
    if (!trimmed || trimmed === thread.title) return
    await renameThread(threadId, trimmed)
  }

  const title = thread?.title ?? (threadId ? 'Untitled thread' : 'New thread')
  const count = thread?.images.length ?? 0

  return (
    <div className="px-4 py-3 md:px-8 flex items-center gap-3">
      {editing && thread ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="flex-1 bg-transparent text-sm font-semibold text-fg"
        />
      ) : (
        <button
          type="button"
          onClick={() => thread && setEditing(true)}
          className="text-sm font-semibold text-fg hover:text-accent btn-transition active:scale-[0.96] disabled:active:scale-100 text-left truncate"
          disabled={!thread}
          title={thread ? 'Rename thread' : undefined}
        >
          {title}
        </button>
      )}
      <span className="text-xs text-fg-subtle shrink-0 tabular-nums">
        {count} {count === 1 ? 'image' : 'images'}
      </span>
    </div>
  )
}
