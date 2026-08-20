export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
  })
  if (level === 'error') {
    console.error(entry)
  } else if (level === 'warn') {
    console.warn(entry)
  } else {
    console.log(entry)
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write('debug', message, fields),
  info: (message: string, fields?: LogFields) => write('info', message, fields),
  warn: (message: string, fields?: LogFields) => write('warn', message, fields),
  error: (message: string, fields?: LogFields) => write('error', message, fields),
}

export function getRequestId(request: import('next/server').NextRequest): string {
  const existing = request.headers.get('x-request-id')
  if (existing) return existing
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}