import { PROVIDER_IDS, PROVIDERS } from '../../lib/providers'
import { Hero } from '../Hero'
import { ProviderCard } from './ProviderCard'

export function ApiKeyOnboarding() {
  return (
    <Hero subtitle="Add a provider to continue. Keys stay on this device. Generated images are encrypted in your browser and uploaded directly to the Sia network — no servers in between.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PROVIDER_IDS.map((id, i) => (
          <div
            key={id}
            className="animate-fade-in"
            style={{
              animationDelay: `${i * 70}ms`,
              animationFillMode: 'both',
            }}
          >
            <ProviderCard provider={PROVIDERS[id]} />
          </div>
        ))}
      </div>
    </Hero>
  )
}
