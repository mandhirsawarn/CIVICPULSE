import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { civicpulseApiPlugin } from './src/server/civicpulseApiPlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), civicpulseApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
})

