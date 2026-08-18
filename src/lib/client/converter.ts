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
  // First try to find a viewBox, as it's the most reliable source for the aspect ratio and source size
  const viewBoxMatch = svg.match(/viewBox\s*=\s*["']?\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*["']?/i);
  let vbWidth, vbHeight;
  if (viewBoxMatch) {
    vbWidth = parseFloat(viewBoxMatch[3]);
    vbHeight = parseFloat(viewBoxMatch[4]);
  }

  // Then try to find width and height, but ignore percentages
  const widthMatch = svg.match(/<svg[^>]*\bwidth\s*=\s*["']?([\d.]+)(px)?["']?/i);
  const heightMatch = svg.match(/<svg[^>]*\bheight\s*=\s*["']?([\d.]+)(px)?["']?/i);

  const w = widthMatch ? parseFloat(widthMatch[1]) : vbWidth;
  const h = heightMatch ? parseFloat(heightMatch[1]) : vbHeight;

  if (w && h) {
    return { width: w, height: h };
  }

  return { width: vbWidth, height: vbHeight };
}

export function svgToObjectUrl(svg: string): string {
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
