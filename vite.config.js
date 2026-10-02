import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    // In development the API runs separately (npm run dev starts both); forward /api to it on PORT.
    server: { proxy: { '/api': { target: `http://localhost:${env.PORT || 4000}`, changeOrigin: false } } },
  }
})
