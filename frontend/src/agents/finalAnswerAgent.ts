import { LFMClient } from "../ai/lfmClient";
import { buildFinalAnswerPrompt } from "../ai/prompts";
import type {
  FinalChatbotResponse,
  RouterPlan,
  ToolExecutionResult,
} from "../orchestration/a2aMessages";

function compactAnalysisResult(analysisResult: any | null) {
  if (!analysisResult) return null;

  const weakSegments = Array.isArray(analysisResult.weak_segments)
    ? analysisResult.weak_segments
    : [];

  const closestTowers = Array.isArray(analysisResult.closest_towers)
    ? analysisResult.closest_towers
    : [];

  return {
    best_provider: analysisResult.best_provider,
    provider_scores: analysisResult.provider_scores,
    weak_segment_count: weakSegments.length,
    sample_weak_segments: weakSegments.slice(0, 5),
    closest_tower_count: closestTowers.length,
    nearby_reports_summary: analysisResult.nearby_reports_summary,
    recommendation_text: analysisResult.recommendation_text,
    explanation_text: analysisResult.explanation_text,
    offline_readiness_alerts: analysisResult.offline_readiness_alerts,
    analysis_type: analysisResult.analysis_type,
    route_context: analysisResult.route_context,
    anomaly_logged: analysisResult.anomaly_logged,
  };
}

function compactToolResults(toolResults: ToolExecutionResult[]) {
  return toolResults.map((tool) => ({
    name: tool.name,
    status: tool.status,
    error: tool.error,
    has_data: Boolean(tool.data),
    best_provider: tool.data?.best_provider,
    weak_segment_count: Array.isArray(tool.data?.weak_segments)
      ? tool.data.weak_segments.length
      : 0,
  }));
}

function isBadModelAnswer(answer: unknown) {
  const cleaned = String(answer || "").trim().toLowerCase();

  return [
    "",
    "short useful answer",
    "short useful answer for the user",
    "short useful answer.",
    "short useful answer for the user.",
  ].includes(cleaned);
}

function buildFallbackAnswer(params: {
  plan: RouterPlan;
  compactAnalysis: ReturnType<typeof compactAnalysisResult>;
}) {
  const { plan, compactAnalysis } = params;

  if (plan.intent === "unclear") {
    return "Ask me about signal coverage, SIM recommendations, a place, or a route.";
  }

  if (!compactAnalysis) {
    return "I could not find enough analysis data for that request. Try selecting a route or asking about a specific place.";
  }

  if (compactAnalysis.recommendation_text) {
    return compactAnalysis.recommendation_text;
  }

  if (compactAnalysis.explanation_text) {
    return compactAnalysis.explanation_text;
  }

  const bestProvider = compactAnalysis.best_provider || "Unknown";
  const score =
    compactAnalysis.provider_scores?.[bestProvider]?.score ??
    compactAnalysis.provider_scores?.[bestProvider]?.final_score ??
    null;

  if (bestProvider !== "Unknown" && score !== null && score !== undefined) {
    return `${bestProvider} is the recommended provider based on the current signal analysis, with an estimated score of ${Math.round(Number(score))}/100.`;
  }

  if (bestProvider !== "Unknown") {
    return `${bestProvider} is the recommended provider based on the current signal analysis.`;
  }

  return "I could not generate a clear recommendation from the current analysis.";
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "medium";
}

export class FinalAnswerAgent {
  constructor(private lfm: LFMClient) {}

  async run(params: {
    traceId: string;
    userPrompt: string;
    plan: RouterPlan;
    analysisResult: any | null;
    toolResults: ToolExecutionResult[];
  }): Promise<FinalChatbotResponse> {
    const compactAnalysis = compactAnalysisResult(params.analysisResult);
    const compactTools = compactToolResults(params.toolResults);

    const bestProvider = compactAnalysis?.best_provider || "Unknown";

    const fallback: FinalChatbotResponse = {
      intent: params.plan.intent,
      answer: buildFallbackAnswer({
        plan: params.plan,
        compactAnalysis,
      }),
      recommended_provider: bestProvider,
      confidence:
        compactAnalysis?.weak_segment_count && compactAnalysis.weak_segment_count > 0
          ? "medium"
          : bestProvider === "Unknown"
            ? "low"
            : "high",
      analysis_result: params.analysisResult,
      tool_calls: params.toolResults.map((tool) => ({
        name: tool.name,
        status: tool.status,
      })),
      warnings: compactAnalysis?.offline_readiness_alerts || [],
      trace_id: params.traceId,
    };

    try {
      const final = await this.lfm.generateJson<{
        intent: string;
        answer: string;
        recommended_provider: string;
        confidence: "low" | "medium" | "high";
        warnings: string[];
        tool_summary: string;
      }>(
        buildFinalAnswerPrompt({
          userPrompt: params.userPrompt,
          plan: params.plan,
          analysisResult: compactAnalysis,
          toolResults: compactTools,
        }),
        384,
      );

      if (isBadModelAnswer(final.answer)) {
        return fallback;
      }

      return {
        ...fallback,
        intent: final.intent || fallback.intent,
        answer: String(final.answer).trim() || fallback.answer,
        recommended_provider:
          final.recommended_provider || fallback.recommended_provider,
        confidence: normalizeConfidence(final.confidence || fallback.confidence),
        warnings: Array.isArray(final.warnings)
          ? final.warnings
          : fallback.warnings,
      };
    } catch (error) {
      console.warn("[FinalAnswerAgent] using fallback:", error);
      return fallback;
    }
  }
}