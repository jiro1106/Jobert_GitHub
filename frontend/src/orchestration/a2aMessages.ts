export type ToolCall = {
  name: string;
  arguments: Record<string, any>;
};

export type RouterPlan = {
  intent: string;
  tool_calls: ToolCall[];
  missing_inputs: string[];
  reason: string;
};

export type ChatbotInput = {
  prompt: string;

  latitude?: number;
  longitude?: number;
  radius_km?: number;

  origin?: {
    latitude: number;
    longitude: number;
    name?: string;
  };

  destination?: {
    latitude: number;
    longitude: number;
    name?: string;
  };

  route_points?: Array<{
    latitude: number;
    longitude: number;
  }>;

  current_analysis_result?: any;
};

export type ToolExecutionResult = {
  name: string;
  status: "success" | "error";
  data?: any;
  error?: string;
};

export type FinalChatbotResponse = {
  intent: string;
  answer: string;
  recommended_provider: string;
  confidence: "low" | "medium" | "high";
  analysis_result: any | null;
  tool_calls: Array<{
    name: string;
    status: string;
  }>;
  warnings: string[];
  trace_id: string;
};