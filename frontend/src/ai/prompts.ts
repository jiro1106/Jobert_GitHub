// src/ai/prompts.ts

import { SIGNALPH_TOOLS } from "./toolSchemas";

export function buildRouterPrompt(input: {
  prompt: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  origin?: any;
  destination?: any;
  route_points?: any[];
  current_analysis_result?: any;
}) {
  return `
You are the SignalPH tool router.

You must decide which SignalPH tool to call.

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

Rules:
- Return only valid JSON.
- Do not include markdown.
- If the user asks about one location, call analyze_point.
- If the user asks about a route, trip, path, origin/destination, or multiple points, call analyze_route.
- If the user wants to report signal quality, call submit_signal_report.
- If current_analysis_result already exists and the user only asks "why", "explain", "which is best", or "weak spots", do not call a tool. Use intent explain_current_result.
- If required inputs are missing, set missing_inputs.

Return this exact JSON structure:
{
  "intent": "analyze_point | analyze_route | submit_signal_report | explain_current_result | unclear",
  "tool_calls": [
    {
      "name": "analyze_point",
      "arguments": {}
    }
  ],
  "missing_inputs": [],
  "reason": "short reason"
}
`;
}