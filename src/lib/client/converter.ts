import { apiBlob, apiFetch } from '@/lib/client/http'

export interface ConvertRequest {
  width?: number
  height?: number
  scale?: number
  transparent?: boolean
  quality?: number
}

export interface ConvertResponse {
  data?: string
  mimeType?: string
  size?: number
  format: string
  width?: number
  height?: number
  warnings?: string[]
  conversionsUsed: number
  remaining?: number
}

const CONVERT_TIMEOUT_MS = 60_000

function convertBody(svg: string, options: ConvertRequest = {}) {
  return JSON.stringify({
    svg,
    scale: 2,
    transparent: true,
    ...options,
  })
}

export async function convertText(svg: string, options: ConvertRequest = {}): Promise<ConvertResponse> {
  return apiFetch<ConvertResponse>('/api/v1/convert', {
    method: 'POST',
    body: convertBody(svg, options),
    signal: AbortSignal.timeout(CONVERT_TIMEOUT_MS),
  })
}

export async function downloadConverted(
  svg: string,
  options: ConvertRequest = {}
): Promise<Blob> {
  return apiBlob('/api/v1/convert?download=1', {
    method: 'POST',
    body: convertBody(svg, options),
    signal: AbortSignal.timeout(CONVERT_TIMEOUT_MS),
  })
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}