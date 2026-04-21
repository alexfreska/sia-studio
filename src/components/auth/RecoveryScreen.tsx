import {
  type Builder,
  generateRecoveryPhrase,
  validateRecoveryPhrase,
} from '@siafoundation/sia-storage'
import { useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { CopyButton } from '../CopyButton'
import { Hero } from '../Hero'

export function RecoveryScreen({
  builder,
}: {
  builder: React.RefObject<Builder | null>
}) {
  const { setSdk, setStoredKeyHex, setError } = useAuthStore()
  const [mode, setMode] = useState<'choose' | 'generate' | 'import'>('choose')
  const [phrase, setPhrase] = useState('')
  const [generatedPhrase, setGeneratedPhrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [phraseError, setPhraseError] = useState<string | null>(null)

  function handleGenerate() {
    const mnemonic = generateRecoveryPhrase()
    setGeneratedPhrase(mnemonic)
    setPhrase(mnemonic)
    setMode('generate')
  }

  function handleValidatePhrase(value: string) {
    setPhrase(value)
    setPhraseError(null)
    if (value.trim()) {
      try {
        validateRecoveryPhrase(value.trim())
      } catch {
        setPhraseError('Invalid recovery phrase')
      }
    }
  }

  async function handleRegister() {
    const b = builder.current
    if (!b) {
      setError('No builder instance')
      return
    }
    const mnemonic = phrase.trim()
    try {
      validateRecoveryPhrase(mnemonic)
    } catch {
      setPhraseError('Invalid recovery phrase')
      return
    }
    setLoading(true)
    try {
      const sdk = await b.register(mnemonic)
      setStoredKeyHex(sdk.appKey().export().toHex())
      setSdk(sdk)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <Hero subtitle="Generate a new 12-word recovery phrase or enter an existing one. The phrase derives every key your data is encrypted with.">
        <div className="max-w-md mx-auto space-y-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full py-3 bg-accent-gradient text-bg-0 font-medium rounded-lg btn-transition hover:brightness-110 active:scale-[0.96]"
          >
            Generate new phrase
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className="w-full py-3 bg-bg-2 hover:bg-bg-3 text-fg font-medium rounded-lg btn-transition active:scale-[0.96]"
          >
            Enter existing phrase
          </button>
        </div>
      </Hero>
    )
  }

  return (
    <Hero
      subtitle={
        mode === 'generate'
          ? 'Write down these 12 words in order. They are the only way to recover your account.'
          : 'Enter your 12-word recovery phrase to restore your account.'
      }
    >
      <div className="max-w-md mx-auto space-y-3">
        {mode === 'generate' ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 p-4 bg-bg-1 rounded-lg border border-border-subtle">
              {generatedPhrase.split(' ').map((word, i) => (
                <div
                  key={`${word}-${i}`}
                  className="text-center py-2 bg-bg-2 rounded text-sm"
                >
                  <span className="text-fg-subtle mr-1">{i + 1}.</span>
                  <span className="text-fg">{word}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <CopyButton
                value={generatedPhrase}
                label="Recovery phrase copied"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={phrase}
              onChange={(e) => handleValidatePhrase(e.target.value)}
              placeholder="Enter your 12-word recovery phrase…"
              rows={3}
              className="w-full px-4 py-3 bg-bg-2 border border-border-subtle rounded-lg text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent transition-colors"
            />
            {phraseError && (
              <p className="text-danger text-sm">{phraseError}</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleRegister}
          disabled={loading || !phrase.trim()}
          className="w-full py-3 bg-accent-gradient text-bg-0 font-medium rounded-lg btn-transition hover:brightness-110 active:scale-[0.96] disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering…' : 'Complete setup'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('choose')
            setPhrase('')
            setGeneratedPhrase('')
            setPhraseError(null)
          }}
          className="w-full py-2 text-fg-subtle hover:text-fg text-sm btn-transition active:scale-[0.96]"
        >
          Back
        </button>
      </div>
    </Hero>
  )
}
