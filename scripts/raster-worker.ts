import { Worker } from "bullmq";
import { rasterToSvg } from "../src/lib/raster/raster-to-svg";
import type { RasterOptions, RasterResult } from "../src/lib/raster/types";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error("REDIS_URL is required to run the raster worker.");
  process.exit(1);
}

const worker = new Worker<{ buffer: Buffer; options: RasterOptions }, RasterResult>(
  "raster-vectorizations",
  async (job) => {
    const { buffer, options } = job.data;
    return rasterToSvg(buffer, options, { isQueued: true });
  },
  { connection: { url: REDIS_URL }, concurrency: 2 },
);

worker.on("completed", (job) => {
  console.log(`raster job ${job.id} completed (${job.returnvalue?.size ?? 0} bytes)`);
});
worker.on("failed", (job, err) => {
  console.error(`raster job ${job?.id} failed:`, err?.message ?? err);
});

console.log("raster-worker listening on queue 'raster-vectorizations'");
