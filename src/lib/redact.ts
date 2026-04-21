export function redactKey(text: string, key?: string | null): string {
  if (!key) return text
  return text.replaceAll(key, '[REDACTED]')
}

export function describeError(e: unknown, key?: string | null): string {
  const raw = e instanceof Error ? e.message : String(e)
  return redactKey(raw, key)
}

export function maskedSuffix(key: string): string {
  return `••••${key.slice(-4)}`
}
