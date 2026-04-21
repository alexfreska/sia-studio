import { createOpenAI } from '@ai-sdk/openai'
import { experimental_generateImage as generateImage } from 'ai'
import type {
  GenerateArgs,
  GenerateResult,
  Provider,
  ProviderModel,
} from '../../types/providers'

const MODELS: ProviderModel[] = [
  {
    id: 'gpt-image-1',
    providerId: 'openai',
    displayName: 'GPT Image 1',
    shortLabel: 'gpt-image-1',
    capabilities: {
      supportsEdit: true,
      supportsMultiReference: true,
      maxReferences: 4,
      sizes: ['1024x1024', '1024x1536', '1536x1024', 'auto'],
      costHint: 'medium',
    },
    uiParams: [
      {
        kind: 'enum',
        name: 'size',
        values: ['1024x1024', '1024x1536', '1536x1024', 'auto'],
        default: '1024x1024',
      },
      {
        kind: 'enum',
        name: 'quality',
        values: ['auto', 'low', 'medium', 'high'],
        default: 'auto',
      },
    ],
  },
  {
    id: 'dall-e-3',
    providerId: 'openai',
    displayName: 'DALL·E 3',
    shortLabel: 'dall-e-3',
    capabilities: {
      supportsEdit: false,
      supportsMultiReference: false,
      maxReferences: 0,
      sizes: ['1024x1024', '1024x1792', '1792x1024'],
      costHint: 'low',
    },
    uiParams: [
      {
        kind: 'enum',
        name: 'size',
        values: ['1024x1024', '1024x1792', '1792x1024'],
        default: '1024x1024',
      },
      {
        kind: 'enum',
        name: 'quality',
        values: ['standard', 'hd'],
        default: 'standard',
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
  const openai = createOpenAI({ apiKey })
  const size = (params.size as `${number}x${number}` | undefined) ?? undefined
  const openaiOpts: Record<string, string> = {}
  if (typeof params.quality === 'string') openaiOpts.quality = params.quality
  if (typeof params.background === 'string')
    openaiOpts.background = params.background

  const { image } = await generateImage({
    model: openai.image(model.id),
    prompt,
    size,
    providerOptions: { openai: openaiOpts },
    abortSignal: signal,
  })

  return {
    bytes: image.uint8Array,
    contentType: image.mediaType ?? 'image/png',
  }
}

export const openaiProvider: Provider = {
  id: 'openai',
  displayName: 'OpenAI',
  tagline: 'DALL·E 3 and GPT Image 1.',
  keyLabel: 'OpenAI API Key',
  keyPlaceholder: 'sk-…',
  keyHelpUrl: 'https://platform.openai.com/api-keys',
  models: MODELS,
  generate,
}
