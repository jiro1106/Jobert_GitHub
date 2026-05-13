import { SIGNALPH_TOOLS } from "./toolSchemas";
import type { ChatbotInput } from "../orchestration/a2aMessages";

export function buildRouterPrompt(input: ChatbotInput): string {
  return `
You are the SignalPH tool router.

Return ONLY raw JSON.
Do not use markdown.
Do not use code fences.
Do not invent tools.
Do not invent coordinates.
Do not invent signal results.
The field tool_calls must be an array of objects.
The field arguments must always be a JSON object, never an array.

Allowed intents:
- analyze_point
- analyze_route
- submit_signal_report
- explain_current_result
- summarize_reports
- show_towers
- offline_readiness
- anomaly_check
- unclear

Available tools:
${JSON.stringify(SIGNALPH_TOOLS, null, 2)}

User prompt:
${input.prompt}

Available context:
${JSON.stringify(
  {
    latitude: input.latitude,
    longitude: input.longitude,
    radius_km: input.radius_km ?? 5.0,
    origin: input.origin,
    destination: input.destination,
    route_points: input.route_points,
    has_current_analysis_result: Boolean(input.current_analysis_result),
  },
  null,
  2
)}

Routing rules:
- If the user asks about one location and latitude/longitude are available, use analyze_point.
- If the user asks about a route, trip, path, origin/destination, or multiple points, use analyze_route.
- If the user wants to submit feedback/report, use submit_signal_report.
- If current_analysis_result exists and the user asks "why", "explain", "which is best", "weak spots", or "what does this mean", use explain_current_result and do not call tools.
- If required inputs are missing, return them in missing_inputs.
- Copy coordinates from available context into tool arguments.

Return exactly this JSON shape:
{
  "intent": "analyze_point",
  "tool_calls": [
    {
      "name": "analyze_point",
      "arguments": {
        "latitude": 14.6175,
        "longitude": 120.99,
        "radius_km": 5.0
      }
    }
  ],
  "resource_reads": [],
  "next_agents": [],
  "missing_inputs": [],
  "reason": "short reason"
}
`;
}

export function buildJsonAgentPrompt(params: {
  agentName: string;
  task: string;
  input: unknown;
  outputShape: unknown;
}): string {
  return `
You are ${params.agentName} for SignalPH.

Task:
${params.task}

Rules:
- Return ONLY raw JSON.
- Do not use markdown.
- Do not use code fences.
- Do not invent data.
- Base your answer only on the provided input.
- Keep text concise and user-facing.

Input:
${JSON.stringify(params.input, null, 2)}

Return exactly this JSON shape:
${JSON.stringify(params.outputShape, null, 2)}
`;
}