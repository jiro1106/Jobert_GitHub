export type RuntimeMode = "local_server" | "browser_webgpu" | "browser_wasm" | "fallback";

export async function detectRuntimeMode(): Promise<RuntimeMode> {
  // For now, we are using llama-cpp-python server on 8020.
  // Later, replace this with wllama/WebGPU detection.
  return "local_server";
}

export async function canUseWebGPU(): Promise<boolean> {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}