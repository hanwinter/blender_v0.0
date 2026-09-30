import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const root = resolve(process.cwd(), '..')
  const env = { ...loadEnv(mode, root, ''), ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const frontendPort = Number(env.FRONTEND_PORT || 5174)
  const backendPort = Number(env.BACKEND_PORT || 8000)
  if (![frontendPort, backendPort].every((port) => Number.isInteger(port) && port > 0 && port < 65536)) {
    throw new Error('FRONTEND_PORT and BACKEND_PORT must be valid TCP ports')
  }
  if (env.VITE_DEFAULT_MODEL && !['demo', 'interaction-test'].includes(env.VITE_DEFAULT_MODEL)) {
    throw new Error('VITE_DEFAULT_MODEL must be demo or interaction-test')
  }
  if (env.VITE_VIEWER_DEBUG && !['true', 'false'].includes(env.VITE_VIEWER_DEBUG)) {
    throw new Error('VITE_VIEWER_DEBUG must be true or false')
  }
  return {
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
      'import.meta.env.VITE_DEFAULT_MODEL': JSON.stringify(env.VITE_DEFAULT_MODEL || 'demo'),
      'import.meta.env.VITE_VIEWER_DEBUG': JSON.stringify(env.VITE_VIEWER_DEBUG || 'false'),
    },
    server: {
      host: '127.0.0.1', port: frontendPort, strictPort: true,
      proxy: { '/api': { target: env.API_PROXY_TARGET || `http://127.0.0.1:${backendPort}` } },
    },
  }
})
