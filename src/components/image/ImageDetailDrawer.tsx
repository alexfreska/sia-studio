import { useEffect, useState } from 'react'
import { findModel } from '../../lib/providers'
import { getImageBlobUrl } from '../../lib/sia/imageCache'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { useAuthStore } from '../../stores/auth'
import { useGalleryStore } from '../../stores/gallery'
import { deleteImage } from '../../stores/generation'
import { useToastStore } from '../../stores/toast'
import { CopyButton } from '../CopyButton'
import { ProviderGlyph } from '../onboarding/ProviderGlyph'

const SHARE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000

export function ImageDetailDrawer({
  imageId,
  onClose,
}: {
  imageId: string | null
  onClose: () => void
}) {
  const open = imageId !== null
  useBodyScrollLock(open)
  // Hold the last non-null imageId so content stays visible while the drawer
  // animates out. Cleared after the exit btn-transition settles.
  const [heldId, setHeldId] = useState<string | null>(imageId)
  const image = useGalleryStore((s) =>
    heldId ? s.imagesById[heldId] : undefined,
  )
  const sdk = useAuthStore((s) => s.sdk)
  const addToast = useToastStore((s) => s.addToast)
  const [url, setUrl] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (imageId) {
      setHeldId(imageId)
      return
    }
    const t = setTimeout(() => setHeldId(null), 320)
    return () => clearTimeout(t)
  }, [imageId])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Read from the shared cache: if the user already clicked the image in
  // the thread, its blob URL is ready and the drawer shows it instantly.
  // biome-ignore lint/correctness/useExhaustiveDependencies: depend on stable objectId, not PinnedObject ref
  useEffect(() => {
    setUrl(null)
    setShareUrl(null)
    if (!image?.objectId || !image.object || !sdk) return
    let cancelled = false
    getImageBlobUrl(sdk, image.objectId, image.object)
      .then((u) => {
        if (!cancelled) setUrl(u)
      })
      .catch(() => {
        // Shimmer stays visible; user can retry by reopening.
      })
    return () => {
      cancelled = true
    }
  }, [image?.objectId, sdk])

  const meta = image?.metadata
  const modelLabel = meta
    ? (findModel(meta.model)?.displayName ?? meta.model)
    : ''

  async function handleShare() {
    if (!sdk || !image?.object) return
    try {
      const link = sdk.shareObject(
        image.object,
        new Date(Date.now() + SHARE_VALIDITY_MS),
      )
      setShareUrl(link)
      await navigator.clipboard.writeText(link)
      addToast('Share link copied')
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to share')
    }
  }

  function handleDownload() {
    if (!url || !meta) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${meta.name || 'image'}.${extensionForType(meta.type)}`
    a.click()
  }

  async function handleDelete() {
    if (!image?.objectId) return
    if (!window.confirm('Delete this image from Sia? This cannot be undone.')) {
      return
    }
    setDeleting(true)
    try {
      await deleteImage(image.objectId)
      onClose()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close detail drawer"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm cursor-default transition-opacity ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open
            ? 'opacity-100 duration-[280ms]'
            : 'opacity-0 pointer-events-none duration-[200ms]'
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[560px] bg-bg-1 border-l border-border-subtle shadow-2xl flex flex-col transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open
            ? 'translate-x-0 duration-[280ms]'
            : 'translate-x-full duration-[200ms]'
        }`}
      >
        {image && meta && (
          <>
            <header className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-2 min-w-0 text-xs text-fg-muted">
                <ProviderGlyph
                  id={meta.provider}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span className="font-medium truncate">{modelLabel}</span>
                <span className="text-fg-subtle shrink-0">·</span>
                <span className="text-fg-subtle tabular-nums shrink-0">
                  {formatRelative(meta.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="relative p-2 text-fg-muted hover:text-fg rounded-md hover:bg-bg-2 active:scale-[0.96] btn-transition before:absolute before:content-[''] before:-inset-1 shrink-0 ml-2"
                aria-label="Close"
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

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <div className="rounded-xl overflow-hidden border border-border-subtle bg-bg-2 flex items-center justify-center">
                {url ? (
                  <img
                    src={url}
                    alt={meta.prompt}
                    className="w-full h-auto max-h-[60vh] object-contain img-outline"
                  />
                ) : (
                  <div className="w-full aspect-square animate-shimmer" />
                )}
              </div>

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Prompt
                </h3>
                <p className="text-sm text-fg whitespace-pre-wrap break-words text-pretty leading-relaxed">
                  {meta.prompt}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Details
                </h3>
                <dl className="text-xs divide-y divide-border-subtle/60">
                  <DetailRow
                    label="Created"
                    value={
                      <span className="tabular-nums">
                        {new Date(meta.createdAt).toLocaleString()}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Size"
                    value={
                      <span className="tabular-nums">
                        {meta.size > 0 ? formatBytes(meta.size) : '—'}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Type"
                    value={<span className="font-mono">{meta.type}</span>}
                  />
                  {image.objectId && (
                    <DetailRow
                      label="Object ID"
                      value={
                        <span className="font-mono flex items-center gap-1 tabular-nums">
                          {image.objectId.slice(0, 10)}…
                          {image.objectId.slice(-6)}
                          <CopyButton
                            value={image.objectId}
                            label="Object ID copied"
                          />
                        </span>
                      }
                    />
                  )}
                  {meta.hash && (
                    <DetailRow
                      label="SHA-256"
                      value={
                        <span className="font-mono flex items-center gap-1 tabular-nums">
                          {meta.hash.slice(0, 10)}…
                          <CopyButton value={meta.hash} label="Hash copied" />
                        </span>
                      }
                    />
                  )}
                </dl>
              </section>

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                  Share
                </h3>
                {shareUrl ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-2 border border-border-subtle">
                    <span className="flex-1 text-[11px] font-mono text-fg-muted truncate">
                      {shareUrl}
                    </span>
                    <CopyButton value={shareUrl} label="Share link copied" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-2 rounded-md border border-border-subtle text-sm text-fg-muted hover:text-fg hover:border-border-strong hover:bg-bg-2 active:scale-[0.96] btn-transition"
                  >
                    Generate share link
                    <span className="text-fg-subtle"> · 7 days</span>
                  </button>
                )}
              </section>
            </div>

            <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-fg-subtle hover:text-danger disabled:opacity-40 active:scale-[0.96] disabled:active:scale-100 btn-transition"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!url}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent-gradient text-bg-0 text-sm font-medium active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 btn-transition"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
                Download
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg-muted">{value}</dd>
    </div>
  )
}

function formatBytes(bytes: number): string {
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    sizes.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  )
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.round(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function extensionForType(type: string): string {
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg'
  return 'bin'
}
