import { Wllama } from "@wllama/wllama";
import { parseModelJson } from "./jsonUtils";

type LFMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getEnvValue(key: string, fallback: string): string {
  const viteEnv = (import.meta as any).env;
  const nodeEnv = (globalThis as any).process?.env;

  return viteEnv?.[key] || nodeEnv?.[key] || fallback;
}

export class LFMClient {
  private mode: string;
  private baseUrl: string;
  private modelName: string;
  private modelUrl: string;

  private wllama: Wllama | null = null;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.mode = getEnvValue("VITE_LFM_MODE", "browser");
    this.baseUrl = getEnvValue("VITE_LFM_BASE_URL", "http://127.0.0.1:8020/v1");
    this.modelName = getEnvValue("VITE_LFM_MODEL_NAME", "local-lfm");
    const rawModelUrl = getEnvValue(
  "VITE_LFM_MODEL_URL",
  "/model/LFM2.5-350M.i1-Q6_K.gguf"
);

this.modelUrl = new URL(rawModelUrl, window.location.origin).toString();
  }

  async load(): Promise<void> {
    if (this.mode !== "browser") return;
    if (this.wllama) return;

    if (!this.loadingPromise) {
      this.loadingPromise = this.loadBrowserModel();
    }

    return this.loadingPromise;
  }

  private async loadBrowserModel(): Promise<void> {
    console.log("[LFM] loading browser-local GGUF model:", this.modelUrl);

    const WLLAMA_CONFIG_PATHS = {
  default: "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.1.1/esm/wasm/wllama.wasm",
};

this.wllama = new Wllama(WLLAMA_CONFIG_PATHS, {
      logger: {
        debug: () => {},
        log: (...args: unknown[]) => console.log("[wllama]", ...args),
        warn: (...args: unknown[]) => console.warn("[wllama]", ...args),
        error: (...args: unknown[]) => console.error("[wllama]", ...args),
      },
    });

    await this.wllama.loadModelFromUrl(this.modelUrl, {
  n_ctx: 2048,
  n_batch: 128,
  n_threads: 1,

  // Disable GPU first. WebGPU auto-offload can crash on some laptops/VRAM limits.
  // Once stable, try 4, 8, etc.
  n_gpu_layers: 0,

  progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
    const pct = total ? Math.round((loaded / total) * 100) : 0;
    console.log(`[LFM] model loading ${pct}%`);
  },
} as any);

    console.log("[LFM] browser-local model loaded.");
  }

  async chat(messages: LFMMessage[], maxTokens = 512): Promise<string> {
    if (this.mode === "browser") {
      await this.load();

      if (!this.wllama) {
        throw new Error("Browser LFM runtime failed to initialize.");
      }

      const response = await this.wllama.createChatCompletion({
        messages,
        temperature: 0.0,
        max_tokens: maxTokens,
      } as any);

      return response.choices?.[0]?.message?.content ?? "";
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: 0.0,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LFM request failed: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content ?? "";
  }

  async generateJson<T>(prompt: string, maxTokens = 512): Promise<T> {
    const content = await this.chat(
      [
        {
          role: "system",
          content:
            "You are a JSON-only assistant. Return only raw JSON. Do not use markdown or code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens
    );

    return parseModelJson<T>(content);
  }
}