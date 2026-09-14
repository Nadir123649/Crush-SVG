import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const cwd = process.cwd();
const targets = [
  "node_modules/@huggingface/transformers/node_modules/onnxruntime-node/dist/binding.js",
];

let patched = 0;
for (const rel of targets) {
  const abs = join(cwd, rel);
  if (!existsSync(abs)) continue;
  writeFileSync(
    abs,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOrt = exports.binding = void 0;
exports.binding = {
  InferenceSession: class InferenceSession {
    constructor() {
      throw new Error("onnxruntime-node native binding stubbed — use WASM backend");
    }
  },
  listSupportedBackends: () => ["webgpu", "wasm", "cpu"],
};
exports.initOrt = () => {};
`
  );
  console.log(`[patch-onnx] Stubbed native binding: ${rel}`);
  patched++;
}
if (patched === 0) {
  console.log("[patch-onnx] No onnxruntime-node binding found to patch");
}
