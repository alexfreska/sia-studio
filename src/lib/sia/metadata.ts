import type { AnyMetadata, ImageMetadata } from '../../types/image'

export function encodeMetadata(meta: AnyMetadata): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(meta))
}

export function decodeMetadata(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

const MAX_PROMPT_BYTES = 4096

export function capPrompt(prompt: string): string {
  const enc = new TextEncoder().encode(prompt)
  if (enc.byteLength <= MAX_PROMPT_BYTES) return prompt
  return new TextDecoder().decode(enc.slice(0, MAX_PROMPT_BYTES))
}

export type ImageMetadataDraft = Omit<ImageMetadata, 'kind' | 'schemaVersion'>

export function makeImageMetadata(draft: ImageMetadataDraft): ImageMetadata {
  return {
    ...draft,
    prompt: capPrompt(draft.prompt),
    kind: 'image',
    schemaVersion: 1,
  }
}
