import React, { useState } from "react";
import { Bot, Minimize2, Maximize2 } from "lucide-react";

import SuggestionChips from "./SuggestionChips";
import ChatbotInput from "./ChatbotInput";
import ChatbotConversation from "./ChatbotConversation";
import { frontendAgentOrchestrator } from "../../orchestration/agentSingleton";

import { Message } from "./types";

const PLACE_HINTS: Record<
  string,
  { latitude: number; longitude: number; name: string }
> = {
  baguio: {
    latitude: 16.4023,
    longitude: 120.596,
    name: "Baguio",
  },
  edsa: {
    latitude: 14.5746,
    longitude: 121.0437,
    name: "EDSA, Metro Manila",
  },
  cebu: {
    latitude: 10.3157,
    longitude: 123.8854,
    name: "Cebu",
  },
  manila: {
    latitude: 14.5995,
    longitude: 120.9842,
    name: "Manila",
  },
};

function resolvePlaceHint(text: string) {
  const normalized = text.toLowerCase();

  for (const [keyword, place] of Object.entries(PLACE_HINTS)) {
    if (normalized.includes(keyword)) {
      return place;
    }
  }

  return null;
}

const FloatingChatbot: React.FC = () => {
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Ask about signal strength, SIM choice, or weak spots. If you name a place like Baguio, EDSA, or Cebu, I will use that area for a quick signal check.",
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleSend = async () => {
    const cleanInput = input.trim();
    if (!cleanInput) return;

    const placeHint = resolvePlaceHint(cleanInput);

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: cleanInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await frontendAgentOrchestrator.answer({
        prompt: cleanInput,
        latitude: placeHint?.latitude,
        longitude: placeHint?.longitude,
        radius_km: 5.0,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: result.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Frontend AI chat error:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Frontend AI flow failed: ${
          error instanceof Error ? error.message : "unknown error"
        }. Check that the browser model loaded and the backend /mcp/tools/call endpoint is running.`,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {minimized && (
        <button
          onClick={toggleMinimize}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-2xl bg-[#07142B] px-5 py-4 text-white shadow-2xl hover:scale-105 transition"
        >
          <Bot size={20} />

          <span className="font-medium text-sm">Ask SignalPH</span>
        </button>
      )}

      {!minimized && (
        <div className="fixed bottom-6 right-6 z-9999 w-87.5 h-125 rounded-3xl border border-gray-200 bg-[#F4F6FB] shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-[#3457FF] flex items-center justify-center shadow-md">
                <Bot className="text-white" size={20} />
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
              aria-label="Minimize chat"
            >
              {minimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
          </div>

          <ChatbotConversation messages={messages} />

          <div className="border-t border-gray-200 bg-white px-4 py-4">
            <SuggestionChips
              suggestions={suggestions}
              onSelect={handleSuggestionClick}
            />

            <ChatbotInput
              input={input}
              setInput={setInput}
              onSend={handleSend}
              loading={loading}
            />

            {loading && (
              <div className="mt-2 text-xs text-gray-500">
                Running frontend router and final answer model...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
