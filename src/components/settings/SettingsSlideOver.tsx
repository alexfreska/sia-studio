import { useEffect } from 'react'
import { PROVIDER_IDS, PROVIDERS } from '../../lib/providers'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { useAuthStore } from '../../stores/auth'
import { useSettingsStore } from '../../stores/settings'
import { DangerZone } from './DangerZone'
import { ProviderRow } from './ProviderRow'

export function SettingsSlideOver() {
  const open = useSettingsStore((s) => s.open)
  const close = useSettingsStore((s) => s.close)
  useBodyScrollLock(open)
  const indexerUrl = useAuthStore((s) => s.indexerUrl)
  const sdk = useAuthStore((s) => s.sdk)
  const pubKey = sdk?.appKey().publicKey() ?? null

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <button
        type="button"
        aria-label="Close settings"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={close}
        className={`fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm transition-opacity ease-[cubic-bezier(0.32,0.72,0,1)] cursor-default ${
          open
            ? 'opacity-100 duration-[280ms]'
            : 'opacity-0 pointer-events-none duration-[200ms]'
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-bg-1 border-l border-border-subtle shadow-2xl transition-transform ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          open
            ? 'translate-x-0 duration-[280ms]'
            : 'translate-x-full duration-[200ms]'
        }`}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-fg">Settings</h2>
          <button
            type="button"
            onClick={close}
            className="relative p-2 text-fg-muted hover:text-fg rounded-md hover:bg-bg-2 active:scale-[0.96] btn-transition before:absolute before:content-[''] before:-inset-1"
            aria-label="Close settings"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section className="space-y-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
              Providers
            </h3>
            <div>
              {PROVIDER_IDS.map((id) => (
                <ProviderRow key={id} provider={PROVIDERS[id]} />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
              Sia storage
            </h3>
            <dl className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-fg-subtle">Indexer</dt>
                <dd className="font-mono text-fg-muted truncate ml-2">
                  {indexerUrl || '—'}
                </dd>
              </div>
              {pubKey && (
                <div className="flex justify-between">
                  <dt className="text-fg-subtle">Public key</dt>
                  <dd className="font-mono text-fg-muted truncate ml-2 tabular-nums">
                    {pubKey.slice(0, 10)}…{pubKey.slice(-8)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <DangerZone />
        </div>
      </aside>
    </>
  )
}
