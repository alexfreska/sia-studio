import type { Builder } from '@siafoundation/sia-storage'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { CopyButton } from '../CopyButton'
import { Hero } from '../Hero'

export function ApproveScreen({
  builder,
}: {
  builder: React.RefObject<Builder | null>
}) {
  const { approvalUrl, setStep, setError } = useAuthStore()
  const [polling, setPolling] = useState(true)
  const [pollError, setPollError] = useState(false)
  const [manualChecking, setManualChecking] = useState(false)
  const pollStarted = useRef(false)

  useEffect(() => {
    if (pollStarted.current) return
    pollStarted.current = true

    async function poll() {
      const b = builder.current
      if (!b) return
      try {
        await b.waitForApproval()
        setStep('recovery')
      } catch {
        setPolling(false)
        setPollError(true)
      }
    }
    poll()
  }, [builder, setStep])

  async function handleManualCheck() {
    const b = builder.current
    if (!b) {
      setError('No builder instance')
      return
    }
    setManualChecking(true)
    setPollError(false)
    setPolling(true)
    try {
      await b.waitForApproval()
      setStep('recovery')
    } catch (e) {
      setPolling(false)
      setPollError(true)
      setError(e instanceof Error ? e.message : 'Approval check failed')
    } finally {
      setManualChecking(false)
    }
  }

  return (
    <Hero subtitle="Open the approval link in another tab to authorize sia-studio, then return here.">
      <div className="max-w-md mx-auto space-y-3">
        {approvalUrl && (
          <>
            <div className="flex items-center gap-2 p-3 bg-bg-2 border border-border-subtle rounded-lg">
              <span className="flex-1 text-sm font-mono text-fg-muted truncate">
                {approvalUrl}
              </span>
              <CopyButton value={approvalUrl} label="URL copied" />
            </div>
            <a
              href={approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 bg-accent-gradient text-bg-0 font-medium rounded-lg btn-transition hover:brightness-110 active:scale-[0.96]"
            >
              Open link
            </a>
          </>
        )}

        <button
          type="button"
          onClick={handleManualCheck}
          disabled={manualChecking}
          className="w-full py-3 bg-bg-2 hover:bg-bg-3 disabled:opacity-50 text-fg font-medium rounded-lg btn-transition active:scale-[0.96] disabled:active:scale-100"
        >
          {manualChecking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-border-strong border-t-accent rounded-full animate-[spin_700ms_linear_infinite]" />
              Checking…
            </span>
          ) : (
            'Check approval'
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-fg-subtle pt-1">
          {polling ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              Polling for approval…
            </>
          ) : pollError ? (
            <span>Auto-polling stopped</span>
          ) : null}
        </div>
      </div>
    </Hero>
  )
}
