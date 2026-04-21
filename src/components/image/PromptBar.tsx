import { useEffect, useRef } from 'react'
import { findModel } from '../../lib/providers'
import { useKeyMetaStore } from '../../stores/apiKeys'
import { useGalleryStore } from '../../stores/gallery'
import { useGenerationStore } from '../../stores/generation'
import { ModelPicker } from './ModelPicker'
import { ReferenceImageChip } from './ReferenceImageChip'

const MAX_HEIGHT_PX = 192

export function PromptBar() {
  const prompt = useGenerationStore((s) => s.prompt)
  const setPrompt = useGenerationStore((s) => s.setPrompt)
  const selectedModelId = useGenerationStore((s) => s.selectedModelId)
  const selectedThreadId = useGenerationStore((s) => s.selectedThreadId)
  const selectThread = useGenerationStore((s) => s.selectThread)
  const parentImageId = useGenerationStore((s) => s.parentImageId)
  const setParentImageId = useGenerationStore((s) => s.setParentImageId)
  const startGeneration = useGenerationStore((s) => s.startGeneration)
  const isGenerating = useGenerationStore((s) =>
    s.selectedThreadId
      ? Object.values(s.inflight).some((f) => f.threadId === s.selectedThreadId)
      : false,
  )
  const parentImage = useGalleryStore((s) =>
    parentImageId ? s.imagesById[parentImageId] : undefined,
  )
  const selectedModel = selectedModelId ? findModel(selectedModelId) : undefined
  const selectedProviderConfigured = useKeyMetaStore((s) =>
    selectedModel ? Boolean(s.meta[selectedModel.providerId]) : false,
  )
  const canSubmit =
    Boolean(prompt.trim()) &&
    Boolean(selectedModel) &&
    selectedProviderConfigured &&
    !isGenerating
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: prompt triggers resize by design
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [prompt])

  async function handleSubmit() {
    if (!canSubmit || !selectedModel) return
    const threadId = selectedThreadId ?? crypto.randomUUID()
    if (!selectedThreadId) selectThread(threadId)

    await startGeneration({
      prompt: prompt.trim(),
      model: selectedModel,
      threadId,
      parentImageId: parentImageId ?? undefined,
    })
    setParentImageId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-border-subtle bg-bg-1/80 backdrop-blur-sm px-4 py-3 md:px-6 md:py-4">
      <div className="max-w-3xl mx-auto">
        {parentImage && (
          <div className="mb-2">
            <ReferenceImageChip
              image={parentImage}
              onRemove={() => setParentImageId(null)}
            />
          </div>
        )}
        <div className="flex items-end gap-2 p-2 rounded-2xl border border-border-subtle bg-bg-2 focus-within:border-border-strong transition-colors">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              parentImage ? 'Describe the change…' : 'Describe an image…'
            }
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-fg placeholder:text-fg-subtle focus:outline-none text-sm leading-6 max-h-48"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <ModelPicker requireEdit={Boolean(parentImage)} />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-1.5 rounded-lg bg-accent-gradient text-bg-0 text-sm font-medium active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 btn-transition"
            >
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-bg-0 border-t-transparent rounded-full animate-[spin_700ms_linear_infinite]" />
                  Generating
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 px-2 text-[11px] text-fg-subtle">
          {selectedModel && !selectedProviderConfigured ? (
            <>
              Add a key for {selectedModel.displayName} in Settings to generate.
            </>
          ) : (
            <>
              Press <kbd className="font-mono text-fg-muted">⏎</kbd> to send,{' '}
              <kbd className="font-mono text-fg-muted">⇧⏎</kbd> for newline.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
