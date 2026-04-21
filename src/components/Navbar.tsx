import { useMemo } from 'react'
import { APP_NAME } from '../lib/constants'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { CopyButton } from './CopyButton'

export function Navbar() {
  const step = useAuthStore((s) => s.step)
  const sdk = useAuthStore((s) => s.sdk)
  const reset = useAuthStore((s) => s.reset)
  const openSettings = useSettingsStore((s) => s.openPanel)
  const isConnected = step === 'connected'

  const publicKey = useMemo(() => {
    try {
      return sdk?.appKey().publicKey() ?? null
    } catch {
      return null
    }
  }, [sdk])

  function handleSignOut() {
    reset()
    window.location.reload()
  }

  return (
    <header className="relative z-10 border-b border-border-subtle bg-bg-0/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-6xl mx-auto gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden="true"
            className="size-5 rounded-md bg-accent-gradient shadow-[0_0_24px_-6px_var(--color-accent)] shrink-0"
          />
          <h1 className="text-sm font-semibold text-fg tracking-tight truncate">
            {APP_NAME}
          </h1>
        </div>
        {isConnected && publicKey && (
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <span
              className="relative h-2 w-2 hidden sm:flex"
              aria-hidden="true"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span
              className="text-[11px] font-mono text-fg-muted hidden md:inline tabular-nums"
              title={publicKey}
            >
              {publicKey.slice(0, 8)}…{publicKey.slice(-6)}
            </span>
            <CopyButton value={publicKey} label="Public key copied" />
            <button
              type="button"
              onClick={openSettings}
              className="relative p-2 text-fg-muted hover:text-fg active:scale-[0.96] btn-transition rounded-md hover:bg-bg-2 before:absolute before:content-[''] before:-inset-1"
              title="Settings"
              aria-label="Open settings"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs text-fg-muted hover:text-fg active:scale-[0.96] btn-transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
