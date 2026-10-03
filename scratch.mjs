import { pipeline, env } from "@huggingface/transformers";
import sharp from "sharp";

env.allowLocalModels = true;
env.useFSCache = false;
env.allowRemoteModels = true;

async function run() {
  const pipe = await pipeline("background-removal", "Xenova/modnet");
  
  // Create a simple red 64x64 PNG buffer
  const buf = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 255, g: 0, b: 0 } }
  }).png().toBuffer();
  
  const blob = new Blob([buf], { type: "image/png" });
  const res = await pipe(blob);
  
  const img = Array.isArray(res) ? res[0] : res;
  console.log("Width:", img.width, "Height:", img.height, "Channels:", img.channels, "Data length:", img.data.length);
}
run().catch(console.error);
