// ChatbotInput.tsx

import React from "react";
import { SendHorizonal } from "lucide-react";

type Props = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void;
  loading?: boolean;
};

const ChatbotInput: React.FC<Props> = ({
  input,
  setInput,
  onSend,
  loading = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Ask about signal coverage..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3457FF] disabled:opacity-60 disabled:cursor-not-allowed transition"
      />

      <button
        onClick={onSend}
        disabled={loading || !input.trim()}
        className="h-12 w-12 rounded-2xl bg-[#3457FF] flex items-center justify-center text-white shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        aria-label="Send message"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
};

export default ChatbotInput;