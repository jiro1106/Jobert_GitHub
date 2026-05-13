import { useEffect, useMemo, useRef } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { Provider, Tower } from "./types";
import { PROVIDER_HEATMAP_COLORS } from "./ui/providerColors";

type Props = {
  map: google.maps.Map | null;
  towers: Tower[];
  zoom: number;
};

/**
 * REAL WORLD FIXED COVERAGE RADIUS (meters)
 * This is your "real life size"
 */
const TOWER_RADIUS_METERS = 2500;

/**
 * Signal weight
 */
const getWeight = (signal: number) =>
  Math.max(signal * 100, 1);

/**
 * Convert meters → pixels using map projection
 * Ensures geographic correctness
 */
const metersToPixels = (
  meters: number,
  lat: number,
  zoom: number
) => {
  const earthCircumference = 40075016.686;

  const metersPerPixel =
    (earthCircumference *
      Math.cos((lat * Math.PI) / 180)) /
    Math.pow(2, zoom + 8);

  return meters / metersPerPixel;
};



const SignalHeatmap = ({
  map,
  towers,
  zoom,
}: Props) => {
  const overlayRef =
    useRef<GoogleMapsOverlay | null>(null);

  /**
   * group by provider
   */
  const groupedByProvider = useMemo(() => {
    return towers.reduce<Record<string, Tower[]>>(
      (acc, tower) => {
        if (!acc[tower.provider]) {
          acc[tower.provider] = [];
        }
        acc[tower.provider].push(tower);
        return acc;
      },
      {}
    );
  }, [towers]);

  /**
   * FIXED RADIUS LOGIC (REAL WORLD CONSISTENT)
   * - same physical coverage regardless of zoom logic
   * - only projection changes visual size
   */
  const radiusPixels = useMemo(() => {
    if (!map) return 40;

    const zoomLevel = zoom ?? 6;

    const avgLat =
      towers.length > 0
        ? towers.reduce(
            (sum, t) => sum + t.position.lat,
            0
          ) / towers.length
        : 13.7;

    return metersToPixels(
      TOWER_RADIUS_METERS,
      avgLat,
      zoomLevel
    );
  }, [map, towers, zoom]);

  /**
   * build heatmap layers
   */
  const layers = useMemo(() => {
    return (
      Object.entries(groupedByProvider) as Array<
        [Exclude<Provider, "All">, Tower[]]
      >
    ).map(([provider, providerTowers]) => {
      return new HeatmapLayer({
        id: `signal-heatmap-${provider}`,

        data: providerTowers,

        getPosition: (t: Tower) => [
          t.position.lng,
          t.position.lat,
        ],

        getWeight: (t: Tower) =>
          getWeight(t.signal),

        radiusPixels, // FIXED WORLD-BASED RADIUS

        intensity: 1.1,

        threshold: 0.03,

        aggregation: "SUM",

        colorRange:
          PROVIDER_HEATMAP_COLORS[provider],
      });
    });
  }, [groupedByProvider, radiusPixels]);

  /**
   * mount / update overlay
   */
  useEffect(() => {
    if (!map) return;

    if (!overlayRef.current) {
      overlayRef.current =
        new GoogleMapsOverlay({ layers });

      overlayRef.current.setMap(map);
      return;
    }

    overlayRef.current.setProps({ layers });
  }, [map, layers]);

  /**
   * cleanup
   */
  useEffect(() => {
    return () => {
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
    };
  }, []);

  return null;
};

export default SignalHeatmap;