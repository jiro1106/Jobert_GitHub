import { parseModelJson } from "./jsonUtils";

type LFMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class LFMClient {
  private baseUrl: string;
  private modelName: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_LFM_BASE_URL || "http://127.0.0.1:8020/v1";
    this.modelName = import.meta.env.VITE_LFM_MODEL_NAME || "local-lfm";
  }

  async chat(messages: LFMMessage[], maxTokens = 512): Promise<string> {
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
            "You are a JSON-only assistant. Return only raw JSON. Do not use markdown.",
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