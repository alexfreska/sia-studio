import type { Provider, ProviderId, ProviderModel } from '../../types/providers'
import { falProvider } from './fal'
import { googleProvider } from './google'
import { openaiProvider } from './openai'
import { replicateProvider } from './replicate'

export const PROVIDERS: Record<ProviderId, Provider> = {
  openai: openaiProvider,
  google: googleProvider,
  fal: falProvider,
  replicate: replicateProvider,
}

export const PROVIDER_IDS: ProviderId[] = [
  'openai',
  'google',
  'fal',
  'replicate',
]

export function getProvider(id: ProviderId): Provider {
  return PROVIDERS[id]
}

export function listAllModels(): ProviderModel[] {
  return PROVIDER_IDS.flatMap((id) => PROVIDERS[id].models)
}

export function listConfiguredModels(
  configured: Record<ProviderId, boolean>,
): ProviderModel[] {
  return listAllModels().filter((m) => configured[m.providerId])
}

export function findModel(id: string): ProviderModel | undefined {
  return listAllModels().find((m) => m.id === id)
}

export function canContinueThread(
  lastImageProviderId: ProviderId | undefined,
  model: ProviderModel,
): boolean {
  if (!lastImageProviderId) return true
  return model.capabilities.supportsEdit
}
