import { AuthFlow } from './components/auth/AuthFlow'
import { GenerationView } from './components/image/GenerationView'
import { Navbar } from './components/Navbar'
import { ApiKeyOnboarding } from './components/onboarding/ApiKeyOnboarding'
import { SettingsSlideOver } from './components/settings/SettingsSlideOver'
import { Toasts } from './components/Toast'
import { hasAnyKey, useKeyMetaStore } from './stores/apiKeys'
import { useAuthStore } from './stores/auth'

export default function App() {
  const step = useAuthStore((s) => s.step)
  const meta = useKeyMetaStore((s) => s.meta)
  const keysReady = hasAnyKey(meta)

  return (
    <div className="h-dvh flex flex-col bg-bg-0 text-fg overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col relative min-h-0">
        {step !== 'connected' ? (
          <AuthFlow />
        ) : !keysReady ? (
          <ApiKeyOnboarding />
        ) : (
          <GenerationView />
        )}
      </main>
      <SettingsSlideOver />
      <Toasts />
    </div>
  )
}
