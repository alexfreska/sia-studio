import { useToastStore } from '../stores/toast'

export function CopyButton({
  value,
  label = 'Copied to clipboard',
}: {
  value: string
  label?: string
}) {
  const addToast = useToastStore((s) => s.addToast)

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value)
        addToast(label)
      }}
      className="relative p-1.5 text-fg-subtle hover:text-fg active:scale-[0.96] btn-transition before:absolute before:content-[''] before:-inset-2"
      title="Copy"
      aria-label="Copy to clipboard"
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    </button>
  )
}
