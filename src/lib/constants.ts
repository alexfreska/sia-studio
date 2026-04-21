import type { AppMetadata } from '@siafoundation/sia-storage'

// biome-ignore format: long hex literal
export const APP_KEY = '8a2a9c28a9efde43ce2b1738eaf63eb757169c2bc5a97f313b3430ecbf850704'
export const APP_NAME = 'sia-studio'
export const DEFAULT_INDEXER_URL = 'https://sia.storage'
export const APP_META: AppMetadata = {
  appId: APP_KEY,
  name: APP_NAME,
  description: 'Generate and store media privately on Sia.',
  serviceUrl: 'https://sia.storage',
  logoUrl: undefined,
  callbackUrl: undefined,
}

// Erasure coding parameters — passed to sdk.upload() and encodedSize().
export const DATA_SHARDS = 10
export const PARITY_SHARDS = 20

// Metadata discriminator tag for Sia-stored objects.
export const APP_KIND_IMAGE = 'image'
