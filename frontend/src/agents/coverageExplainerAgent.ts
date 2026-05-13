import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";

export type CoverageExplanationOutput = {
  coverage_explanation: string;
  key_evidence: string[];
};

export class CoverageExplainerAgent {
  constructor(private lfm: LFMClient) {}

  async run(analysisResult: any): Promise<CoverageExplanationOutput> {
    const closestTowers = analysisResult?.closest_towers || [];

    const fallback: CoverageExplanationOutput = {
      coverage_explanation:
        analysisResult?.explanation_text ||
        "Coverage explanation is not available.",
      key_evidence: closestTowers.slice(0, 5).map((tower: any) => {
        return `${tower.provider_name} ${tower.radio} tower is ${tower.distance_meters}m away.`;
      }),
    };

    try {
      return await this.lfm.generateJson<CoverageExplanationOutput>(
        buildJsonAgentPrompt({
          agentName: "Coverage Explainer Agent",
          task:
            "Explain the signal coverage result using provider scores, closest towers, estimated range checks, weak segments, and reports.",
          input: {
            provider_scores: analysisResult?.provider_scores,
            closest_towers: closestTowers.slice(0, 20),
            weak_segments: analysisResult?.weak_segments,
            nearby_reports_summary: analysisResult?.nearby_reports_summary,
            explanation_text: analysisResult?.explanation_text,
          },
          outputShape: fallback,
        }),
        700
      );
    } catch {
      return fallback;
    }
  }
}