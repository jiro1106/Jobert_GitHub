// ChatbotInput.tsx

import React from "react";
import { SendHorizonal } from "lucide-react";

type Props = {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void;
};

const ChatbotInput: React.FC<Props> = ({
  input,
  setInput,
  onSend,
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Ask about signal coverage..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#3457FF]"
      />

      <button
        onClick={onSend}
        className="h-12 w-12 rounded-2xl bg-[#3457FF] flex items-center justify-center text-white shadow-lg hover:scale-105 transition"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
};

export default ChatbotInput;