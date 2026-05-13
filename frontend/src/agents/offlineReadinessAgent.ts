import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";

export type OfflineReadinessOutput = {
  offline_alerts: string[];
  summary: string;
};

export class OfflineReadinessAgent {
  constructor(private lfm: LFMClient) {}

  async run(analysisResult: any): Promise<OfflineReadinessOutput> {
    const alerts = analysisResult?.offline_readiness_alerts || [];

    const fallback: OfflineReadinessOutput = {
      offline_alerts: alerts,
      summary:
        alerts.length > 0
          ? "Offline preparation is recommended for this route or location."
          : "No special offline preparation is required based on this analysis.",
    };

    try {
      return await this.lfm.generateJson<OfflineReadinessOutput>(
        buildJsonAgentPrompt({
          agentName: "Offline Readiness Agent",
          task:
            "Generate concise offline readiness advice based on weak segments and provider reliability.",
          input: {
            weak_segments: analysisResult?.weak_segments,
            provider_scores: analysisResult?.provider_scores,
            offline_readiness_alerts: alerts,
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