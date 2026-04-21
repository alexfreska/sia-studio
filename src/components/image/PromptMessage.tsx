export function PromptMessage({
  prompt,
  timestamp,
}: {
  prompt: string
  timestamp?: number
}) {
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1 animate-fade-in">
        <div className="px-4 py-2.5 bg-bg-2 border border-border-subtle rounded-2xl rounded-br-md text-sm text-fg whitespace-pre-wrap break-words text-pretty">
          {prompt}
        </div>
        {time && (
          <p className="text-[11px] text-fg-subtle text-right mr-2 tabular-nums">
            {time}
          </p>
        )}
      </div>
    </div>
  )
}
