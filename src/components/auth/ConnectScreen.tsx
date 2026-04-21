import { Builder } from '@siafoundation/sia-storage'
import { useState } from 'react'
import { APP_META, DEFAULT_INDEXER_URL } from '../../lib/constants'
import { useAuthStore } from '../../stores/auth'
import { Hero } from '../Hero'

export function ConnectScreen({
  builder,
}: {
  builder: React.RefObject<Builder | null>
}) {
  const { indexerUrl, setIndexerUrl, setStep, setError, setApprovalUrl } =
    useAuthStore()
  const [url, setUrl] = useState(indexerUrl || DEFAULT_INDEXER_URL)
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      const b = new Builder(url, APP_META)
      builder.current = b
      setIndexerUrl(url)
      try {
        await b.requestConnection()
        setApprovalUrl(b.responseUrl())
        setStep('approve')
      } catch (e) {
        setError(
          e instanceof Error
            ? `Connection failed: ${e.message}. Check the indexer URL and CORS.`
            : 'Connection failed. Check the indexer URL and CORS.',
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Hero subtitle="Connect to a Sia indexer to begin. Your images will be encrypted in this browser and stored directly on the Sia network.">
      <div className="max-w-md mx-auto space-y-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sia.storage"
          className="w-full px-4 py-3 bg-bg-2 border border-border-subtle rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading || !url}
          className="w-full py-3 bg-accent-gradient text-bg-0 font-medium rounded-lg btn-transition hover:brightness-110 active:scale-[0.96] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </Hero>
  )
}
