// ChatbotConversation.tsx

import React, { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { Message } from "./types";

type Props = {
  messages: Message[];
  loading?: boolean;
};

const TypingIndicator: React.FC = () => (
  <div className="flex justify-start">
    <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  </div>
);

const ChatbotConversation: React.FC<Props> = ({ messages, loading = false }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message whenever messages or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* MESSAGES */}
      {messages.map((message) => {
        const isUser = message.sender === "user";

        return (
          <div
            key={message.id}
            className={`flex ${
              isUser
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                isUser
                  ? "bg-[#07142B] text-white rounded-br-md"
                  : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>

              {!isUser && message.agent && (
                <div className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-1 text-[11px] font-medium text-[#3457FF] w-fit mt-2">
                  <Sparkles size={12} />
                  {message.agent}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* LOADING TYPING INDICATOR */}
      {loading && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatbotConversation;