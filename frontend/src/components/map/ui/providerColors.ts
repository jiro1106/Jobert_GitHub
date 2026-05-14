import type { Color } from "@deck.gl/core";
import type { Provider } from "../types";

type ProviderStyle = {
  solid: string;
  light: string;
};

type ProviderFilterStyle = {
  active: string;
  inactive: string;
};

export type ProviderColors = Record<Exclude<Provider, "All">, ProviderStyle>;

export const PROVIDER_COLORS: ProviderColors = {
  Globe: {
    solid: "#2563EB",   // vivid blue
    light: "#BFDBFE",
  },
  Smart: {
    solid: "#16A34A",   // vivid green
    light: "#BBF7D0",
  },
  DITO: {
    solid: "#DC2626",   // vivid red
    light: "#FECACA",
  },
  SUN: {
    solid: "#EA580C",   // vivid orange
    light: "#FED7AA",
  },
  TM: {
    solid: "#CA8A04",   // vivid amber/yellow
    light: "#FEF08A",
  },
};

export const PROVIDER_FILTER_STYLES: Record<
  Provider,
  ProviderFilterStyle
> = {
  All: {
    active: "bg-[#2563EB] text-white border-[#2563EB]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  Globe: {
    active: "bg-[#2563EB] text-white border-[#2563EB]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  Smart: {
    active: "bg-[#16A34A] text-white border-[#16A34A]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  DITO: {
    active: "bg-[#DC2626] text-white border-[#DC2626]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  SUN: {
    active: "bg-[#EA580C] text-white border-[#EA580C]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  TM: {
    active: "bg-[#CA8A04] text-white border-[#CA8A04]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
};

export const PROVIDER_HEATMAP_COLORS: Record<
  Exclude<Provider, "All">,
  Color[]
> = {
  Globe: [
    [37, 99, 235, 0],
    [37, 99, 235, 80],
    [37, 99, 235, 160],
    [37, 99, 235, 255],
  ],
  Smart: [
    [22, 163, 74, 0],
    [22, 163, 74, 80],
    [22, 163, 74, 160],
    [22, 163, 74, 255],
  ],
  DITO: [
    [220, 38, 38, 0],
    [220, 38, 38, 80],
    [220, 38, 38, 160],
    [220, 38, 38, 255],
  ],
  SUN: [
    [234, 88, 12, 0],
    [234, 88, 12, 80],
    [234, 88, 12, 160],
    [234, 88, 12, 255],
  ],
  TM: [
    [202, 138, 4, 0],
    [202, 138, 4, 80],
    [202, 138, 4, 160],
    [202, 138, 4, 255],
  ],
};
