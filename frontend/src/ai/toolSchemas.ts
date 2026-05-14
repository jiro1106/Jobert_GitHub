export const SIGNALPH_TOOLS = [
  {
    name: "analyze_point",
    description: "Analyze signal coverage at one selected geographic point.",
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
] as const;

export const ALLOWED_TOOL_NAMES = SIGNALPH_TOOLS.map((tool) => tool.name);