// HeatmapLayer.tsx
//
// Two display modes, toggled by the `mode` prop:
//
//  "circles"  (default / showHeatmap = false in MapComponent)
//    Provider-coloured coverage rings using real OpenCellID range_meters.
//    Globe=blue, Smart=green, DITO=red, SUN=orange, TM=yellow.
//    Each tower: outer translucent ring + inner glow accent.
//
//  "heatmap"  (showHeatmap = true in MapComponent)
//    Signal-quality heatmap via leaflet.heat.
//    Points weighted by tower signal score → smooth interpolated gradient:
//    green (strong) → yellow (moderate) → orange (weak) → red (very weak).
//    Radius and blur scale with zoom for readable coverage at any level.

import React, { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { Provider, Tower } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

export type HeatmapMode = "circles" | "heatmap";

interface Props {
  towers: Tower[];
  zoom: number;
  mode?: HeatmapMode;
}

// ─── Provider palette (circles mode) ─────────────────────────────────────────

const PROVIDER_PALETTE: Record<
  Exclude<Provider, "All">,
  { stroke: string; fill: string; glow: string }
> = {
  Globe: { stroke: "#1D4ED8", fill: "#2563EB", glow: "#60A5FA" },
  Smart: { stroke: "#15803D", fill: "#16A34A", glow: "#4ADE80" },
  DITO:  { stroke: "#B91C1C", fill: "#DC2626", glow: "#F87171" },
  SUN:   { stroke: "#C2410C", fill: "#EA580C", glow: "#FB923C" },
  TM:    { stroke: "#A16207", fill: "#CA8A04", glow: "#FDE047" },
};

const FALLBACK_PALETTE = { stroke: "#4B5563", fill: "#6B7280", glow: "#9CA3AF" };

function providerPalette(provider: string) {
  return PROVIDER_PALETTE[provider as Exclude<Provider, "All">] ?? FALLBACK_PALETTE;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SCREEN_PX = 7;
const MAX_RADIUS_M = 15_000;

// ─── Geometry ────────────────────────────────────────────────────────────────

function metersToPixels(map: L.Map, latlng: L.LatLng, meters: number): number {
  const p1 = map.latLngToContainerPoint(latlng);
  const northLat = latlng.lat + meters / 111_320;
  const p2 = map.latLngToContainerPoint(L.latLng(northLat, latlng.lng));
  return Math.abs(p1.y - p2.y);
}

function effectiveRadiusMeters(map: L.Map, latlng: L.LatLng, rawMeters: number): number {
  const capped = Math.min(rawMeters, MAX_RADIUS_M);
  const screenPx = metersToPixels(map, latlng, capped);
  if (screenPx >= MIN_SCREEN_PX) return capped;
  return capped * (MIN_SCREEN_PX / Math.max(screenPx, 0.1));
}

// ─── Zoom-adaptive style (circles mode) ──────────────────────────────────────

function outerStyle(zoom: number) {
  if (zoom >= 14) return { weight: 1.5, fillOpacity: 0.15, strokeOpacity: 0.70 };
  if (zoom >= 11) return { weight: 2.0, fillOpacity: 0.13, strokeOpacity: 0.78 };
  if (zoom >= 8)  return { weight: 2.3, fillOpacity: 0.11, strokeOpacity: 0.84 };
  return                 { weight: 2.8, fillOpacity: 0.09, strokeOpacity: 0.90 };
}

function innerStyle(zoom: number) {
  if (zoom >= 14) return { weight: 1.0, fillOpacity: 0.28, strokeOpacity: 0.55 };
  if (zoom >= 11) return { weight: 1.2, fillOpacity: 0.24, strokeOpacity: 0.60 };
  if (zoom >= 8)  return { weight: 1.5, fillOpacity: 0.20, strokeOpacity: 0.65 };
  return                 { weight: 2.0, fillOpacity: 0.18, strokeOpacity: 0.72 };
}

function makeCircle(
  latlng: L.LatLng,
  radius: number,
  stroke: string,
  fill: string,
  weight: number,
  strokeOpacity: number,
  fillOpacity: number
): L.Circle {
  return L.circle(latlng, {
    radius,
    color: stroke,
    fillColor: fill,
    weight,
    opacity: strokeOpacity,
    fillOpacity,
    interactive: false,
    smoothFactor: 1,
    bubblingMouseEvents: false,
  });
}

// ─── Heatmap helpers ──────────────────────────────────────────────────────────

function mapHasDrawableSize(map: L.Map): boolean {
  const s = map.getSize();
  return s.x >= 2 && s.y >= 2;
}

/** pixel radius of the heat blobs — decreases as you zoom in for more detail */
function heatRadius(zoom: number): number {
  return Math.max(20, 80 - zoom * 4);
}

// ─── Component ────────────────────────────────────────────────────────────────

const HeatmapLayer: React.FC<Props> = ({ towers, zoom, mode = "circles" }) => {
  const map = useMap();

  // Separate refs for each mode's layer group
  const circleGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef   = useRef<L.Layer | null>(null);

  // ── Heatmap data points ───────────────────────────────────────────────────
  const heatPoints = useMemo<[number, number, number][]>(
    () =>
      towers.map((t) => [
        t.position.lat,
        t.position.lng,
        // Weight = signal score. Floor at 0.15 so even weak towers show up.
        Math.max(t.signal, 0.15),
      ]),
    [towers]
  );

  const heatOptions = useMemo(
    () => ({
      radius: heatRadius(zoom),
      blur: Math.max(10, Math.round(heatRadius(zoom) * 1.4)),
      maxZoom: 18,
      minOpacity: 0.30,
      // Signal quality gradient: green → yellow → orange → red
      gradient: {
        0.00: "#166534", // deep green  – very strong
        0.35: "#22C55E", // green       – strong
        0.55: "#FACC15", // yellow      – moderate
        0.72: "#F97316", // orange      – weak
        0.88: "#EF4444", // red         – very weak
        1.00: "#7F1D1D", // deep red    – critical
      },
    }),
    [zoom]
  );

  // ── Remove helpers ────────────────────────────────────────────────────────

  const removeCircleGroup = () => {
    const g = circleGroupRef.current;
    circleGroupRef.current = null;
    if (g) {
      try { map.removeLayer(g); } catch { /* gone */ }
    }
  };

  const removeHeatLayer = () => {
    const h = heatLayerRef.current;
    heatLayerRef.current = null;
    if (h && map.hasLayer(h)) {
      try { map.removeLayer(h); } catch { /* gone */ }
    }
  };

  // ── Circles mode effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "circles") {
      removeCircleGroup();
      return;
    }

    if (!circleGroupRef.current) {
      circleGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = circleGroupRef.current;
    group.clearLayers();

    const oStyle = outerStyle(zoom);
    const iStyle = innerStyle(zoom);

    towers.forEach((tower) => {
      const latlng = L.latLng(tower.position.lat, tower.position.lng);
      const rawRadius = Math.max(tower.radiusMeters ?? 2000, 50);
      const outerRadius = effectiveRadiusMeters(map, latlng, rawRadius);
      const innerRadius = outerRadius * 0.38;
      const { stroke, fill, glow } = providerPalette(tower.provider);

      makeCircle(latlng, outerRadius, stroke, fill, oStyle.weight, oStyle.strokeOpacity, oStyle.fillOpacity).addTo(group);
      makeCircle(latlng, innerRadius, glow,   glow,  iStyle.weight, iStyle.strokeOpacity, iStyle.fillOpacity).addTo(group);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, towers, zoom, mode]);

  // ── Heatmap mode effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "heatmap") {
      removeHeatLayer();
      return;
    }

    let cancelled = false;
    let raf0 = 0;
    let raf1 = 0;

    const sync = () => {
      if (cancelled || !mapHasDrawableSize(map)) return;

      try {
        if (!heatLayerRef.current) {
          // First paint — create the layer
          const layer = (L as typeof L & { heatLayer: typeof L.heatLayer }).heatLayer(
            heatPoints,
            heatOptions
          );
          heatLayerRef.current = layer;
          layer.addTo(map);
          return;
        }

        // Update existing layer
        const layer = heatLayerRef.current as {
          setLatLngs: (p: [number, number, number][]) => void;
          setOptions: (o: typeof heatOptions) => void;
        };
        if (!map.hasLayer(heatLayerRef.current)) {
          removeHeatLayer();
          sync();
          return;
        }
        layer.setLatLngs(heatPoints);
        layer.setOptions(heatOptions);
      } catch {
        removeHeatLayer();
      }
    };

    const schedule = () => {
      if (cancelled) return;
      map.invalidateSize(false);
      if (mapHasDrawableSize(map)) { sync(); return; }
      raf0 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => { if (!cancelled) sync(); });
      });
    };

    map.whenReady(() => { if (!cancelled) schedule(); });
    const onResize = () => { if (!cancelled) schedule(); };
    map.on("resize", onResize);

    return () => {
      cancelled = true;
      map.off("resize", onResize);
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, heatPoints, heatOptions, mode]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      removeCircleGroup();
      removeHeatLayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
};

export default HeatmapLayer;
