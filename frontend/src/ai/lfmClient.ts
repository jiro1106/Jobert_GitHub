// src/ai/lfmClient.ts

export function extractJson(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in model output.");
  }

  const jsonText = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

// Placeholder interface so your orchestrator is ready.
// Replace generate() internals with your wllama call.
export class LFMClient {
  private loaded = false;

  async load() {
    if (this.loaded) return;

    // TODO:
    // Load LFM2.5-350M GGUF using wllama.
    // Start with Q4/Q5 GGUF if available for browser performance.
    this.loaded = true;
  }

  async generate(prompt: string): Promise<string> {
    await this.load();

    // TODO:
    // Replace this with actual wllama completion.
    throw new Error("LFM generate() not implemented yet.");
  }

  async generateJson(prompt: string) {
    const text = await this.generate(prompt);
    return extractJson(text);
  }
}