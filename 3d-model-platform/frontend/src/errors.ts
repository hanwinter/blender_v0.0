export type ErrorCode = 'NETWORK_ERROR' | 'MODEL_NOT_FOUND' | 'MODEL_LOAD_ERROR'
  | 'METADATA_LOAD_ERROR' | 'INVALID_METADATA' | 'PART_ID_MISMATCH' | 'DUPLICATE_PART_ID'

export interface Diagnostic {
  code: ErrorCode
  message: string
  detail: string
}

export class ProjectError extends Error {
  constructor(public code: ErrorCode, message: string, public detail = '') {
    super(message)
    this.name = 'ProjectError'
  }

  toDiagnostic(): Diagnostic { return { code: this.code, message: this.message, detail: this.detail } }
}

export function asProjectError(error: unknown, code: ErrorCode, message: string): ProjectError {
  return error instanceof ProjectError ? error : new ProjectError(code, message, error instanceof Error ? error.message : String(error))
}
