import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

// The preview hostname changes per VM, so it is supplied at runtime
// instead of being committed here.
const allowedHosts = process.env.VITE_ALLOWED_HOST ? [process.env.VITE_ALLOWED_HOST] : []

// Public path the site is served from. CI sets this for GitHub Pages
// (e.g. "/thinkwell-ai/"); locally and on root-hosted domains it stays "/".
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts,
  },
})
