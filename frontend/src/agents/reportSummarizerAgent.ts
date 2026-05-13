import { LFMClient } from "../ai/lfmClient";
import { buildJsonAgentPrompt } from "../ai/prompts";

export type ReportSummaryOutput = {
  report_summary: string;
  total_reports: number;
  common_issue: string | null;
  most_reported_provider: string | null;
};

export class ReportSummarizerAgent {
  constructor(private lfm: LFMClient) {}

  async run(analysisResult: any): Promise<ReportSummaryOutput> {
    const summary = analysisResult?.nearby_reports_summary || {};

    const fallback: ReportSummaryOutput = {
      report_summary:
        summary.total_reports > 0
          ? `There are ${summary.total_reports} nearby crowdsourced reports.`
          : "There are no nearby crowdsourced reports.",
      total_reports: summary.total_reports || 0,
      common_issue: summary.common_issue || null,
      most_reported_provider: summary.most_reported_provider || null,
    };

    try {
      return await this.lfm.generateJson<ReportSummaryOutput>(
        buildJsonAgentPrompt({
          agentName: "Report Summarizer Agent",
          task:
            "Summarize nearby crowdsourced reports and explain whether they affect confidence.",
          input: {
            nearby_reports_summary: summary,
            reports_considered: (analysisResult?.reports_considered || []).slice(
              0,
              20
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