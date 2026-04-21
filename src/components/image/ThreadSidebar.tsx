import { useEffect, useMemo } from 'react'
import { deriveThreads } from '../../lib/sia/gallery'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { useGalleryStore } from '../../stores/gallery'
import { useGenerationStore } from '../../stores/generation'

type Props = {
  variant: 'desktop' | 'drawer'
  open?: boolean
  onClose?: () => void
}

export function ThreadSidebar({ variant, open, onClose }: Props) {
  const images = useGalleryStore((s) => s.imagesById)
  const selectedThreadId = useGenerationStore((s) => s.selectedThreadId)
  const selectThread = useGenerationStore((s) => s.selectThread)
  useBodyScrollLock(variant === 'drawer' && Boolean(open))

  // Include pending/uploading/error records so in-flight threads stay in the
  // sidebar. `i.id` is the tempId for pending and the objectId once ready.
  const threads = useMemo(() => {
    const all = Object.values(images).map((i) => ({
      objectId: i.id,
      metadata: i.metadata,
    }))
    return deriveThreads(all).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [images])

  useEffect(() => {
    if (variant !== 'drawer' || !open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [variant, open, onClose])

  function handleNewThread() {
    selectThread(null)
    if (variant === 'drawer') onClose?.()
  }

  function handleSelect(id: string) {
    selectThread(id)
    if (variant === 'drawer') onClose?.()
  }

  const body = (
    <>
      <div className="p-3">
        <button
          type="button"
          onClick={handleNewThread}
          className="w-full py-2 px-3 rounded-md bg-bg-2 hover:bg-bg-3 text-sm text-fg border border-border-subtle text-left flex items-center gap-2 btn-transition active:scale-[0.96]"
        >
          <svg
            className="w-3.5 h-3.5 text-accent"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          New thread
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {threads.length === 0 && (
          <p className="px-3 py-4 text-xs text-fg-subtle text-center">
            No threads yet. Send a prompt to start one.
          </p>
        )}
        {threads.map((t) => {
          const isActive = t.threadId === selectedThreadId
          const count = t.images.length
          return (
            <button
              key={t.threadId}
              type="button"
              onClick={() => handleSelect(t.threadId)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm btn-transition active:scale-[0.96] relative group ${
                isActive
                  ? 'bg-bg-2 text-fg border-l-2 border-accent pl-[10px]'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-2'
              }`}
            >
              <p className="truncate">{t.title}</p>
              <p className="text-[11px] text-fg-subtle truncate tabular-nums">
                {count} {count === 1 ? 'image' : 'images'}
              </p>
            </button>
          )
        })}
      </nav>
    </>
  )

  if (variant === 'desktop') {
    return (
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border-subtle bg-bg-1 flex-col">
        {body}
      </aside>
    )
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close thread list"
        aria-hidden={!open}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`md:hidden fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm transition-opacity ease-[cubic-bezier(0.32,0.72,0,1)] cursor-default ${
          open
            ? 'opacity-100 duration-[280ms]'
            : 'opacity-0 pointer-events-none duration-[200ms]'
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`md:hidden fixed top-0 bottom-0 left-0 z-50 w-[86vw] max-w-[320px] bg-bg-1 border-r border-border-subtle shadow-2xl flex flex-col transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open
            ? 'translate-x-0 duration-[280ms]'
            : '-translate-x-full duration-[200ms]'
        }`}
      >
        <header className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-fg">Threads</h2>
          <button
            type="button"
            onClick={onClose}
            className="relative p-2 text-fg-muted hover:text-fg rounded-md hover:bg-bg-2 active:scale-[0.96] btn-transition before:absolute before:content-[''] before:-inset-1"
            aria-label="Close threads"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>
        {body}
      </aside>
    </>
  )
}
