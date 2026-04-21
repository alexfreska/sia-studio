import { useGenerationStore } from '../../stores/generation'

const SUGGESTIONS = [
  'A quiet harbor at dawn, muted palette',
  'Isometric reading room, soft light',
  'Studio photograph of a single pear',
]

export function EmptyThreadState() {
  const setPrompt = useGenerationStore((s) => s.setPrompt)
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="space-y-3 max-w-lg">
        <p
          className="text-xs font-medium uppercase tracking-wider text-fg-subtle animate-fade-in"
          style={{ animationFillMode: 'both' }}
        >
          New thread
        </p>
        <h2
          className="text-3xl font-semibold text-fg tracking-tight text-balance animate-fade-in"
          style={{ animationDelay: '60ms', animationFillMode: 'both' }}
        >
          Describe an image to begin.
        </h2>
        <p
          className="text-sm text-fg-muted text-pretty animate-fade-in"
          style={{ animationDelay: '120ms', animationFillMode: 'both' }}
        >
          Press <kbd className="font-mono text-fg-muted">⏎</kbd> to send.{' '}
          <kbd className="font-mono text-fg-muted">⇧⏎</kbd> for a new line.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-xl">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrompt(s)}
            className="px-3 py-1.5 rounded-full border border-border-subtle bg-bg-1 hover:bg-bg-2 hover:border-border-strong text-xs text-fg-muted hover:text-fg active:scale-[0.96] btn-transition animate-fade-in"
            style={{
              animationDelay: `${200 + i * 60}ms`,
              animationFillMode: 'both',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
