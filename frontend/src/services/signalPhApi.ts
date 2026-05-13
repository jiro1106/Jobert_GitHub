const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8001/api";

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