// ChatbotConversation.tsx

import React from "react";
import { Sparkles } from "lucide-react";
import { Message } from "./types";

type Props = {
  messages: Message[];
};

const ChatbotConversation: React.FC<Props> = ({
  messages,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* HERO QUESTION */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-900">
          Which provider has the best signal between
          Tarlac and La Union?
        </p>

        <div className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-1 text-[11px] font-medium text-[#3457FF] w-fit mt-2">
          <Sparkles size={12} />
          Route Analysis Agent
        </div>
      </div>

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
              <p className="text-sm leading-relaxed">
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
    </div>
  );
};

export default ChatbotConversation;