import type { ModelSource } from './models/types'

export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
  defaultModel: import.meta.env.VITE_DEFAULT_MODEL === 'interaction-test' ? 'interaction-test' : 'demo',
  debug: import.meta.env.VITE_VIEWER_DEBUG === 'true',
  allowDebug: import.meta.env.DEV || import.meta.env.VITE_VIEWER_DEBUG === 'true',
} as const

export const modelOptions = [
  { source: 'demo', id: 'demo_cube', label: 'Cube' },
  { source: 'interaction-test', id: 'interaction_test', label: '交互测试模型' },
  { source: 'bodyFemale-realistic', id: 'bodyFemale-realistic', label: '女性·写实', url: '/models/bodyFemale-realistic.glb' },
  { source: 'bodyFemale-stylized', id: 'bodyFemale-stylized', label: '女性·风格化', url: '/models/bodyFemale-stylized.glb' },
  { source: 'bodyMale-realistic', id: 'bodyMale-realistic', label: '男性·写实', url: '/models/bodyMale-realistic.glb' },
  { source: 'bodyMale-stylized', id: 'bodyMale-stylized', label: '男性·风格化', url: '/models/bodyMale-stylized.glb' },
] as const

export type ModelOptionKey = typeof modelOptions[number]['source']
export function getModelSource(key: ModelOptionKey): ModelSource {
  const option = modelOptions.find((item) => item.source === key)!
  return 'url' in option ? { type: 'glb', url: option.url } : { type: option.source }
}
