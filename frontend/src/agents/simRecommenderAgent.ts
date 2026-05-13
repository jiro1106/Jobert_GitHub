import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";

export type SimRecommendationOutput = {
  recommended_provider: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  caveats: string[];
};

export class SimRecommenderAgent {
  constructor(private lfm: LFMClient) {}

  async run(analysisResult: any): Promise<SimRecommendationOutput> {
    const fallback: SimRecommendationOutput = {
      recommended_provider: analysisResult?.best_provider || "Unknown",
      summary:
        analysisResult?.recommendation_text ||
        "No provider recommendation is available.",
      confidence:
        analysisResult?.weak_segments?.length > 0
          ? "medium"
          : analysisResult?.best_provider
            ? "high"
            : "low",
      caveats: analysisResult?.offline_readiness_alerts || [],
    };

    try {
      return await this.lfm.generateJson<SimRecommendationOutput>(
        buildJsonAgentPrompt({
          agentName: "Sim Recommender Agent",
          task:
            "Recommend the best provider based on provider_scores, weak segments, and report summary.",
          input: {
            best_provider: analysisResult?.best_provider,
            provider_scores: analysisResult?.provider_scores,
            weak_segments: analysisResult?.weak_segments,
            nearby_reports_summary: analysisResult?.nearby_reports_summary,
            recommendation_text: analysisResult?.recommendation_text,
          },
          outputShape: fallback,
        }),
        512
      );
    } catch {
      return fallback;
    }
  }
}