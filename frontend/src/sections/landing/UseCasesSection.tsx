import { useState, useRef, useEffect } from "react";
import { MOCK_USE_CASES, MOCK_CHAT_MESSAGES } from "../../types/coverage";
import type { ChatMessage } from "../../types/coverage";

const PROVIDER_COLORS: Record<string, string> = {
  globe: "#1F4FFF",
  smart: "#E11D48",
  dito: "#4F46E5",
};

const QUICK_PROMPTS = [
  "Which SIM for Baguio trip?",
  "Signal near EDSA?",
  "Globe vs Smart in Cebu?",
];

export default function UseCasesSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    /* Simulated bot reply — PLACEHOLDER for real agent response */
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "Based on 14,210 community readings along this route, Globe provides the most consistent 4G LTE coverage through rural stretches.",
        citation: "Crowdsourced Summary Agent",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1400);
  }

  return (
    <section className="block" data-section="use-cases">
      <div className="block-head">
        <div>
          <div className="eyebrow">03 · Who uses SignalPH</div>
          <h2 className="h-section mt-[6px]">
            Built for every kind of traveler
          </h2>
          <div className="h-sub">
            From daily commuters to field workers — see which SIM works best for
            your journey type.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:!grid-cols-2 lg:!gap-[18px]">
        {/* Use case table */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Popular use cases</div>
            <span
              className="text-[10px] text-[var(--ink-5)] uppercase tracking-[0.05em]"
              style={{ fontFamily: "var(--mono)" }}
            >
              Best SIM
            </span>
          </div>
          <div>
            {MOCK_USE_CASES.map((uc, i) => (
              <div
                key={uc.id}
                className="grid grid-cols-[32px_1fr_auto] gap-[14px] items-center py-[14px] px-[18px] cursor-pointer hover:!bg-[var(--tint)]"
                style={{
                  borderTop: i === 0 ? 0 : "1px solid var(--line-soft)",
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-tint)] text-[var(--brand-ink)] grid place-items-center">
                  <uc.icon size={16} strokeWidth={2.2} />
                </div>

                <div>
                  <div className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {uc.title}
                  </div>
                  <div className="text-[11.5px] text-[var(--ink-4)] mt-px">
                    {uc.subtitle}
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-[13px]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: PROVIDER_COLORS[uc.bestProvider] }}
                  />
                  {uc.bestProvider.charAt(0).toUpperCase() +
                    uc.bestProvider.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI assistant chat */}
        <div className="panel flex flex-col">
          <div className="panel-head">
            <div className="panel-title">
              <span className="text-sm">✦</span>
              Ask SignalPH
              <span className="badge">AI</span>
            </div>
          </div>

          {/* Chat body */}
          <div
            ref={bodyRef}
            className="flex-1 p-[18px] flex flex-col gap-2.5 bg-[var(--tint)] border-b border-[var(--line)] min-h-[240px] overflow-y-auto"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  maxWidth: "88%",
                  padding: "10px 13px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.5,
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  background: msg.role === "user" ? "var(--ink)" : "white",
                  border: msg.role === "bot" ? "1px solid var(--line)" : "none",
                  color: msg.role === "user" ? "white" : "var(--ink)",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: msg.role === "bot" ? 4 : 12,
                }}
              >
                {msg.text}
                {msg.citation && (
                  <div className="mt-1.5">
                    <span
                      className="inline-flex items-center gap-[5px] bg-[var(--brand-tint)] text-[var(--brand-ink)] rounded-[5px] py-[3px] px-[7px] text-[10px] font-semibold"
                      style={{ fontFamily: "var(--mono)" }}
                    >
                      ↗ {msg.citation}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="inline-flex gap-[3px] self-start py-[9px] px-3 bg-white border border-[var(--line)] rounded-xl rounded-bl-[4px]">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full bg-[var(--ink-5)]"
                    style={{ animation: `bounce 1.2s ${delay}s infinite` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 py-[10px] px-[14px] border-b border-[var(--line-soft)] overflow-x-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => send(prompt)}
                className="flex-shrink-0 border border-[var(--line)] bg-white rounded-full py-[5px] px-[11px] text-[11.5px] font-medium text-[var(--ink-3)] whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 py-3 px-[14px] items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              placeholder="Ask about signal coverage…"
              className="flex-1 border border-[var(--line)] rounded-[9px] py-[9px] px-3 text-[13px] outline-none text-[var(--ink)]"
              style={{ fontFamily: "inherit" }}
            />
            <button
              onClick={() => send(input)}
              className="bg-[var(--brand)] text-white border-0 rounded-[9px] w-9 h-9 grid place-items-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
