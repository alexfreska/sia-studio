import { APP_KIND_IMAGE } from '../lib/constants'
import type { ProviderId } from './providers'

export type ImageMetadata = {
  kind: typeof APP_KIND_IMAGE
  schemaVersion: 1
  // Group key. Stored on every image so grouping is O(1) without walking
  // parent pointers.
  threadId: string
  // Chain pointer. Undefined means this image is the root of its thread.
  parentImageId?: string
  // Optional title. Set on the root image; rename mutates it in place.
  threadTitle?: string
  prompt: string
  provider: ProviderId
  model: string
  modelParams: Record<string, unknown>
  providerAssetUrl?: string
  name: string
  type: string
  size: number
  hash: string
  createdAt: number
}

export type LegacyFileMetadata = {
  kind?: undefined
  name?: string
  type?: string
  size?: number
  hash?: string
  createdAt?: number
  updatedAt?: number
}

export type AnyMetadata = ImageMetadata | LegacyFileMetadata

export function isImageMetadata(m: unknown): m is ImageMetadata {
  if (typeof m !== 'object' || m === null) return false
  const r = m as Record<string, unknown>
  return (
    r.kind === APP_KIND_IMAGE &&
    typeof r.threadId === 'string' &&
    typeof r.prompt === 'string' &&
    typeof r.provider === 'string' &&
    typeof r.model === 'string'
  )
}
