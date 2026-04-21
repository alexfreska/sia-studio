# Sia Starter — AI Assistant Guide

## Overview

A starter template for building decentralized storage apps on the Sia network. Uses [`@siafoundation/sia-storage`](https://www.npmjs.com/package/@siafoundation/sia-storage) — a TypeScript SDK that ships a pre-compiled WASM binary for encryption, uploads, downloads, and key management. WASM runs on the main thread (Rust async — no workers required).

**Tech stack:** React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, `@siafoundation/sia-storage`.

## Types are the source of truth

The SDK's runtime shape lives in its `.d.ts` files — they're more current and more precise than any prose. Before calling an unfamiliar method, read:

- `node_modules/@siafoundation/sia-storage/dist/index.d.ts` — top-level exports (`Sdk`, `Builder`, `PinnedObject`, `AppKey`, `ObjectEvent`, `ObjectsCursor`, `ShardProgress`, `initSia`, `generateRecoveryPhrase`, `validateRecoveryPhrase`, `encodedSize`).
- `node_modules/@siafoundation/sia-storage/wasm/sia_storage_wasm.d.ts` — the WASM-bound classes with full method signatures.

Any pattern not shown below can be derived from those files.

## Architecture

### Auth flow state machine

A step-based flow managed by Zustand (`src/stores/auth.ts`):

```
loading → connect → approve → recovery → connected
```

- **loading**: `initSia()` loads the WASM; the app checks for a stored app key.
- **connect**: User enters the indexer URL. The app constructs `new Builder(url, APP_META)` and calls `requestConnection()`.
- **approve**: User visits the builder's approval URL in another tab; the app polls `builder.waitForApproval()`.
- **recovery**: User generates or enters a 12-word BIP-39 recovery phrase; `builder.register(phrase)` returns the `Sdk`.
- **connected**: `Sdk` is ready, the main app UI renders.

### Returning users

Returning users skip `requestConnection`/`waitForApproval`/`register` entirely. `AuthFlow` constructs a `Builder` and calls `builder.connected(appKey)` with the persisted key — it returns an `Sdk` if the key is still valid, or `undefined` to fall back to the `connect` step.

### SDK responsibilities

`@siafoundation/sia-storage` handles:

- Encrypted file uploads/downloads (erasure coding + encryption).
- Key derivation from recovery phrases (BIP-39).
- Object pinning and metadata management.
- Connection auth with indexers.
- Direct streaming to/from Sia hosts — no worker pool needed.

### Zustand persistence

Auth state persists to localStorage via Zustand's `persist` middleware. Storage key: `sia-auth-<first-16-of-app-key>`. Persisted fields: `storedKeyHex`, `indexerUrl`. The app key is stored as hex via the TC39 `Uint8Array.prototype.toHex` method.

## Key files

| File | Description |
|------|-------------|
| `src/lib/constants.ts` | App key, app name, indexer URL, app metadata (typed `AppMetadata`), erasure-coding constants |
| `src/stores/auth.ts` | Auth state machine (Zustand + persist), holds the `Sdk` |
| `src/stores/toast.ts` | Toast notification store (auto-dismiss) |
| `src/components/Navbar.tsx` | App navbar with title, public key, sign out |
| `src/components/Toast.tsx` | Toast overlay component |
| `src/components/CopyButton.tsx` | Copy-to-clipboard button with toast |
| `src/components/auth/AuthFlow.tsx` | Auth orchestrator — `initSia()`, returning-user reconnect via `Builder.connected` |
| `src/components/auth/ConnectScreen.tsx` | Indexer URL form; constructs `new Builder(url, APP_META)` and calls `requestConnection()` |
| `src/components/auth/ApproveScreen.tsx` | Approval polling (auto-polls on mount) |
| `src/components/auth/RecoveryScreen.tsx` | Recovery phrase generation/import; `builder.register(phrase)` → `Sdk` |
| `src/types/uint8array-hex.d.ts` | Ambient types for TC39 `Uint8Array.toHex`/`fromHex` (drop once TS lib ships them) |

## SDK usage patterns

### Upload a file

```ts
import { PinnedObject } from '@siafoundation/sia-storage'

const object = new PinnedObject()
const pinnedObject = await sdk.upload(object, file.stream(), {
  maxInflight: 10,
  onShardUploaded: (progress) => {
    // progress: { hostKey, shardSize, shardIndex, slabIndex, elapsedMs }
  },
})

pinnedObject.updateMetadata(
  new TextEncoder().encode(
    JSON.stringify({ name: 'file.txt', type: 'text/plain', size: file.size }),
  ),
)
await sdk.pinObject(pinnedObject)
await sdk.updateObjectMetadata(pinnedObject)
```

### Download a file

`sdk.download` returns a `ReadableStream` of `Uint8Array` chunks. Buffer it, or stream it directly into a `Response`/`Blob`:

```ts
const stream = sdk.download(pinnedObject, { maxInflight: 10 })
const blob = await new Response(stream).blob()
```

### List files (one-shot)

For a fresh-page snapshot, read the latest events without a cursor:

```ts
const events = await sdk.objectEvents(undefined, 500)
for (const event of events) {
  if (event.deleted || !event.object) continue
  const meta = JSON.parse(new TextDecoder().decode(event.object.metadata()))
  console.log(meta.name, event.object.size())
}
```

For ongoing updates across sessions and devices, see **Syncing with the indexer** below.

### Delete a file

```ts
await sdk.deleteObject(objectId)
```

### Share a file

```ts
const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
const shareUrl = sdk.shareObject(pinnedObject, validUntil)
```

### Download a shared file

```ts
const object = await sdk.sharedObject(shareUrl)
const stream = sdk.download(object)
```

## Syncing with the indexer

`sdk.objectEvents(cursor, limit)` is the primary sync primitive. Each `ObjectEvent` has:

- `id: string` — the object ID.
- `updatedAt: Date` — monotonically increasing; bumped any time the object changes.
- `deleted: boolean` — true when the object was removed.
- `object: PinnedObject | null` — the decrypted handle (null when deleted).

The cursor is `{ id: string, after: Date }`. Passing it filters to events strictly after that point.

### Why `updatedAt` changes

- **User actions** from any device using this app key: `updateObjectMetadata`, `deleteObject`, or a re-pin that rewrites metadata.
- **Indexer repairs**: when hosts go offline, the indexer migrates slabs to healthy hosts and bumps `updatedAt`. Subsequent syncs pick up the repaired state automatically — nothing for the user to do.

Both cases surface through the same event stream, which is why polling `objectEvents` is the one pattern every Sia-backed app should implement.

### Metadata is encrypted

Object metadata is encrypted at rest with the user's app key. The SDK decrypts it transparently when you call `event.object.metadata()`, so `JSON.parse(new TextDecoder().decode(...))` works directly. Anyone without the app key sees ciphertext.

Keep metadata small (a few KB is fine, megabytes are not) — it's a descriptor, not a payload.

### Cross-device sync pattern

```ts
// Initial hydrate (fresh browser, or first ever load). No cursor.
async function initialHydrate() {
  const events = await sdk.objectEvents(undefined, 500)
  events.forEach(apply)
  persistCursor(latest(events))
}

// Periodic poll, cursor-scoped to only fetch what changed.
async function poll() {
  const cursor = loadCursor() // { id, after: Date } or undefined
  const events = await sdk.objectEvents(cursor, 200)
  if (!events.length) return
  events.forEach(apply)
  persistCursor(latest(events))
}
```

Operational tips:

- Persist the cursor in `localStorage` keyed by the app key so it survives reloads.
- Poll only while the tab is visible (`document.visibilityState === 'visible'`).
- Advance the cursor only after the merge succeeds — failed fetches retry cleanly on the next tick.
- Treat `event.deleted === true` as evictions from your local store.
- This is how multi-device eventual consistency works: uploads in Browser A appear in Browser B on its next poll.

If a specific SDK build rejects the cursor shape (WASM serializer edge cases have happened with the `Date` field), you can always pass `undefined` and filter client-side by `event.updatedAt.getTime() > watermarkMs`. The underlying pattern is unchanged.

## Customization

### Change the app key

Edit `src/lib/constants.ts`. The app key is a 32-byte hex string that identifies your app to the indexer. Generate one with:

```ts
crypto.getRandomValues(new Uint8Array(32)).toHex()
```

Objects stored under one app key aren't visible to another — the app key is the namespace.

### Replace the post-auth UI

The post-auth UI is rendered in `src/App.tsx`. The `Sdk` is available via `useAuthStore((s) => s.sdk)`. All SDK methods live directly on `Sdk` — `sdk.upload()`, `sdk.download()`, `sdk.objectEvents()`, etc. The full upload → pin → metadata → list cycle is implemented in `src/stores/generation.ts`.

### Add routes

Install `react-router-dom` and wrap your app. The auth flow should gate all routes.

## Common commands

```bash
bun install     # Install dependencies
bun dev         # Start dev server
bun run build   # Production build
bun run check   # Lint with Biome
```
