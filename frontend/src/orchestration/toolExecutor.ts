import { callMcpTool } from "../services/signalPhApi";
import type { ToolCall, ToolExecutionResult } from "./a2aMessages";
import { ALLOWED_TOOL_NAMES } from "../ai/toolSchemas";

export async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<ToolExecutionResult[]> {
  const results: ToolExecutionResult[] = [];

  for (const toolCall of toolCalls) {
    try {
      if (!ALLOWED_TOOL_NAMES.includes(toolCall.name as any)) {
        throw new Error(`Tool is not allowed: ${toolCall.name}`);
      }

      const response = await callMcpTool(toolCall.name, toolCall.arguments);

      results.push({
        name: toolCall.name,
        status: "success",
        data: response.data,
      });
    } catch (error) {
      results.push({
        name: toolCall.name,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}