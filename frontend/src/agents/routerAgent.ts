import { LFMClient } from "../ai/lfmClient";
import { buildRouterPrompt } from "../ai/prompts";
import { ALLOWED_TOOL_NAMES } from "../ai/toolSchemas";
import type { ChatbotInput, RouterPlan } from "../orchestration/a2aMessages";

function hasNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function repairRouterPlan(plan: RouterPlan, input: ChatbotInput): RouterPlan {
  const repaired: RouterPlan = {
    intent: plan.intent || "unclear",
    tool_calls: Array.isArray(plan.tool_calls) ? plan.tool_calls : [],
    missing_inputs: Array.isArray(plan.missing_inputs) ? plan.missing_inputs : [],
    reason: plan.reason || "",
  };

  repaired.tool_calls = repaired.tool_calls
    .filter((call) => ALLOWED_TOOL_NAMES.includes(call.name as any))
    .map((call) => ({
      name: call.name,
      arguments:
        call.arguments && !Array.isArray(call.arguments)
          ? call.arguments
          : {},
    }));

  if (repaired.intent === "analyze_route" && input.origin && input.destination) {
    repaired.tool_calls = [
      {
        name: "analyze_route",
        arguments: {
          origin: input.origin,
          destination: input.destination,
          route_points: input.route_points,
          radius_km: input.radius_km ?? 5.0,
        },
      },
    ];
    repaired.missing_inputs = [];
  }

  if (
    repaired.intent === "analyze_point" &&
    hasNumber(input.latitude) &&
    hasNumber(input.longitude)
  ) {
    repaired.tool_calls = [
      {
        name: "analyze_point",
        arguments: {
          latitude: input.latitude,
          longitude: input.longitude,
          radius_km: input.radius_km ?? 5.0,
        },
      },
    ];
    repaired.missing_inputs = [];
  }

  if (repaired.intent === "explain_current_result" && input.current_analysis_result) {
    repaired.tool_calls = [];
    repaired.missing_inputs = [];
  }

  if (repaired.intent === "analyze_point") {
    const call = repaired.tool_calls[0];

    if (!call || call.name !== "analyze_point") {
      repaired.missing_inputs = ["latitude", "longitude"];
    }
  }

  if (repaired.intent === "analyze_route") {
    const call = repaired.tool_calls[0];

    if (!call || call.name !== "analyze_route") {
      repaired.missing_inputs = ["origin", "destination"];
    }
  }

  return repaired;
}

export class RouterAgent {
  constructor(private lfm: LFMClient) {}

  async plan(input: ChatbotInput): Promise<RouterPlan> {
    const prompt = buildRouterPrompt(input);
    const rawPlan = await this.lfm.generateJson<RouterPlan>(prompt, 350);

    return repairRouterPlan(rawPlan, input);
  }
}