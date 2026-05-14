// SignalGapCard.tsx
// Displays a single signal gap (contiguous weak-signal patch) as a rich card.
// Shows area name, severity badge, km start → end range, and description.

import React from "react";
import type { SignalGap } from "../../../types/coverage";

interface Props {
  gap: SignalGap;
  isFirst: boolean;
}

function XSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
      <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WarnSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.5L12.5 11.5H1.5L7 1.5Z"
        fill="#FEF3C7"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 5.5v3M7 10h.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const SignalGapCard: React.FC<Props> = ({ gap, isFirst }) => {
  const isDead = gap.level === "dead";
  const kmEnd = gap.km_end ?? gap.km + (isDead ? 2.0 : 1.0);
  const gapKm = Math.max(0.05, +(kmEnd - gap.km).toFixed(2));

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 18px",
        borderTop: isFirst ? 0 : "1px solid var(--line-soft)",
        alignItems: "flex-start",
      }}
    >
      {/* Severity icon */}
      <div style={{ marginTop: 3, flexShrink: 0 }}>
        {isDead ? <XSmallIcon /> : <WarnSmallIcon />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Area name + badge row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ink)",
              lineHeight: 1.3,
            }}
          >
            {gap.name}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 99,
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
              background: isDead ? "#FEE2E2" : "#FEF3C7",
              color: isDead ? "#B91C1C" : "#92400E",
              flexShrink: 0,
            }}
          >
            {isDead ? "Dead zone" : "Patchy"}
          </span>
        </div>

        {/* km start → end */}
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            color: isDead ? "#DC2626" : "#D97706",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>km {gap.km.toFixed(1)}</span>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M0 4h8M5 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{kmEnd.toFixed(1)}</span>
          <span style={{ color: "var(--ink-5)", fontWeight: 400 }}>
            ({gapKm.toFixed(1)} km gap)
          </span>
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: "var(--ink-4)", lineHeight: 1.45 }}>
          {gap.description}
        </div>
      </div>
    </div>
  );
};

export default SignalGapCard;
