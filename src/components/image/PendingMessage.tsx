import type { ImageRecord } from '../../stores/gallery'
import type { GenerationStage, Inflight } from '../../stores/generation'

function stageLabel(stage: GenerationStage): string {
  switch (stage) {
    case 'preparing':
      return 'Preparing reference…'
    case 'generating':
      return 'Generating with the model…'
    case 'uploading':
      return 'Uploading to Sia…'
    case 'finalizing':
      return 'Pinning & indexing…'
  }
}

export function PendingMessage({
  image,
  inflight,
  onCancel,
}: {
  image: ImageRecord
  inflight: Inflight | undefined
  onCancel: () => void
}) {
  const stage = inflight?.stage ?? 'generating'
  const progress = image.uploadProgress
  const percent = progress
    ? Math.min(100, Math.round((progress.bytesUploaded / progress.total) * 100))
    : 0

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-1 max-w-md">
        <div className="relative aspect-square w-full max-w-sm rounded-xl overflow-hidden border border-border-subtle">
          {image.localPreviewUrl ? (
            <img
              src={image.localPreviewUrl}
              alt="Generating"
              className="w-full h-full object-cover img-outline"
            />
          ) : (
            <div className="w-full h-full animate-shimmer" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            {stage === 'uploading' && progress ? (
              <div
                className="h-full w-full bg-accent-gradient origin-left transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
            ) : (
              <div className="h-full bg-accent-sweep" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-fg-muted">{stageLabel(stage)}</span>
          {progress && (
            <span className="font-mono text-fg-subtle tabular-nums">
              {progress.shardsDone} shards
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto text-fg-subtle hover:text-danger active:scale-[0.96] btn-transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
