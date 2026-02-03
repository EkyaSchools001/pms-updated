import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `global` (window.global). Defaults to true.
      global: true,
      // Whether to polyfill `process`. Defaults to true.
      process: true,
      // Whether to polyfill `Buffer`. Defaults to true.
      protocolImports: true,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
