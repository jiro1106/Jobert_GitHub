export const SIGNALPH_TOOLS = [
  {
    name: "analyze_point",
    description:
      "Analyze signal coverage at one selected geographic point.",
    parameters: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        radius_km: { type: "number", default: 5.0 },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "analyze_route",
    description:
      "Analyze signal coverage along a route using origin, destination, and optional route_points.",
    parameters: {
      type: "object",
      properties: {
        origin: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            name: { type: "string" },
          },
          required: ["latitude", "longitude"],
        },
        destination: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            name: { type: "string" },
          },
          required: ["latitude", "longitude"],
        },
        route_points: {
          type: "array",
          items: {
            type: "object",
            properties: {
              latitude: { type: "number" },
              longitude: { type: "number" },
            },
            required: ["latitude", "longitude"],
          },
        },
        radius_km: { type: "number", default: 5.0 },
      },
      required: ["origin", "destination"],
    },
  },
  {
    name: "submit_signal_report",
    description:
      "Submit a crowdsourced signal quality report for a provider at a location.",
    parameters: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" },
        provider_name: {
          type: "string",
          enum: ["Globe", "Smart", "DITO", "Other"],
        },
        signal_feedback: { type: "string" },
        speed_feedback: { type: "string" },
        issue_type: { type: "string" },
        user_notes: { type: "string" },
      },
      required: ["latitude", "longitude", "provider_name"],
    },
  },
] as const;

export const ALLOWED_TOOL_NAMES = SIGNALPH_TOOLS.map((tool) => tool.name);