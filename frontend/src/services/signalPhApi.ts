function getEnvValue(key: string, fallback: string): string {
  const viteEnv = (import.meta as any).env;
  const nodeEnv = (globalThis as any).process?.env;

  return viteEnv?.[key] || nodeEnv?.[key] || fallback;
}

const API_BASE_URL = getEnvValue(
  "VITE_SIGNALPH_API_BASE_URL",
  "http://127.0.0.1:8000",
).replace(/\/$/, "");

export async function callMcpTool(name: string, args: Record<string, unknown>) {
  const url = `${API_BASE_URL}/mcp/tools/call`;

  console.log("[MCP request]", {
    url,
    name,
    arguments: args,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      arguments: args,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error("[MCP error]", {
      status: response.status,
      body: responseText,
      request: {
        name,
        arguments: args,
      },
    });

    throw new Error(`MCP tool call failed: ${response.status} ${responseText}`);
  }

  return JSON.parse(responseText);
}

export function getSignalPhApiBaseUrl() {
  return API_BASE_URL;
}
