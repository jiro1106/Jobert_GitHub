export function extractJsonText(rawText: string): string {
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(`No JSON object found in model output: ${rawText}`);
  }

  return rawText.slice(firstBrace, lastBrace + 1);
}

export function parseModelJson<T = unknown>(rawText: string): T {
  const jsonText = extractJsonText(rawText);
  return JSON.parse(jsonText) as T;
}

export function safeParseModelJson<T = unknown>(
  rawText: string,
  fallback: T
): T {
  try {
    return parseModelJson<T>(rawText);
  } catch {
    return fallback;
  }
}