// src/ai/chatbotOrchestrator.ts

import { LFMClient } from "../ai/lfmClient";
import { buildRouterPrompt } from "../ai/prompts";

type ChatbotInput = {
  prompt: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  origin?: any;
  destination?: any;
  route_points?: any[];
  current_analysis_result?: any;
};

async function callBackendTool(name: string, argumentsPayload: any) {
  const response = await fetch("http://127.0.0.1:8000/mcp/tools/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      arguments: argumentsPayload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tool call failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

function buildFinalAnswer(input: {
  prompt: string;
  plan: any;
  toolResults: any[];
  currentAnalysisResult?: any;
}) {
  const mainToolResult = input.toolResults[0]?.data;
  const analysis = mainToolResult || input.currentAnalysisResult;

  if (!analysis) {
    return {
      intent: input.plan.intent,
      answer: "I need a selected point, route, or existing analysis result before I can answer that.",
      recommended_provider: "Unknown",
      confidence: "low",
      analysis_result: null,
      map_layers: null,
      tool_calls: input.toolResults.map((result) => ({
        name: result.tool,
        status: result.status,
      })),
      warnings: input.plan.missing_inputs || [],
    };
  }

  const bestProvider = analysis.best_provider || "Unknown";

  return {
    intent: input.plan.intent,
    answer:
      analysis.recommendation_text ||
      `${bestProvider} is recommended based on the current SignalPH analysis.`,
    recommended_provider: bestProvider,
    confidence:
      analysis.weak_segments?.length > 0
        ? "medium"
        : bestProvider === "Unknown"
          ? "low"
          : "high",
    analysis_result: analysis,
    map_layers: analysis.map_layers || null,
    tool_calls: input.toolResults.map((result) => ({
      name: result.tool,
      status: result.status,
    })),
    warnings: analysis.offline_readiness_alerts || [],
  };
}

export class ChatbotOrchestrator {
  private lfm = new LFMClient();

  async answer(input: ChatbotInput) {
    const routerPrompt = buildRouterPrompt(input);
    const plan = await this.lfm.generateJson(routerPrompt);

    if (plan.missing_inputs?.length > 0) {
      return {
        intent: plan.intent,
        answer: `Missing required input: ${plan.missing_inputs.join(", ")}`,
        recommended_provider: "Unknown",
        confidence: "low",
        analysis_result: null,
        map_layers: null,
        tool_calls: [],
        warnings: plan.missing_inputs,
      };
    }

    if (plan.intent === "explain_current_result") {
      return buildFinalAnswer({
        prompt: input.prompt,
        plan,
        toolResults: [],
        currentAnalysisResult: input.current_analysis_result,
      });
    }

    const toolResults = [];

    for (const toolCall of plan.tool_calls || []) {
      const result = await callBackendTool(toolCall.name, toolCall.arguments);
      toolResults.push(result);
    }

    return buildFinalAnswer({
      prompt: input.prompt,
      plan,
      toolResults,
      currentAnalysisResult: input.current_analysis_result,
    });
  }
}