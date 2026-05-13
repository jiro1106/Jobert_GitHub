export type AgentName =
  | "router_agent"
  | "sim_recommender_agent"
  | "coverage_explainer_agent"
  | "report_summarizer_agent"
  | "tower_mapper_agent"
  | "offline_readiness_agent"
  | "anomaly_agent"
  | "final_answer_agent"
  | "chatbot_orchestrator";

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type RouterPlan = {
  intent: string;
  tool_calls: ToolCall[];
  resource_reads?: string[];
  next_agents?: string[];
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

export type A2AMessage<TInput = any, TOutput = any> = {
  trace_id: string;
  sender: AgentName;
  receiver: AgentName;
  task: string;
  input: TInput;
  output?: TOutput;
  status: "pending" | "success" | "error";
  error?: string;
  created_at: string;
};

export function createA2AMessage<TInput>(
  params: Omit<A2AMessage<TInput>, "status" | "created_at">
): A2AMessage<TInput> {
  return {
    ...params,
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

export type ToolExecutionResult = {
  name: string;
  status: "success" | "error";
  data?: any;
  error?: string;
};

export type AgentOutputs = {
  sim_recommender?: any;
  coverage_explainer?: any;
  report_summarizer?: any;
  tower_mapper?: any;
  offline_readiness?: any;
  anomaly?: any;
};

export type FinalChatbotResponse = {
  intent: string;
  answer: string;
  recommended_provider: string;
  confidence: "low" | "medium" | "high";
  analysis_result: any | null;
  agent_outputs: AgentOutputs;
  map_layers: any | null;
  tool_calls: Array<{
    name: string;
    status: string;
  }>;
  warnings: string[];
  trace_id: string;
};