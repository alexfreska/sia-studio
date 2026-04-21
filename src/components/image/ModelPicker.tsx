import { useEffect, useRef, useState } from 'react'
import { findModel, listConfiguredModels } from '../../lib/providers'
import { configuredMap, useKeyMetaStore } from '../../stores/apiKeys'
import { useGenerationStore } from '../../stores/generation'
import { ProviderGlyph } from '../onboarding/ProviderGlyph'

export function ModelPicker({
  requireEdit = false,
}: {
  requireEdit?: boolean
}) {
  const meta = useKeyMetaStore((s) => s.meta)
  const selectedId = useGenerationStore((s) => s.selectedModelId)
  const selectModel = useGenerationStore((s) => s.selectModel)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const allModels = listConfiguredModels(configuredMap(meta))
  const models = requireEdit
    ? allModels.filter((m) => m.capabilities.supportsEdit)
    : allModels

  useEffect(() => {
    if (!selectedId && models.length > 0) {
      selectModel(models[0].id)
    }
    if (selectedId && !allModels.some((m) => m.id === selectedId)) {
      selectModel(models[0]?.id ?? null)
    }
  }, [selectedId, allModels, models, selectModel])

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handle)
    return () => window.removeEventListener('mousedown', handle)
  }, [open])

  const selected = selectedId ? findModel(selectedId) : undefined

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={models.length === 0}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border-subtle bg-bg-1 hover:bg-bg-2 text-sm text-fg disabled:opacity-40 disabled:cursor-not-allowed btn-transition active:scale-[0.96] disabled:active:scale-100"
      >
        {selected ? (
          <>
            <ProviderGlyph id={selected.providerId} className="w-3.5 h-3.5" />
            <span className="font-medium">{selected.displayName}</span>
          </>
        ) : (
          <span className="text-fg-subtle">Select a model</span>
        )}
        <svg
          className="w-3 h-3 text-fg-subtle"
          viewBox="0 0 12 12"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3 4.5L6 7.5L9 4.5z" />
        </svg>
      </button>

      {open && (
        <div className="popover-enter absolute bottom-full mb-2 left-0 z-30 w-72 rounded-lg bg-bg-2 border border-border-subtle shadow-2xl shadow-black/50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto py-1">
            {models.length === 0 ? (
              <p className="px-3 py-2 text-xs text-fg-subtle">
                No edit-capable models configured.
              </p>
            ) : (
              models.map((m) => {
                const isSel = m.id === selectedId
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      selectModel(m.id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-bg-3 btn-transition ${
                      isSel ? 'bg-accent-soft' : ''
                    }`}
                  >
                    <ProviderGlyph
                      id={m.providerId}
                      className="w-3.5 h-3.5 text-fg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-fg font-medium">
                          {m.displayName}
                        </span>
                        {m.capabilities.supportsEdit && (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                            Edit
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-fg-subtle truncate font-mono">
                        {m.id}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
