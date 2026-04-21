import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sia-storage loads its WASM via `new URL(..., import.meta.url)`; excluding
  // it from the deps pre-bundler keeps that URL pointing at the real file.
  optimizeDeps: { exclude: ['@siafoundation/sia-storage'] },
  server: {
    fs: {
      allow: ['..', '/Users/alexfreska/projects/foundation/sia-storage-js'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ai-sdk-core': ['ai'],
          'ai-openai': ['@ai-sdk/openai'],
          'ai-google': ['@ai-sdk/google'],
          'ai-fal': ['@ai-sdk/fal'],
          'ai-replicate': ['@ai-sdk/replicate'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
