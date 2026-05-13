export type ProcessingMode = "sequential" | "parallel";

export async function chooseProcessingMode(): Promise<ProcessingMode> {
  // Browser VRAM is not directly available.
  // Start sequential for reliability.
  const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;

  if (!hasWebGPU) {
    return "sequential";
  }

  // Keep sequential for now even with WebGPU.
  // Parallel LLM calls can cause browser memory problems.
  return "sequential";
}