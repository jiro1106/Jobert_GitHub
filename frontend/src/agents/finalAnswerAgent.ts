import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";
import type {
  AgentOutputs,
  FinalChatbotResponse,
  RouterPlan,
  ToolExecutionResult,
} from "../orchestration/a2aMessages";

export class FinalAnswerAgent {
  constructor(private lfm: LFMClient) {}

  async run(params: {
    traceId: string;
    plan: RouterPlan;
    analysisResult: any | null;
    agentOutputs: AgentOutputs;
    mapLayers: any | null;
    toolResults: ToolExecutionResult[];
  }): Promise<FinalChatbotResponse> {
    const bestProvider = params.analysisResult?.best_provider || "Unknown";

    const fallback: FinalChatbotResponse = {
      intent: params.plan.intent,
      answer:
        params.agentOutputs.sim_recommender?.summary ||
        params.analysisResult?.recommendation_text ||
        "I could not produce a final answer from the available analysis.",
      recommended_provider: bestProvider,
      confidence:
        params.analysisResult?.weak_segments?.length > 0
          ? "medium"
          : bestProvider === "Unknown"
            ? "low"
            : "high",
      analysis_result: params.analysisResult,
      agent_outputs: params.agentOutputs,
      map_layers: params.mapLayers,
      tool_calls: params.toolResults.map((tool) => ({
        name: tool.name,
        status: tool.status,
      })),
      warnings: params.analysisResult?.offline_readiness_alerts || [],
      trace_id: params.traceId,
    };

    try {
      return await this.lfm.generateJson<FinalChatbotResponse>(
        buildJsonAgentPrompt({
          agentName: "Final Answer Agent",
          task:
            "Combine the analysis result and specialist agent outputs into one definitive frontend-safe JSON response.",
          input: {
            plan: params.plan,
            analysis_result: params.analysisResult,
            agent_outputs: params.agentOutputs,
            map_layers: params.mapLayers,
            tool_results: params.toolResults.map((tool) => ({
              name: tool.name,
              status: tool.status,
              error: tool.error,
            })),
          },
          outputShape: fallback,
        }),
        900
      );
    } catch {
      return fallback;
    }
  }
}