import { writeFileSync, existsSync } from "fs";
import { join } from "path";

const cwd = process.cwd();
const base =
  "node_modules/@huggingface/transformers/node_modules/onnxruntime-node/dist";

// 1. Stub binding.js so require("onnxruntime-node") doesn't crash
const bindingPath = join(cwd, base, "binding.js");
if (existsSync(bindingPath)) {
  writeFileSync(
    bindingPath,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOrt = exports.binding = void 0;
exports.binding = {
  InferenceSession: class InferenceSession {
    constructor() {
      throw new Error("onnxruntime-node native binding stubbed");
    }
  },
  listSupportedBackends: () => ["wasm", "webgpu", "cpu"],
};
exports.initOrt = () => {};
`
  );
  console.log("[patch-onnx] Stubbed binding.js");
} else {
  console.log("[patch-onnx] binding.js not found, skipping");
}

// 2. Replace index.js to use WASM backend instead of native
const indexPath = join(cwd, base, "index.js");
if (existsSync(indexPath)) {
  writeFileSync(
    indexPath,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSupportedBackends = void 0;

var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __exportStar =
  (this && this.__exportStar) ||
  function (m, exports) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
        __createBinding(exports, m, p);
  };

// Re-export onnxruntime-common (InferenceSession, Tensor, registerBackend, etc.)
__exportStar(require("onnxruntime-common"), exports);

const onnxruntime_common_1 = require("onnxruntime-common");
const version_1 = require("./version");

// WASM backend — delegates to onnxruntime-web instead of native binding
let _ort = null;
async function getWasmOrt() {
  if (!_ort) _ort = await import("onnxruntime-web");
  return _ort;
}

const wasmBackend = {
  async init() {
    await getWasmOrt();
  },
  async createInferenceSessionHandler(pathOrBuffer, options) {
    const ort = await getWasmOrt();
    let input;
    if (typeof pathOrBuffer === "string") {
      const resp = await globalThis.fetch(pathOrBuffer);
      input = new Uint8Array(await resp.arrayBuffer());
    } else if (pathOrBuffer instanceof Blob) {
      input = new Uint8Array(await pathOrBuffer.arrayBuffer());
    } else if (pathOrBuffer instanceof ArrayBuffer) {
      input = new Uint8Array(pathOrBuffer);
    } else {
      input =
        pathOrBuffer instanceof Uint8Array
          ? pathOrBuffer
          : new Uint8Array(
              pathOrBuffer.buffer,
              pathOrBuffer.byteOffset,
              pathOrBuffer.byteLength,
            );
    }
    return await ort.InferenceSession.create(input, options || {});
  },
};

exports.listSupportedBackends = () => ["wasm", "webgpu", "cpu"];

// Register WASM backend with onnxruntime-common
onnxruntime_common_1.registerBackend("wasm", wasmBackend, 10);
onnxruntime_common_1.registerBackend("webgpu", wasmBackend, 5);
onnxruntime_common_1.registerBackend("cpu", wasmBackend, 10);

Object.defineProperty(onnxruntime_common_1.env.versions, "node", {
  value: version_1.version,
  enumerable: true,
});
`
  );
  console.log("[patch-onnx] Replaced index.js with WASM shim");
} else {
  console.log("[patch-onnx] index.js not found, skipping");
}
