import type { Diagnostic } from '../errors'
import type { PartSelection } from '../models/types'
import type { ModelDetail, ModelInfo } from '../types/model'

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseMetadata(value: unknown): { model: ModelDetail | null; issues: Diagnostic[] } {
  const issues: Diagnostic[] = []
  const invalid = (detail: string) => issues.push({ code: 'INVALID_METADATA', message: '模型信息不完整。', detail })
  if (!record(value) || typeof value.id !== 'string' || !value.id.trim()) {
    invalid('Model ID is missing or invalid')
    return { model: null, issues }
  }
  const text = (data: Record<string, unknown>, field: string, label: string) => {
    const item = data[field]
    if (typeof item !== 'string' || !item.trim()) { invalid(`Missing ${field}: ${label}`); return '' }
    return item
  }
  const parts: ModelInfo[] = []
  if (!Array.isArray(value.parts)) invalid('Model parts must be an array')
  else for (const raw of value.parts) {
    if (!record(raw) || typeof raw.id !== 'string' || !raw.id.trim()) { invalid('Part ID is missing or invalid'); continue }
    parts.push({ id: raw.id, name: text(raw, 'name', raw.id), description: text(raw, 'description', raw.id) })
  }
  if (value.model_url !== null && typeof value.model_url !== 'string') invalid('Invalid model_url')
  if (!Number.isInteger(value.part_count) || value.part_count !== parts.length) invalid('part_count does not match metadata parts')
  const model: ModelDetail = {
    id: value.id, version: text(value, 'version', value.id),
    name: text(value, 'name', value.id), description: text(value, 'description', value.id),
    model_url: typeof value.model_url === 'string' ? value.model_url : null,
    part_count: parts.length, parts,
  }
  return { model, issues }
}

export function validatePartMetadata(parts: PartSelection[], metadata: ModelInfo[] | null): Diagnostic[] {
  const issues: Diagnostic[] = []
  const unique = (ids: string[], origin: string) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) issues.push({ code: 'DUPLICATE_PART_ID', message: '存在重复的部件标识。', detail: `Duplicate part ID (${origin}): ${id}` })
      seen.add(id)
    }
    return seen
  }
  const geometryIds = unique(parts.map((part) => part.id), 'geometry')
  if (!metadata) return issues
  const metadataIds = unique(metadata.map((part) => part.id), 'metadata')
  for (const id of geometryIds) if (!metadataIds.has(id)) {
    issues.push({ code: 'PART_ID_MISMATCH', message: '部分部件信息缺失。', detail: `Missing metadata: ${id}` })
  }
  for (const id of metadataIds) if (!geometryIds.has(id)) {
    issues.push({ code: 'PART_ID_MISMATCH', message: '部分信息未对应模型部件。', detail: `Metadata without geometry: ${id}` })
  }
  return issues
}
