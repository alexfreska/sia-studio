import { useState } from 'react'
import { removeProviderKey, useKeyMetaStore } from '../../stores/apiKeys'
import type { Provider } from '../../types/providers'
import { KeyPasteInput } from './KeyPasteInput'
import { ProviderGlyph } from './ProviderGlyph'

export function ProviderCard({ provider }: { provider: Provider }) {
  const meta = useKeyMetaStore((s) => s.meta[provider.id])
  const [editing, setEditing] = useState(false)
  const isConfigured = Boolean(meta)

  return (
    <div
      className={`relative rounded-xl border p-5 btn-transition ${
        isConfigured
          ? 'border-border-strong bg-bg-2'
          : 'border-border-subtle bg-bg-1 hover:border-border-strong hover:bg-bg-2'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-fg">
          <ProviderGlyph id={provider.id} className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg">
              {provider.displayName}
            </h3>
            {isConfigured && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-accent">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                </span>
                Ready
              </span>
            )}
          </div>
          <p className="text-xs text-fg-muted mt-0.5">{provider.tagline}</p>
        </div>
      </div>

      <div className="mt-4">
        {editing && !isConfigured ? (
          <KeyPasteInput
            provider={provider}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        ) : isConfigured && meta ? (
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-fg-muted">
              {meta.suffix}
            </span>
            <button
              type="button"
              onClick={() => removeProviderKey(provider.id)}
              className="text-xs text-fg-subtle hover:text-danger btn-transition active:scale-[0.96]"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full py-2 rounded-md border border-border-subtle text-sm text-fg hover:border-accent hover:bg-accent-soft btn-transition active:scale-[0.96]"
          >
            + Add key
          </button>
        )}
      </div>
    </div>
  )
}
