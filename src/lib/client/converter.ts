import { apiBlob, apiFetch } from '@/lib/client/http'

export type ConvertFormat = 'png' | 'jpeg' | 'webp'

export interface ConvertRequest {
  format?: ConvertFormat
  width?: number
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
  conversionsUsed: number
  remaining?: number
}

function convertBody(svg: string, options: ConvertRequest = {}) {
  return JSON.stringify({
    svg,
    format: 'png',
    scale: 2,
    transparent: true,
    ...options,
  })
}

export async function convertText(svg: string, options: ConvertRequest = {}): Promise<ConvertResponse> {
  return apiFetch<ConvertResponse>('/api/v1/convert', {
    method: 'POST',
    body: convertBody(svg, options),
  })
}

export async function downloadConverted(
  svg: string,
  options: ConvertRequest = {}
): Promise<Blob> {
  return apiBlob('/api/v1/convert?download=1', {
    method: 'POST',
    body: convertBody(svg, options),
  })
}

export function parseSvgDimensions(svg: string): { width?: number; height?: number } {
  const widthMatch = svg.match(/width\s*=\s*["']?([\d.]+)["']?/i)
  const heightMatch = svg.match(/height\s*=\s*["']?([\d.]+)["']?/i)

  if (widthMatch && heightMatch) {
    return {
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    }
  }

  const viewBoxMatch = svg.match(
    /viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']?/i
  )
  if (viewBoxMatch) {
    return {
      width: parseFloat(viewBoxMatch[1]),
      height: parseFloat(viewBoxMatch[2]),
    }
  }

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : undefined,
    height: heightMatch ? parseFloat(heightMatch[1]) : undefined,
  }
}

export function svgToObjectUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
