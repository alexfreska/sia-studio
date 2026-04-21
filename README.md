# Sia Studio

A bring-your-own-key AI image generator, built entirely in the browser on [Sia](https://sia.tech). Paste an OpenAI / Google / fal.ai / Replicate key, type a prompt, get back an image. Every image and every thread is stored as an encrypted object on Sia — no backend, no database, no vendor lock-in.

This is a demo app. It started life as [create-sia-app](https://www.npmjs.com/package/create-sia-app) and grew from there. If you want to build your own Sia-backed app, start from the scaffold — not from this repo.

```bash
bunx create-sia-app
```

Read about it here: [https://parox.sh/building-a-private-image-generator-on-sia](https://parox.sh/building-a-private-image-generator-on-sia).

## What it shows

- **Direct provider → Sia pipeline.** Browser calls the AI provider's API, receives bytes, uploads straight to Sia. No server in the middle.
- **Metadata as the product.** Every generated image carries the prompt, model, `threadId`, and optional `parentImageId` in its Sia object metadata. The whole UI — threads, follow-ups, history — is derived from `sdk.objectEvents()`.
- **Multi-device sync.** A persisted `updatedAt` watermark drives incremental polling. Generate on laptop, open on phone, your work is there.
- **BYOK keys, one-way.** Provider API keys live in `localStorage`, never touch Sia, never leave the browser. Once saved they're unreadable — only a masked suffix and a Remove button.

## Run locally

```bash
bun install
bun dev
```

Open [http://localhost:5173](http://localhost:5173). You'll go through the Sia auth flow (connect, approve, recovery phrase), then the BYOK onboarding screen for provider keys, then the generation UI.

## Where to look

- `src/stores/generation.ts` — the full generate → Sia upload pipeline.
- `src/stores/gallery.ts` — object-events sync with cursor-based polling.
- `src/lib/providers/` — unified adapter over OpenAI, Google, fal.ai, Replicate via Vercel AI SDK.
- `src/types/image.ts` — the `ImageMetadata` / `ThreadMetadata` schema persisted to Sia.
- `CLAUDE.md` / `AGENTS.md` — guide for AI assistants working in this repo.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, Biome, [`@siafoundation/sia-storage`](https://www.npmjs.com/package/@siafoundation/sia-storage), [Vercel AI SDK](https://ai-sdk.dev).

## Build your own

For a clean starting point — not this app's UI, just the Sia auth + upload primitives — use [create-sia-app](https://www.npmjs.com/package/create-sia-app). The template includes an `AGENTS.md` so any AI assistant you point at it already understands how to build with the Sia SDK.
