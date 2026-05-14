import globeLogo from "../assets/globe.png";
import smartLogo from "../assets/smart.png";
import ditoLogo from "../assets/dito.jpg";
import tmLogo from "../assets/tm.png";
import sunLogo from "../assets/sun.png";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProviderId = "globe" | "smart" | "dito" | "tm" | "sun";

export interface Provider {
  id: ProviderId;
  /** Full legal/brand name */
  name: string;
  /** Short display name used in UI labels and badges */
  shortName: string;
  /** Brand primary color (hex) */
  color: string;
  /** Light tint for backgrounds, cards, and chips */
  colorTint: string;
  /** Imported logo asset path */
  logo: string;
  /**
   * Numeric code the backend uses to identify this provider.
   * The backend sends this code; the frontend converts it to a Provider.
   * [PLACEHOLDER: confirm MNC codes with backend team]
   */
  networkCode: string;
  /**
   * null  → main carrier
   * string → sub-brand; value is the parent carrier's ProviderId
   */
  parentId: ProviderId | null;
}

// ─── Provider Definitions ────────────────────────────────────────────────────

export const PROVIDERS: Record<ProviderId, Provider> = {
  globe: {
    id: "globe",
    name: "Globe Telecom",
    shortName: "Globe",
    color: "#1F4FFF",
    colorTint: "#EEF2FF",
    logo: globeLogo,
    networkCode: "[PLACEHOLDER: Globe network code]",
    parentId: null,
  },
  smart: {
    id: "smart",
    name: "Smart Communications",
    shortName: "Smart",
    color: "#16A34A",
    colorTint: "#F0FDF4",
    logo: smartLogo,
    networkCode: "[PLACEHOLDER: Smart network code]",
    parentId: null,
  },
  dito: {
    id: "dito",
    name: "DITO Telecommunity",
    shortName: "DITO",
    color: "#E11D48",
    colorTint: "#FFF1F2",
    logo: ditoLogo,
    networkCode: "[PLACEHOLDER: DITO network code]",
    parentId: null,
  },
  tm: {
    id: "tm",
    name: "Touch Mobile",
    shortName: "TM",
    color: "#0EA5E9",
    colorTint: "#F0F9FF",
    logo: tmLogo,
    networkCode: "[PLACEHOLDER: TM network code]",
    parentId: "globe",
  },
  sun: {
    id: "sun",
    name: "Sun Cellular",
    shortName: "Sun",
    color: "#F59E0B",
    colorTint: "#FFFBEB",
    logo: sunLogo,
    networkCode: "[PLACEHOLDER: Sun network code]",
    parentId: "smart",
  },
};

// ─── Derived Collections ─────────────────────────────────────────────────────

/** All providers in display order: main carriers first, then sub-brands */
export const PROVIDER_LIST: Provider[] = [
  PROVIDERS.globe,
  PROVIDERS.smart,
  PROVIDERS.dito,
  PROVIDERS.tm,
  PROVIDERS.sun,
];

/** Main carriers only — no sub-brands */
export const MAIN_CARRIERS: Provider[] = PROVIDER_LIST.filter(
  (p) => p.parentId === null
);

// ─── Backend Code Lookup ──────────────────────────────────────────────────────

/**
 * Keyed by the backend network code.
 * Replace PLACEHOLDER values above and this map becomes the live lookup.
 */
const PROVIDER_BY_CODE = new Map<string, Provider>(
  PROVIDER_LIST.map((p) => [p.networkCode, p])
);

/**
 * Convert a raw backend network code into its Provider.
 * Returns undefined if the code is unrecognized.
 */
export function getProviderByCode(code: string): Provider | undefined {
  return PROVIDER_BY_CODE.get(code);
}
