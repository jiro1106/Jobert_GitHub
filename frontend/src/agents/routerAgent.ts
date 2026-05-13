import { LFMClient } from "../ai/lfmClient";
import { buildRouterPrompt } from "../ai/prompts";
import type { ChatbotInput, RouterPlan } from "../orchestration/a2aMessages";
import { ALLOWED_TOOL_NAMES } from "../ai/toolSchemas";

function sanitizeRouterPlan(plan: RouterPlan, input: ChatbotInput): RouterPlan {
  const sanitized: RouterPlan = {
    intent: plan.intent || "unclear",
    tool_calls: Array.isArray(plan.tool_calls) ? plan.tool_calls : [],
    resource_reads: Array.isArray(plan.resource_reads) ? plan.resource_reads : [],
    next_agents: Array.isArray(plan.next_agents) ? plan.next_agents : [],
    missing_inputs: Array.isArray(plan.missing_inputs) ? plan.missing_inputs : [],
    reason: plan.reason || "",
  };

  sanitized.tool_calls = sanitized.tool_calls
    .filter((call) => ALLOWED_TOOL_NAMES.includes(call.name as any))
    .map((call) => ({
      name: call.name,
      arguments:
        call.arguments && !Array.isArray(call.arguments)
          ? call.arguments
          : {},
    }));

  // Fallback repair for common small-model mistake: empty arguments.
  if (
    sanitized.intent === "analyze_point" &&
    sanitized.tool_calls.length === 0 &&
    input.latitude !== undefined &&
    input.longitude !== undefined
  ) {
    sanitized.tool_calls.push({
      name: "analyze_point",
      arguments: {
        latitude: input.latitude,
        longitude: input.longitude,
        radius_km: input.radius_km ?? 5.0,
      },
    });
  }

  if (
    sanitized.intent === "analyze_point" &&
    sanitized.tool_calls[0]?.name === "analyze_point"
  ) {
    sanitized.tool_calls[0].arguments = {
      latitude:
        Number(sanitized.tool_calls[0].arguments.latitude) || input.latitude,
      longitude:
        Number(sanitized.tool_calls[0].arguments.longitude) || input.longitude,
      radius_km:
        Number(sanitized.tool_calls[0].arguments.radius_km) ||
        input.radius_km ||
        5.0,
    };
  }

  if (
    sanitized.intent === "analyze_route" &&
    sanitized.tool_calls.length === 0 &&
    input.origin &&
    input.destination
  ) {
    sanitized.tool_calls.push({
      name: "analyze_route",
      arguments: {
        origin: input.origin,
        destination: input.destination,
        route_points: input.route_points,
        radius_km: input.radius_km ?? 5.0,
      },
    });
  }

  if (
    sanitized.intent === "analyze_route" &&
    sanitized.tool_calls[0]?.name === "analyze_route"
  ) {
    sanitized.tool_calls[0].arguments = {
      origin: sanitized.tool_calls[0].arguments.origin || input.origin,
      destination:
        sanitized.tool_calls[0].arguments.destination || input.destination,
      route_points:
        sanitized.tool_calls[0].arguments.route_points || input.route_points,
      radius_km:
        Number(sanitized.tool_calls[0].arguments.radius_km) ||
        input.radius_km ||
        5.0,
    };
  }

  return sanitized;
}

export class RouterAgent {
  constructor(private lfm: LFMClient) {}

  async plan(input: ChatbotInput): Promise<RouterPlan> {
    const prompt = buildRouterPrompt(input);

    const rawPlan = await this.lfm.generateJson<RouterPlan>(prompt, 512);
    return sanitizeRouterPlan(rawPlan, input);
  }
}