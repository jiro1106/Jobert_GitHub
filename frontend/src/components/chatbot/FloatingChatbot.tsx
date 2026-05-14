// FloatingChatbot.tsx

import React, { useMemo, useState } from "react";

import {
  Bot,
  Minimize2,
  Maximize2,
} from "lucide-react";

import SuggestionChips from "./SuggestionChips";
import ChatbotInput from "./ChatbotInput";
import ChatbotConversation from "./ChatbotConversation";
import { ChatbotOrchestrator } from "../../orchestration/chatbotOrchestrator";
import type { ChatbotInput, FinalChatbotResponse } from "../../orchestration/a2aMessages";

import { AgentType, isAgentType, Message } from "./types";

const resolveAgent = (citation?: string): AgentType => {
  if (isAgentType(citation)) {
    return citation;
  }
  return "Signal Assistant";
};

const FloatingChatbot: React.FC = () => {
  const [minimized, setMinimized] = useState(false);

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Welcome to SignalPH. Ask about signal strength, SIM choice, or weak spots. Share a place (for example Baguio or EDSA) and I will check nearby towers and community reports.",
      agent: "Signal Assistant",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const orchestrator = useMemo(() => new ChatbotOrchestrator(), []);

  const suggestions = [
    "Which SIM for Baguio trip?",
    "Signal near EDSA?",
    "Globe vs Smart in Cebu?",
  ];

  const toggleMinimize = () => {
    setMinimized((prev) => !prev);
  };

  const handleSuggestionClick = (
    suggestion: string
  ) => {
    setInput(suggestion);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const payload: ChatbotInput = {
        prompt: input,
        current_analysis_result: analysisResult ?? undefined,
      };

      const response: FinalChatbotResponse =
        await orchestrator.answer(payload);

      if (response.analysis_result) {
        setAnalysisResult(response.analysis_result);
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: response.answer,
        agent: resolveAgent("Signal Assistant"),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "I could not reach the AI services. Check VITE_LFM_BASE_URL and VITE_API_URL, then try again.",
        agent: "Signal Assistant",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MINIMIZED BUTTON */}
      {minimized && (
        <button
          onClick={toggleMinimize}
          className="fixed bottom-6 right-6 z-9999 flex items-center gap-3 rounded-2xl bg-[#07142B] px-5 py-4 text-white shadow-2xl hover:scale-105 transition"
        >
          <Bot size={20} />

          <span className="font-medium text-sm">
            Ask SignalPH
          </span>
        </button>
      )}

      {/* CHAT WINDOW */}
      {!minimized && (
        <div className="fixed bottom-6 right-6 z-9999 w-87.5 h-125 rounded-3xl border border-gray-200 bg-[#F4F6FB] shadow-2xl flex flex-col overflow-hidden">

          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-white">

            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-[#3457FF] flex items-center justify-center shadow-md">
                <Bot
                  className="text-white"
                  size={20}
                />
              </div>

              <div>
                <h1 className="font-semibold text-gray-900 text-sm">
                  Ask SignalPH
                </h1>

                <p className="text-xs text-gray-500">
                  AI Signal Coverage Assistant
                </p>
              </div>
            </div>

            <button
              onClick={toggleMinimize}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
            >
              {minimized ? (
                <Maximize2 size={18} />
              ) : (
                <Minimize2 size={18} />
              )}
            </button>
          </div>

          {/* CONVERSATION */}
          <ChatbotConversation
            messages={messages}
          />

          {/* FOOTER */}
          <div className="border-t border-gray-200 bg-white px-4 py-4 ">

            {/* SUGGESTIONS */}
            <SuggestionChips
              suggestions={suggestions}
              onSelect={handleSuggestionClick}
            />

            {/* INPUT */}
            <ChatbotInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;