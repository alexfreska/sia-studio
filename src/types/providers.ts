export type ProviderId = 'openai' | 'google' | 'fal' | 'replicate'

export type ImageSize = `${number}x${number}` | 'auto'
export type AspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '4:3'
  | '3:4'
  | '3:2'
  | '2:3'

export type ModelCapabilities = {
  supportsEdit: boolean
  supportsMultiReference: boolean
  maxReferences: number
  sizes?: ImageSize[]
  aspectRatios?: AspectRatio[]
  costHint: 'low' | 'medium' | 'high' | 'variable'
}

export type UiParam =
  | {
      kind: 'enum'
      name: string
      label?: string
      values: string[]
      default?: string
    }
  | {
      kind: 'number'
      name: string
      label?: string
      min: number
      max: number
      step?: number
      default?: number
    }
  | { kind: 'boolean'; name: string; label?: string; default?: boolean }

export type ProviderModel = {
  id: string
  providerId: ProviderId
  displayName: string
  shortLabel?: string
  capabilities: ModelCapabilities
  uiParams?: UiParam[]
}

export type GenerateArgs = {
  prompt: string
  model: ProviderModel
  params: Record<string, unknown>
  apiKey: string
  references?: Array<{ bytes: Uint8Array; contentType: string }>
  signal?: AbortSignal
}

export type GenerateResult = {
  bytes: Uint8Array
  contentType: string
  providerAssetUrl?: string
}

export type Provider = {
  id: ProviderId
  displayName: string
  tagline: string
  keyLabel: string
  keyPlaceholder: string
  keyHelpUrl: string
  models: ProviderModel[]
  generate: (args: GenerateArgs) => Promise<GenerateResult>
}
