/* ============================================================
   SignalPH — shared TypeScript types
   All data shapes match the intended API contract.
   Values marked PLACEHOLDER will be replaced with real API data.
   ============================================================ */
import {
  GraduationCap,
  Bus,
  Plane,
  Briefcase,
  Package,
  LucideIcon,
} from "lucide-react";
export type SignalLevel = "strong" | "patchy" | "dead" | "unknown";
export type Provider = "globe" | "smart" | "dito";
export type NetworkGen = "5G" | "4G LTE" | "3G";
export type TravelMode = "drive" | "bus" | "walk";
export type MapLayer = "all" | Provider;

export interface RouteEndpoint {
  label: string;
  lat: number; /* PLACEHOLDER */
  lng: number; /* PLACEHOLDER */
}

export interface SignalGap {
  id: string;
  km: number;
  level: "dead" | "patchy";
  name: string;
  description: string;
}

export interface TripSummary {
  distanceKm: number;
  drivingTimeMin: number;
  strongSignalPct: number;
  deadZoneCount: number;
}

export interface ProviderScore {
  provider: Provider;
  name: string;
  fullName: string;
  score: number;
  delta: number;
  network: NetworkGen;
  avgSpeedMbps: number;
  strongSignalPct: number;
  confidencePct: number;
  sparklineData: number[];
}

export interface SimRecommendation {
  provider: Provider;
  name: string;
  reason: string;
  score: number;
}

export interface RouteForecast {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
  summary: TripSummary;
  recommendation: SimRecommendation;
  gaps: SignalGap[];
  providers: ProviderScore[];
}

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
  citation?: string;
}

export interface StatCell {
  value: string;
  label: string;
  sublabel: string;
}

export interface UseCase {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  bestProvider: Provider;
  network: NetworkGen;
}

/* ============================================================
   MOCK DATA — PLACEHOLDER values for prototyping
   ============================================================ */

export const MOCK_ROUTE_FORECAST: RouteForecast = {
  origin: {
    label: "Makati, Metro Manila",
    lat: 14.5547,
    lng: 121.0244 /* PLACEHOLDER */,
  },
  destination: {
    label: "San Fernando, La Union",
    lat: 16.6159,
    lng: 120.3166 /* PLACEHOLDER */,
  },
  summary: {
    distanceKm: 214 /* PLACEHOLDER */,
    drivingTimeMin: 260 /* PLACEHOLDER */,
    strongSignalPct: 87 /* PLACEHOLDER */,
    deadZoneCount: 3 /* PLACEHOLDER */,
  },
  recommendation: {
    provider: "globe",
    name: "Globe",
    reason: "5G in Metro + best LTE through Pangasinan rural stretch.",
    score: 87 /* PLACEHOLDER */,
  },
  gaps: [
    {
      id: "g1",
      km: 78,
      level: "dead",
      name: "Rural Pangasinan stretch",
      description: "2.4 km dead zone · all providers weak",
    },
    {
      id: "g2",
      km: 134,
      level: "patchy",
      name: "Dagupan bypass",
      description: "Patchy DITO signal · Globe stays strong",
    },
    {
      id: "g3",
      km: 186,
      level: "patchy",
      name: "Aringay coastal road",
      description: "3G fallback likely · cache offline maps",
    },
  ],
  providers: [
    {
      provider: "globe",
      name: "Globe",
      fullName: "Globe Telecom Inc.",
      score: 87,
      delta: 4,
      network: "5G",
      avgSpeedMbps: 38,
      strongSignalPct: 82,
      confidencePct: 92,
      sparklineData: [
        82, 88, 90, 87, 85, 86, 80, 72, 30, 28, 45, 70, 82, 88, 84, 82, 86, 90,
        85, 80, 78, 82, 88, 90, 86, 82, 80, 84,
      ],
    },
    {
      provider: "smart",
      name: "Smart",
      fullName: "Smart Communications",
      score: 81,
      delta: 2,
      network: "4G LTE",
      avgSpeedMbps: 29,
      strongSignalPct: 74,
      confidencePct: 88,
      sparklineData: [
        78, 82, 85, 80, 72, 68, 60, 55, 38, 30, 42, 55, 68, 72, 70, 68, 72, 75,
        68, 70, 72, 68, 72, 74, 72, 68, 70, 74,
      ],
    },
    {
      provider: "dito",
      name: "DITO",
      fullName: "DITO Telecommunity",
      score: 62,
      delta: -3,
      network: "4G LTE",
      avgSpeedMbps: 18,
      strongSignalPct: 55,
      confidencePct: 71,
      sparklineData: [
        62, 58, 55, 60, 52, 48, 42, 38, 22, 18, 28, 36, 44, 48, 46, 42, 46, 50,
        44, 46, 50, 46, 44, 48, 46, 42, 44, 48,
      ],
    },
  ],
};

export const MOCK_STATS: StatCell[] = [
  { value: "81", label: "Provinces", sublabel: "with active coverage data" },
  { value: "42K+", label: "Daily reports", sublabel: "from field & community" },
  { value: "3", label: "Major providers", sublabel: "tracked nationwide" },
  {
    value: "94%",
    label: "Forecast accuracy",
    sublabel: "vs. on-ground readings",
  },
];

export const MOCK_USE_CASES: UseCase[] = [
  {
    id: "uc1",
    icon: GraduationCap,
    title: "Students commuting to campus",
    subtitle: "UST, Katipunan, PUP corridors",
    bestProvider: "globe",
    network: "5G",
  },
  {
    id: "uc2",
    icon: Bus,
    title: "Bus passengers (Manila → Baguio)",
    subtitle: "Naguilian Road coverage check",
    bestProvider: "smart",
    network: "4G LTE",
  },
  {
    id: "uc3",
    icon: Plane,
    title: "Tourists arriving in Cebu",
    subtitle: "Airport to Mactan coverage",
    bestProvider: "globe",
    network: "5G",
  },
  {
    id: "uc4",
    icon: Briefcase,
    title: "Remote workers traveling",
    subtitle: "Checking upload reliability",
    bestProvider: "globe",
    network: "5G",
  },
  {
    id: "uc5",
    icon: Package,
    title: "Delivery riders (Davao)",
    subtitle: "GenSan route gap warnings",
    bestProvider: "smart",
    network: "4G LTE",
  },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "bot",
    text: "Which provider has the best signal between Tarlac and La Union?",
    citation: "Route Analysis Agent",
  },
  {
    id: "m2",
    role: "user",
    text: "Globe has the strongest coverage on this stretch — 82% strong signal vs 74% for Smart.",
  },
  {
    id: "m3",
    role: "bot",
    text: "Are there any dead zones I should know about before I leave?",
  },
];

export const POPULAR_ROUTES = [
  "Manila → Baguio",
  "Cebu → Bohol",
  "Manila → Bicol",
  "Davao → GenSan",
] as const;
