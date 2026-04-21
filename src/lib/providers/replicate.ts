import { createReplicate } from '@ai-sdk/replicate'
import { experimental_generateImage as generateImage } from 'ai'
import type {
  GenerateArgs,
  GenerateResult,
  Provider,
  ProviderModel,
} from '../../types/providers'

const MODELS: ProviderModel[] = [
  {
    id: 'black-forest-labs/flux-schnell',
    providerId: 'replicate',
    displayName: 'FLUX Schnell',
    shortLabel: 'flux-schnell',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'low',
    },
    uiParams: [
      {
        kind: 'enum',
        name: 'aspectRatio',
        values: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        default: '1:1',
      },
    ],
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    providerId: 'replicate',
    displayName: 'FLUX 1.1 Pro',
    shortLabel: 'flux-1.1-pro',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'high',
    },
  },
  {
    id: 'ideogram-ai/ideogram-v2',
    providerId: 'replicate',
    displayName: 'Ideogram v2',
    shortLabel: 'ideogram-v2',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'medium',
    },
  },
]

async function generate({
  prompt,
  model,
  params,
  apiKey,
  signal,
}: GenerateArgs): Promise<GenerateResult> {
  const replicate = createReplicate({ apiToken: apiKey })
  const aspectRatio =
    (params.aspectRatio as `${number}:${number}` | undefined) ?? undefined

  const { image } = await generateImage({
    model: replicate.image(model.id),
    prompt,
    aspectRatio,
    abortSignal: signal,
  })

  return {
    bytes: image.uint8Array,
    contentType: image.mediaType ?? 'image/webp',
  }
}

export const replicateProvider: Provider = {
  id: 'replicate',
  displayName: 'Replicate',
  tagline: 'Open-source image models.',
  keyLabel: 'Replicate API Token',
  keyPlaceholder: 'r8_…',
  keyHelpUrl: 'https://replicate.com/account/api-tokens',
  models: MODELS,
  generate,
}
