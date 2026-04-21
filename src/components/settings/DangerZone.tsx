import { removeAllProviderKeys } from '../../stores/apiKeys'
import { useAuthStore } from '../../stores/auth'

export function DangerZone() {
  const resetAuth = useAuthStore((s) => s.reset)

  function confirmAndRemoveAllKeys() {
    if (
      window.confirm(
        'Remove every provider key from this browser? You will need to paste them again to generate.',
      )
    ) {
      removeAllProviderKeys()
    }
  }

  function signOut() {
    if (
      window.confirm('Sign out of Sia? You will return to the connect step.')
    ) {
      resetAuth()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
        Danger zone
      </h3>
      <button
        type="button"
        onClick={confirmAndRemoveAllKeys}
        className="w-full py-2 px-3 text-sm text-left rounded-md border border-border-subtle text-fg hover:border-danger/40 hover:text-danger btn-transition active:scale-[0.96]"
      >
        Remove all provider keys
      </button>
      <button
        type="button"
        onClick={signOut}
        className="w-full py-2 px-3 text-sm text-left rounded-md border border-border-subtle text-fg hover:border-danger/40 hover:text-danger btn-transition active:scale-[0.96]"
      >
        Sign out of Sia
      </button>
    </div>
  )
}
