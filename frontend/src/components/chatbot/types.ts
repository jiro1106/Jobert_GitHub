// types.ts

export type Sender = "user" | "assistant";

export type AgentType =
  | "Route Analysis Agent"
  | "Crowdsourced Summary Agent"
  | "Deadzone Prediction Agent";

export type Message = {
  id: number;
  sender: Sender;
  text: string;
  agent?: AgentType;
};