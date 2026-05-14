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

/**
 * Intents that can be answered from a general knowledge / conversation
 * context without requiring backend analysis tool calls.
 */
const GENERAL_INTENTS = new Set([
  "general_question",
  "general",
  "faq",
  "greeting",
  "help",
  "unclear",
]);

/**
 * Map router plan `next_agents` names to agent keys so only the
 * agents relevant to the current intent are invoked.
 */
const AGENT_KEY_MAP: Record<string, string> = {
  sim_recommender_agent: "sim_recommender",
  simRecommenderAgent: "sim_recommender",
  sim_recommender: "sim_recommender",

  coverage_explainer_agent: "coverage_explainer",
  coverageExplainerAgent: "coverage_explainer",
  coverage_explainer: "coverage_explainer",

  report_summarizer_agent: "report_summarizer",
  reportSummarizerAgent: "report_summarizer",
  report_summarizer: "report_summarizer",

  offline_readiness_agent: "offline_readiness",
  offlineReadinessAgent: "offline_readiness",
  offline_readiness: "offline_readiness",

  anomaly_agent: "anomaly",
  anomalyAgent: "anomaly",
  anomaly: "anomaly",

  tower_mapper_agent: "tower_mapper",
  towerMapperAgent: "tower_mapper",
  tower_mapper: "tower_mapper",
};

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

    // Step 1: Router agent decides intent and which tools/agents to use
    const plan = await this.routerAgent.plan(input);

    // Step 2: Surface missing-input errors immediately
    if (plan.missing_inputs?.length > 0) {
      return {
        intent: plan.intent,
        answer: `I need a bit more information: ${plan.missing_inputs.join(", ")}. Could you provide those details?`,
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

    // Step 3: For general/FAQ questions, skip tool calls and go straight to
    // the final answer agent using prompt + any existing context.
    const isGeneral = GENERAL_INTENTS.has(plan.intent?.toLowerCase());

    if (isGeneral) {
      const fallbackAnswer = await this.finalAnswerAgent.run({
        traceId,
        plan,
        analysisResult: input.current_analysis_result ?? null,
        agentOutputs: {},
        mapLayers: null,
        toolResults: [],
      });
      return fallbackAnswer;
    }

    // Step 4: Execute any tool calls planned by the router
    const toolResults =
      plan.tool_calls?.length > 0 ? await executeToolCalls(plan.tool_calls) : [];

    const analysisResult = getPrimaryAnalysisResult(toolResults, input);

    // Step 5: If we still have no analysis data, return a helpful nudge
    if (!analysisResult) {
      return {
        intent: plan.intent,
        answer:
          "I need location data to answer that. Try asking something like \"Signal near EDSA\" or \"Globe vs Smart in Baguio\" so I can look up towers and reports.",
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

    // Step 6: Run only the specialist agents the router requested.
    // Fall back to running all agents if next_agents is empty/missing.
    const requestedKeys: Set<string> =
      plan.next_agents?.length > 0
        ? new Set(
          plan.next_agents
            .map((name) => AGENT_KEY_MAP[name])
            .filter(Boolean)
        )
        : new Set([
          "sim_recommender",
          "coverage_explainer",
          "report_summarizer",
          "offline_readiness",
          "anomaly",
          "tower_mapper",
        ]);

    const agentOutputs: AgentOutputs = {};

    if (requestedKeys.has("sim_recommender")) {
      agentOutputs.sim_recommender =
        await this.simRecommenderAgent.run(analysisResult);
    }

    if (requestedKeys.has("coverage_explainer")) {
      agentOutputs.coverage_explainer =
        await this.coverageExplainerAgent.run(analysisResult);
    }

    if (requestedKeys.has("report_summarizer")) {
      agentOutputs.report_summarizer =
        await this.reportSummarizerAgent.run(analysisResult);
    }

    if (requestedKeys.has("offline_readiness")) {
      agentOutputs.offline_readiness =
        await this.offlineReadinessAgent.run(analysisResult);
    }

    if (requestedKeys.has("anomaly")) {
      agentOutputs.anomaly = await this.anomalyAgent.run(analysisResult);
    }

    let towerMapOutput: any = null;
    if (requestedKeys.has("tower_mapper")) {
      towerMapOutput = this.towerMapperAgent.run(analysisResult);
      agentOutputs.tower_mapper = towerMapOutput;
    }

    // Step 7: Final answer agent synthesises everything into one response
    const finalAnswer = await this.finalAnswerAgent.run({
      traceId,
      plan,
      analysisResult,
      agentOutputs,
      mapLayers: towerMapOutput?.map_layers ?? null,
      toolResults,
    });

    return finalAnswer;
  }
}