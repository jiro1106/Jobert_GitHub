import { LFMClient } from "../ai/lfmClient";
import { RouterAgent } from "../agents/routerAgent";
import { FinalAnswerAgent } from "../agents/finalAnswerAgent";
import { executeToolCalls } from "./toolExecutor";
import type {
  ChatbotInput,
  FinalChatbotResponse,
  RouterPlan,
  ToolExecutionResult,
} from "./a2aMessages";

function createTraceId() {
  return crypto.randomUUID?.() || `trace-${Date.now()}`;
}

function getPrimaryAnalysisResult(
  toolResults: ToolExecutionResult[],
  input: ChatbotInput,
) {
  const successfulTool = toolResults.find((tool) => tool.status === "success");

  if (successfulTool?.data) {
    return successfulTool.data;
  }

  return input.current_analysis_result || null;
}
function isCasualPrompt(prompt: string) {
  return /^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay|test|uhh|hmm)$/i.test(
    prompt.trim(),
  );
}

function isRoutePrompt(prompt: string) {
  return /\b(route|trip|commute|journey|drive|travel|current route|this route|my route|along the way)\b/i.test(
    prompt,
  );
}

function isSignalPrompt(prompt: string) {
  return /\b(signal|coverage|sim|provider|network|internet|globe|smart|dito|weak|best|recommend|check|analyze|explain)\b/i.test(
    prompt,
  );
}

function buildDeterministicPlan(input: ChatbotInput): RouterPlan | null {
  const prompt = input.prompt.trim();

  if (isCasualPrompt(prompt)) {
    return {
      intent: "unclear",
      tool_calls: [],
      missing_inputs: [],
      reason: "The user sent a casual message, not a signal analysis request.",
    };
  }

  const routeAsked = isRoutePrompt(prompt);
  const signalAsked = isSignalPrompt(prompt);

  // If the user says random/non-signal stuff, do not ask for latitude/longitude.
  if (!routeAsked && !signalAsked) {
    return {
      intent: "unclear",
      tool_calls: [],
      missing_inputs: [],
      reason:
        "The user did not ask a signal, coverage, location, or route question.",
    };
  }

  // IMPORTANT FIX:
  // If a route is active, coverage/signal/SIM questions should use the route.
  // Example: "can you check for coverage"
  if ((routeAsked || signalAsked) && input.origin && input.destination) {
    return {
      intent: "analyze_route",
      tool_calls: [
        {
          name: "analyze_route",
          arguments: {
            origin: input.origin,
            destination: input.destination,
            route_points: input.route_points,
            radius_km: input.radius_km ?? 5.0,
          },
        },
      ],
      missing_inputs: [],
      reason:
        "The user asked about coverage while an active route is available.",
    };
  }

  if (
    signalAsked &&
    input.latitude !== undefined &&
    input.longitude !== undefined
  ) {
    return {
      intent: "analyze_point",
      tool_calls: [
        {
          name: "analyze_point",
          arguments: {
            latitude: input.latitude,
            longitude: input.longitude,
            radius_km: input.radius_km ?? 5.0,
          },
        },
      ],
      missing_inputs: [],
      reason: "The user asked about signal coverage for a known point.",
    };
  }

  if (input.current_analysis_result && signalAsked) {
    return {
      intent: "explain_current_result",
      tool_calls: [],
      missing_inputs: [],
      reason:
        "The user asked about signal context and a current analysis result exists.",
    };
  }

  return {
    intent: "unclear",
    tool_calls: [],
    missing_inputs: [],
    reason:
      "The user asked about coverage but no route or location context is available.",
  };
}
export class ChatbotOrchestrator {
  private lfm = new LFMClient();
  private routerAgent = new RouterAgent(this.lfm);
  private finalAnswerAgent = new FinalAnswerAgent(this.lfm);

  async preloadModel() {
    await this.lfm.load();
  }

  async answer(input: ChatbotInput): Promise<FinalChatbotResponse> {
    const traceId = createTraceId();

    console.log("[Agent Trace] start", { traceId, input });

    const deterministicPlan = buildDeterministicPlan(input);
    const plan = deterministicPlan ?? (await this.routerAgent.plan(input));

    console.log("[Agent Trace] router plan", plan);

    // Step 2: Surface missing-input errors immediately
    if (plan.missing_inputs?.length > 0) {
      return {
        intent: plan.intent,
        answer: `I need this first: ${plan.missing_inputs.join(", ")}.`,
        recommended_provider: "Unknown",
        confidence: "low",
        analysis_result: null,
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
      plan.tool_calls?.length > 0
        ? await executeToolCalls(plan.tool_calls)
        : [];

    console.log("[Agent Trace] tool results", toolResults);

    const analysisResult = getPrimaryAnalysisResult(toolResults, input);

    // Step 7: Final answer agent synthesises everything into one response
    const finalAnswer = await this.finalAnswerAgent.run({
      traceId,
      userPrompt: input.prompt,
      plan,
      analysisResult,
      toolResults,
    });

    console.log("[Agent Trace] final answer", finalAnswer);

    return finalAnswer;
  }
}
