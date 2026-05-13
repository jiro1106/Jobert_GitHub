import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";

export type AnomalyOutput = {
  anomaly_status: "none" | "logged" | "possible";
  explanation: string;
};

export class AnomalyAgent {
  constructor(private lfm: LFMClient) {}

  async run(analysisResult: any): Promise<AnomalyOutput> {
    const fallback: AnomalyOutput = {
      anomaly_status: analysisResult?.anomaly_logged ? "logged" : "none",
      explanation: analysisResult?.anomaly_logged
        ? "An anomaly was logged by the backend."
        : "No anomaly was logged for this analysis.",
    };

    try {
      return await this.lfm.generateJson<AnomalyOutput>(
        buildJsonAgentPrompt({
          agentName: "Anomaly Agent",
          task:
            "Explain whether the result was anomalous, suspicious, low-confidence, or clean.",
          input: {
            anomaly_logged: analysisResult?.anomaly_logged,
            provider_scores: analysisResult?.provider_scores,
            weak_segments: analysisResult?.weak_segments,
            nearby_reports_summary: analysisResult?.nearby_reports_summary,
            reports_considered: (analysisResult?.reports_considered || []).slice(
              0,
              10
            ),
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