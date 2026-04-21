import { useState } from 'react'
import { removeProviderKey, useKeyMetaStore } from '../../stores/apiKeys'
import type { Provider } from '../../types/providers'
import { KeyPasteInput } from '../onboarding/KeyPasteInput'
import { ProviderGlyph } from '../onboarding/ProviderGlyph'

export function ProviderRow({ provider }: { provider: Provider }) {
  const meta = useKeyMetaStore((s) => s.meta[provider.id])
  const [editing, setEditing] = useState(false)
  const isConfigured = Boolean(meta)

  return (
    <div className="py-4 border-b border-border-subtle last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-fg">
          <ProviderGlyph id={provider.id} className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-fg">
              {provider.displayName}
            </span>
            {isConfigured && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                Configured
              </span>
            )}
          </div>
          {isConfigured && meta ? (
            <span className="font-mono text-[11px] text-fg-subtle">
              {meta.suffix}
            </span>
          ) : (
            <span className="text-[11px] text-fg-subtle">
              {provider.tagline}
            </span>
          )}
        </div>
        {!editing &&
          (isConfigured ? (
            <button
              type="button"
              onClick={() => removeProviderKey(provider.id)}
              className="text-xs text-fg-subtle hover:text-danger btn-transition active:scale-[0.96]"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-xs rounded-md border border-border-subtle text-fg hover:border-accent hover:bg-accent-soft btn-transition active:scale-[0.96]"
            >
              + Add key
            </button>
          ))}
      </div>

      {editing && !isConfigured && (
        <div className="mt-3">
          <KeyPasteInput
            provider={provider}
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </div>
  )
}
