import { Worker } from 'bullmq'

import { convertSvg } from '../src/lib/svg/svg-convert'

try {
  process.loadEnvFile('.env.local')
} catch {
  try {
    process.loadEnvFile('.env')
  } catch {
    // no env file found; rely on process env
  }
}

if (!process.env.REDIS_URL) {
  console.error('REDIS_URL is required to run the conversion worker.')
  process.exit(1)
}

const worker = new Worker(
  'svg-conversions',
  async (job) => {
    const { svg, options } = job.data as {
      svg: string
      options: Parameters<typeof convertSvg>[1]
    }
    const started = Date.now()
    const result = await convertSvg(svg, options)
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        msg: 'conversion_completed',
        jobId: job.id,
        width: result.width,
        height: result.height,
        bytes: result.buffer.length,
        durationMs: Date.now() - started,
      })
    )
    return { width: result.width, height: result.height }
  },
  { connection: { url: process.env.REDIS_URL } }
)

worker.on('failed', (job, err) => {
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'error',
      msg: 'conversion_failed',
      jobId: job?.id,
      error: err.message,
    })
  )
})

console.log('[crushsvg] Conversion worker started on queue "svg-conversions"')
