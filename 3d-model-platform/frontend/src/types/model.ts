export interface ModelInfo {
  id: string
  name: string
  description: string
}

export interface ModelSummary extends ModelInfo {
  version: string
  model_url: string | null
  part_count: number
}

export interface ModelDetail extends ModelSummary {
  parts: ModelInfo[]
}

export type ViewMode = 'perspective' | 'front' | 'top' | 'right'
