import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'classic'
  })],
  root: 'frontend',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
