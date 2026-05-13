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
    solid: "#1D4ED8",
    light: "#DBEAFE",
  },
  Smart: {
    solid: "#C90A11",
    light: "#FFFE93",
  },
  DITO: {
    solid: "#16A34A",
    light: "#DCFCE7",
  },
  SUN: {
    solid: "#DC2626",
    light: "#FEE2E2",
  },
  TM: {
    solid: "#0C1281",
    light: "#F2E126",
  },
};

export const PROVIDER_FILTER_STYLES: Record<
  Provider,
  ProviderFilterStyle
> = {
  All: {
    active: "bg-[#2B67EB] text-white border-[#2B67EB]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  Globe: {
    active: "bg-[#1D4ED8] text-white border-[#1D4ED8]",
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
    active: "bg-[#FFFE93] text-[#C90A11] border-[#FFFE93]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
  TM: {
    active: "bg-[#0C1281] text-[#F2E126] border-[#0C1281]",
    inactive:
      "bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300",
  },
};

export const PROVIDER_HEATMAP_COLORS: Record<
  Exclude<Provider, "All">,
  Color[]
> = {
  Globe: [
    [29, 78, 216, 0],
    [29, 78, 216, 80],
    [29, 78, 216, 160],
    [29, 78, 216, 255],
  ],
  Smart: [
    [220, 38, 38, 0],
    [220, 38, 38, 80],
    [220, 38, 38, 160],
    [220, 38, 38, 255],
  ],
  DITO: [
    [22, 163, 74, 0],
    [22, 163, 74, 80],
    [22, 163, 74, 160],
    [22, 163, 74, 255],
  ],
  SUN: [
    [201, 10, 17, 0],
    [201, 10, 17, 80],
    [201, 10, 17, 160],
    [201, 10, 17, 255],
  ],
  TM: [
    [12, 18, 129, 0],
    [12, 18, 129, 80],
    [12, 18, 129, 160],
    [12, 18, 129, 255],
  ],
};
