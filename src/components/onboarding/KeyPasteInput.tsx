import { useState } from 'react'
import { setProviderKey } from '../../stores/apiKeys'
import type { Provider } from '../../types/providers'

export function KeyPasteInput({
  provider,
  onSaved,
  onCancel,
}: {
  provider: Provider
  onSaved: () => void
  onCancel: () => void
}) {
  const [value, setValue] = useState('')

  function handleSave() {
    const key = value.trim()
    if (!key) return
    setProviderKey(provider.id, key)
    setValue('')
    onSaved()
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={`key-${provider.id}`}
        className="block text-[11px] font-medium uppercase tracking-wider text-fg-subtle"
      >
        {provider.keyLabel}
      </label>
      <div className="flex gap-2">
        <input
          id={`key-${provider.id}`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={provider.keyPlaceholder}
          className="flex-1 px-3 py-2 bg-bg-1 border border-border-subtle rounded-md text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent font-mono text-sm transition-colors"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!value.trim()}
          className="px-4 py-2 bg-accent-gradient text-bg-0 text-sm font-medium rounded-md hover:brightness-110 active:scale-[0.96] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed btn-transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-fg-muted hover:text-fg text-sm rounded-md btn-transition active:scale-[0.96]"
        >
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-fg-subtle">
        Get a key at{' '}
        <a
          href={provider.keyHelpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {new URL(provider.keyHelpUrl).hostname}
        </a>
      </p>
    </div>
  )
}
