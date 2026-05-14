import { useState, useRef, useEffect } from "react";
import { MOCK_USE_CASES } from "../../types/coverage";
import type { ChatMessage } from "../../types/coverage";
import { frontendAgentOrchestrator } from "../../orchestration/agentSingleton";
import { PROVIDERS } from "../../constants/providers";
import type { RouteCoords } from "../../pages/LandingPage";
import type { RouteForecast } from "../../types/coverage";

const QUICK_PROMPTS = [
  "Which SIM for Baguio trip?",
  "Signal near EDSA?",
  "Globe vs Smart in Cebu?",
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    text: "Ask about signal for a place or trip. Replies use your frontend AI router, backend signal tools, and final answer model.",
    citation: "Frontend LFM Agent",
  },
];

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

function isRouteIntent(text: string) {
  return /\b(route|trip|commute|journey|drive|travel|current route|this route|my route|along the way)\b/i.test(
    text,
  );
}

function isCoverageIntent(text: string) {
  return /\b(signal|coverage|sim|provider|network|internet|globe|smart|dito|weak|best|recommend|check|analyze)\b/i.test(
    text,
  );
}

function isExplainIntent(text: string) {
  return /\b(why|explain|what does this mean|summary|summarize|best|which sim|which provider|recommend|compare|globe|smart|dito|weak|coverage|signal|dead zone|deadzone)\b/i.test(
    text,
  );
}

interface UseCasesSectionProps {
  activeRoute: RouteCoords | null;
  forecast: RouteForecast | null;
}

export default function UseCasesSection({
  activeRoute,
  forecast,
}: UseCasesSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function send(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: cleanText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const placeHint = resolvePlaceHint(cleanText);

     const wantsActiveRoute = Boolean(
  activeRoute &&
    !placeHint &&
    (isRouteIntent(cleanText) || isCoverageIntent(cleanText)),
);
      const wantsForecastExplanation = Boolean(
        forecast && isExplainIntent(cleanText),
      );

      console.log("[UseCases Chat Context]", {
        text: cleanText,
        activeRoute,
        forecast,
        placeHint,
        wantsActiveRoute,
        wantsForecastExplanation,
      });

      const result = await frontendAgentOrchestrator.answer({
        prompt: cleanText,

        origin: wantsActiveRoute
          ? {
              latitude: activeRoute!.originLat,
              longitude: activeRoute!.originLng,
              name: activeRoute!.originName,
            }
          : undefined,

        destination: wantsActiveRoute
          ? {
              latitude: activeRoute!.destLat,
              longitude: activeRoute!.destLng,
              name: activeRoute!.destName,
            }
          : undefined,

        latitude: !wantsActiveRoute && placeHint ? placeHint.latitude : undefined,
        longitude:
          !wantsActiveRoute && placeHint ? placeHint.longitude : undefined,

        radius_km: 5.0,

        current_analysis_result:
          wantsActiveRoute || wantsForecastExplanation ? forecast : undefined,
      });

      const botMsg: ChatMessage = {
        id: result.trace_id || (Date.now() + 1).toString(),
        role: "bot",
        text: result.answer,
        citation:
  result.intent === "analyze_route" &&
  result.tool_calls?.some((tool) => tool.name === "analyze_route" && tool.status === "success")
    ? "Frontend Router + Route Tool + Final Answer"
    : result.intent === "analyze_point" &&
        result.tool_calls?.some((tool) => tool.name === "analyze_point" && tool.status === "success")
      ? "Frontend Router + Point Tool + Final Answer"
      : "Frontend Router + Final Answer",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: `Frontend AI flow failed: ${
          e instanceof Error ? e.message : "unknown error"
        }. Check that the LFM server is running on 8020 and the backend /mcp/tools/call endpoint is running.`,
        citation: "Frontend LFM Agent",
      };

      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <section id="use-cases" className="block" data-section="use-cases">
      <div className="block-head">
        <div>
          <div className="eyebrow">03 · Who uses SignalPH</div>
          <h2 className="text-[30px] font-bold tracking-[-0.6px] leading-[1.2]">
            Built for every kind of traveler
          </h2>
          <div className="h-sub">
            From daily commuters to field workers — see which SIM works best for
            your journey type.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:!grid-cols-2 lg:!gap-[18px]">
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
                  <img
                    src={PROVIDERS[uc.bestProvider].logo}
                    alt={PROVIDERS[uc.bestProvider].shortName}
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                    }}
                  />
                  {PROVIDERS[uc.bestProvider].shortName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-head">
            <div className="panel-title">
              <span className="text-sm">✦</span>
              Ask SignalPH
              <span className="badge">AI</span>
            </div>
          </div>

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

          <div className="flex gap-1.5 py-[10px] px-[14px] border-b border-[var(--line-soft)] overflow-x-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => void send(prompt)}
                className="flex-shrink-0 border border-[var(--line)] bg-white rounded-full py-[5px] px-[11px] text-[11.5px] font-medium text-[var(--ink-3)] whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2 py-3 px-[14px] items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send(input);
              }}
              placeholder="Ask about signal coverage…"
              className="flex-1 border border-[var(--line)] rounded-[9px] py-[9px] px-3 text-[13px] outline-none text-[var(--ink)]"
              style={{ fontFamily: "inherit" }}
            />

            <button
              onClick={() => void send(input)}
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