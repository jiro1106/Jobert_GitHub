import { LFMClient } from "../ai/lfmClient";
import { RouterAgent } from "../agents/routerAgent";
import { SimRecommenderAgent } from "../agents/simRecommenderAgent";
import { CoverageExplainerAgent } from "../agents/coverageExplainerAgent";
import { ReportSummarizerAgent } from "../agents/reportSummarizerAgent";
import { TowerMapperAgent } from "../agents/towerMapperAgent";
import { OfflineReadinessAgent } from "../agents/offlineReadinessAgent";
import { AnomalyAgent } from "../agents/anomalyAgent";
import { FinalAnswerAgent } from "../agents/finalAnswerAgent";
import { executeToolCalls } from "./toolExecutor";
import type {
  AgentOutputs,
  ChatbotInput,
  FinalChatbotResponse,
} from "./a2aMessages";

function createTraceId() {
  return crypto.randomUUID?.() || `trace-${Date.now()}`;
}

function getPrimaryAnalysisResult(toolResults: any[], input: ChatbotInput) {
  const successfulTool = toolResults.find((tool) => tool.status === "success");

  if (successfulTool?.data) {
    return successfulTool.data;
  }

  return input.current_analysis_result || null;
}

export class ChatbotOrchestrator {
  private lfm = new LFMClient();

  private routerAgent = new RouterAgent(this.lfm);
  private simRecommenderAgent = new SimRecommenderAgent(this.lfm);
  private coverageExplainerAgent = new CoverageExplainerAgent(this.lfm);
  private reportSummarizerAgent = new ReportSummarizerAgent(this.lfm);
  private towerMapperAgent = new TowerMapperAgent();
  private offlineReadinessAgent = new OfflineReadinessAgent(this.lfm);
  private anomalyAgent = new AnomalyAgent(this.lfm);
  private finalAnswerAgent = new FinalAnswerAgent(this.lfm);

  async answer(input: ChatbotInput): Promise<FinalChatbotResponse> {
    const traceId = createTraceId();

    const plan = await this.routerAgent.plan(input);

    if (plan.missing_inputs?.length > 0) {
      return {
        intent: plan.intent,
        answer: `Missing required input: ${plan.missing_inputs.join(", ")}`,
        recommended_provider: "Unknown",
        confidence: "low",
        analysis_result: null,
        agent_outputs: {},
        map_layers: null,
        tool_calls: [],
        warnings: plan.missing_inputs,
        trace_id: traceId,
      };
    }

    const toolResults =
      plan.tool_calls?.length > 0 ? await executeToolCalls(plan.tool_calls) : [];

    const analysisResult = getPrimaryAnalysisResult(toolResults, input);

    if (!analysisResult) {
      return {
        intent: plan.intent,
        answer:
          "I need a current analysis result or enough location/route data before I can answer that.",
        recommended_provider: "Unknown",
        confidence: "low",
        analysis_result: null,
        agent_outputs: {},
        map_layers: null,
        tool_calls: toolResults.map((tool) => ({
          name: tool.name,
          status: tool.status,
        })),
        warnings: ["No analysis result available."],
        trace_id: traceId,
      };
    }

    const agentOutputs: AgentOutputs = {};

    agentOutputs.sim_recommender =
      await this.simRecommenderAgent.run(analysisResult);

    agentOutputs.coverage_explainer =
      await this.coverageExplainerAgent.run(analysisResult);

    agentOutputs.report_summarizer =
      await this.reportSummarizerAgent.run(analysisResult);

    agentOutputs.offline_readiness =
      await this.offlineReadinessAgent.run(analysisResult);

    agentOutputs.anomaly = await this.anomalyAgent.run(analysisResult);

    const towerMapOutput = this.towerMapperAgent.run(analysisResult);
    agentOutputs.tower_mapper = towerMapOutput;

    const finalAnswer = await this.finalAnswerAgent.run({
      traceId,
      plan,
      analysisResult,
      agentOutputs,
      mapLayers: towerMapOutput.map_layers,
      toolResults,
    });

    return finalAnswer;
  }
}