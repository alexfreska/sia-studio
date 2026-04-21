import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { experimental_generateImage as generateImage } from 'ai'
import type {
  GenerateArgs,
  GenerateResult,
  Provider,
  ProviderModel,
} from '../../types/providers'

const MODELS: ProviderModel[] = [
  {
    id: 'imagen-3.0-generate-002',
    providerId: 'google',
    displayName: 'Imagen 3',
    shortLabel: 'imagen-3',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
      costHint: 'low',
    },
    uiParams: [
      {
        kind: 'enum',
        name: 'aspectRatio',
        values: ['1:1', '3:4', '4:3', '9:16', '16:9'],
        default: '1:1',
      },
    ],
  },
  {
    id: 'imagen-4.0-generate-001',
    providerId: 'google',
    displayName: 'Imagen 4',
    shortLabel: 'imagen-4',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9'],
      costHint: 'medium',
    },
    uiParams: [
      {
        kind: 'enum',
        name: 'aspectRatio',
        values: ['1:1', '3:4', '4:3', '9:16', '16:9'],
        default: '1:1',
      },
    ],
  },
]

async function generate({
  prompt,
  model,
  params,
  apiKey,
  signal,
}: GenerateArgs): Promise<GenerateResult> {
  const google = createGoogleGenerativeAI({ apiKey })
  const aspectRatio =
    (params.aspectRatio as `${number}:${number}` | undefined) ?? undefined

  const { image } = await generateImage({
    model: google.image(model.id),
    prompt,
    aspectRatio,
    abortSignal: signal,
  })

  return {
    bytes: image.uint8Array,
    contentType: image.mediaType ?? 'image/png',
  }
}

export const googleProvider: Provider = {
  id: 'google',
  displayName: 'Google',
  tagline: 'Imagen 3 and Imagen 4.',
  keyLabel: 'Google AI Studio Key',
  keyPlaceholder: 'AIza…',
  keyHelpUrl: 'https://aistudio.google.com/app/apikey',
  models: MODELS,
  generate,
}
