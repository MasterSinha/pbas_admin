import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // loadEnv reads .env.local so VITE_BACKEND_URL is available here
  const env = loadEnv(mode, process.cwd(), '')

  const backendUrl =
    env.VITE_BACKEND_URL ||
    'https://faculty-appraisal-git-376777978967.asia-south1.run.app'

  return {
    plugins: [react()],

    base: env.VITE_APP_BASE_PATH || '/panel/',

    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: backendUrl.startsWith('https'),
        },
      },
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
