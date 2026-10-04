import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    // Split the big, rarely-changing libraries into their own cacheable chunks.
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
            if (/[\\/]node_modules[\\/](gsap|@gsap|lenis)[\\/]/.test(id)) return 'gsap'
            return undefined
          },
        },
      },
    },
    // In development the API runs separately (npm run dev starts both); forward /api to it on PORT.
    server: { proxy: { '/api': { target: `http://localhost:${env.PORT || 4000}`, changeOrigin: false } } },
  }
})
