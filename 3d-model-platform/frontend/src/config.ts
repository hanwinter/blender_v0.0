export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL === 'interaction-test' ? 'interaction-test' : 'demo',
  debug: import.meta.env.VITE_VIEWER_DEBUG === 'true',
  allowDebug: import.meta.env.DEV || import.meta.env.VITE_VIEWER_DEBUG === 'true',
} as const

export const modelOptions = [
  { source: 'demo', id: 'demo_cube', label: 'Cube' },
  { source: 'interaction-test', id: 'interaction_test', label: '交互测试模型' },
] as const
