import 'server-only'

import { convertSvg, type SvgConvertResult, type SvgConvertOptions } from '@/lib/svg-convert'

interface QueueConfig {
  enabled: boolean
}

let cachedConfig: QueueConfig | undefined

function getConfig(): QueueConfig {
  cachedConfig ??= {
    enabled:
      process.env.ENABLE_CONVERSION_QUEUE === 'true' && !!process.env.REDIS_URL,
  }
  return cachedConfig
}

export function conversionQueueEnabled(): boolean {
  return getConfig().enabled
}

let lazyQueue: import('bullmq').Queue | null = null
let lazyQueueEvents: import('bullmq').QueueEvents | null = null

async function getQueue(): Promise<import('bullmq').Queue> {
  if (!lazyQueue) {
    const { Queue } = await import('bullmq')
    lazyQueue = new Queue('svg-conversions', {
      connection: { url: process.env.REDIS_URL! },
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 500 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    })
  }
  return lazyQueue
}

async function getQueueEvents(): Promise<import('bullmq').QueueEvents> {
  if (!lazyQueueEvents) {
    const { QueueEvents } = await import('bullmq')
    lazyQueueEvents = new QueueEvents('svg-conversions', {
      connection: { url: process.env.REDIS_URL! },
    })
  }
  return lazyQueueEvents
}

export async function convertSvgQueued(
  svg: string,
  options: SvgConvertOptions
): Promise<SvgConvertResult> {
  if (!conversionQueueEnabled()) {
    return convertSvg(svg, options)
  }

  const queue = await getQueue()
  const job = await queue.add(
    'convert',
    { svg, options },
    {
      attempts: 2,
      backoff: { type: 'exponential', delay: 500 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    }
  )
  return job.waitUntilFinished(await getQueueEvents())
}