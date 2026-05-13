// SuggestionChips.tsx

import React from "react";

type Props = {
  suggestions: string[];
  onSelect: (value: string) => void;
};

const SuggestionChips: React.FC<Props> = ({
  suggestions,
  onSelect,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 pb-3 mt-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-[#3457FF] hover:text-[#3457FF] transition"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;