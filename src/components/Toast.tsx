import { useToastStore } from '../stores/toast'

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-leaving={toast.leaving || undefined}
          className="toast-item px-4 py-2 bg-bg-2 border border-border-subtle rounded-lg text-sm text-fg shadow-2xl shadow-black/50"
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
