import { createFal } from '@ai-sdk/fal'
import { experimental_generateImage as generateImage } from 'ai'
import type {
  GenerateArgs,
  GenerateResult,
  Provider,
  ProviderModel,
} from '../../types/providers'

const MODELS: ProviderModel[] = [
  {
    id: 'fal-ai/flux/schnell',
    providerId: 'fal',
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
    id: 'fal-ai/flux/dev',
    providerId: 'fal',
    displayName: 'FLUX Dev',
    shortLabel: 'flux-dev',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'medium',
    },
  },
  {
    id: 'fal-ai/flux-pro/v1.1',
    providerId: 'fal',
    displayName: 'FLUX Pro 1.1',
    shortLabel: 'flux-pro-1.1',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'high',
    },
  },
  {
    id: 'fal-ai/flux-pro/kontext',
    providerId: 'fal',
    displayName: 'FLUX Kontext',
    shortLabel: 'flux-kontext',
    capabilities: {
      supportsEdit: true,
      supportsMultiReference: false,
      maxReferences: 1,
      aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costHint: 'high',
    },
  },
]

async function generate({
  prompt,
  model,
  params,
  apiKey,
  references,
  signal,
}: GenerateArgs): Promise<GenerateResult> {
  const fal = createFal({ apiKey })
  const aspectRatio =
    (params.aspectRatio as `${number}:${number}` | undefined) ?? undefined

  const falOpts: Record<string, string> = {}
  if (references?.length && model.capabilities.supportsEdit) {
    const first = references[0]
    const base64 = uint8ToBase64(first.bytes)
    falOpts.image_url = `data:${first.contentType};base64,${base64}`
  }

  const { image } = await generateImage({
    model: fal.image(model.id),
    prompt,
    aspectRatio,
    providerOptions: { fal: falOpts },
    abortSignal: signal,
  })

  return {
    bytes: image.uint8Array,
    contentType: image.mediaType ?? 'image/png',
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export const falProvider: Provider = {
  id: 'fal',
  displayName: 'fal.ai',
  tagline: 'FLUX family, fast inference.',
  keyLabel: 'fal.ai Key',
  keyPlaceholder: 'fal_…',
  keyHelpUrl: 'https://fal.ai/dashboard/keys',
  models: MODELS,
  generate,
}
