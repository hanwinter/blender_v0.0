import { config } from '../config'
import { ProjectError } from '../errors'
import type { ErrorCode } from '../errors'

async function get(path: string, signal?: AbortSignal, failureCode: ErrorCode = 'METADATA_LOAD_ERROR'): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new ProjectError('NETWORK_ERROR', '无法连接服务。', cause instanceof Error ? cause.message : String(cause))
  }
  if (!response.ok) {
    if (response.status === 404 && path.startsWith('/models/')) {
      throw new ProjectError('MODEL_NOT_FOUND', '未找到模型。', `HTTP 404: ${path}`)
    }
    throw new ProjectError(failureCode, failureCode === 'NETWORK_ERROR' ? '服务暂不可用。' : '模型信息加载失败。', `HTTP ${response.status}: ${path}`)
  }
  try { return await response.json() as unknown }
  catch { throw new ProjectError('INVALID_METADATA', '模型信息格式错误。', `Invalid JSON: ${path}`) }
}

export const api = {
  health: (signal?: AbortSignal) => get('/health', signal, 'NETWORK_ERROR'),
  models: (signal?: AbortSignal) => get('/models', signal),
  model: (id: string, signal?: AbortSignal) => get(`/models/${encodeURIComponent(id)}`, signal),
}
