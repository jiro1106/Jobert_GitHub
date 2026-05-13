const API_BASE_URL =
  import.meta.env.VITE_SIGNALPH_API_BASE_URL || "http://127.0.0.1:8000";

export async function callMcpTool(name: string, args: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}/mcp/tools/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      arguments: args,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MCP tool call failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}