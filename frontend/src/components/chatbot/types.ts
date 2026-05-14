// types.ts

export type Sender = "user" | "assistant";

export const AGENT_TYPES = [
  "Signal Assistant",
  "Route Analysis Agent",
  "Crowdsourced Summary Agent",
  "Deadzone Prediction Agent",
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

export const isAgentType = (value?: string): value is AgentType =>
  !!value && AGENT_TYPES.includes(value as AgentType);

export type Message = {
  id: number;
  sender: Sender;
  text: string;
  agent?: AgentType;
};