import "server-only";

import type { RasterOptions, RasterResult } from "./types";
import { rasterToSvg } from "./raster-to-svg";

interface QueueConfig {
  enabled: boolean;
}

let cachedConfig: QueueConfig | undefined;

function getConfig(): QueueConfig {
  cachedConfig ??= {
    enabled: process.env.ENABLE_RASTER_QUEUE === "true" && !!process.env.REDIS_URL,
  };
  return cachedConfig;
}

export function rasterQueueEnabled(): boolean {
  return getConfig().enabled;
}

let lazyQueue: import("bullmq").Queue | null = null;
let lazyQueueEvents: import("bullmq").QueueEvents | null = null;

async function getQueue(): Promise<import("bullmq").Queue> {
  if (!lazyQueue) {
    const { Queue } = await import("bullmq");
    lazyQueue = new Queue("raster-vectorizations", {
      connection: { url: process.env.REDIS_URL! },
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return lazyQueue;
}

async function getQueueEvents(): Promise<import("bullmq").QueueEvents> {
  if (!lazyQueueEvents) {
    const { QueueEvents } = await import("bullmq");
    lazyQueueEvents = new QueueEvents("raster-vectorizations", {
      connection: { url: process.env.REDIS_URL! },
    });
  }
  return lazyQueueEvents;
}

export async function rasterToSvgQueued(
  buffer: Buffer,
  options: RasterOptions,
): Promise<RasterResult> {
  if (!rasterQueueEnabled()) {
    return rasterToSvg(buffer, options, { isQueued: false });
  }

  const queue = await getQueue();
  const job = await queue.add(
    "vectorize",
    { buffer, options },
    {
      attempts: 1,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
  return job.waitUntilFinished(await getQueueEvents(), 120_000) as Promise<RasterResult>;
}
