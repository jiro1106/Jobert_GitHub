/**
 * Heatmap for OpenCellID-backed towers returned by the API.
 *
 * Data path: `GET /api/towers/nearby` → `TowerResponse` with `canonical_provider`
 * resolved server-side via `normalize_provider_name` / `MCC_MNC_TO_PROVIDER` in
 * `backend/services/tower_matching_service.py`. Parent (`MapComponent`) maps
 * those rows to `Tower[]` and passes them here as `towers`.
 */
import { useEffect, useMemo, useRef, type FC } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { Tower } from "./types";

interface Props {
  towers: Tower[];
  zoom: number;
}

function mapHasDrawableSize(map: L.Map): boolean {
  const s = map.getSize();
  return s.x >= 2 && s.y >= 2;
}

/** leaflet.heat extends L at runtime; types are not shipped on `L`. */
function createHeatLayer(
  latlngs: [number, number, number][],
  options: Record<string, unknown>
): L.Layer {
  const heatFactory = (L as unknown as { heatLayer: (pts: typeof latlngs, opts: object) => L.Layer }).heatLayer;
  return heatFactory(latlngs, options);
}

function towersToHeatPoints(towers: Tower[]): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const tower of towers) {
    const lat = tower.position.lat;
    const lng = tower.position.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const w = tower.signal;
    const intensity = Number.isFinite(w) ? Math.max(0.15, Math.min(1, w)) : 0.15;
    out.push([lat, lng, intensity]);
  }
  return out;
}

const HeatmapLayer: FC<Props> = ({ towers, zoom }) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  const radius = useMemo(() => Math.max(18, 60 - zoom * 3), [zoom]);

  const heatPoints = useMemo(() => towersToHeatPoints(towers), [towers]);

  const heatOptions = useMemo(
    () => ({
      radius,
      blur: Math.max(1, Math.round(radius * 1.2)),
      maxZoom: 18,
      minOpacity: 0.25,
      gradient: {
        0.0: "#16A34A",
        0.45: "#FACC15",
        0.7: "#F97316",
        1.0: "#DC2626",
      },
    }),
    [radius]
  );

  useEffect(() => {
    let cancelled = false;
    let raf0 = 0;
    let raf1 = 0;

    const removeLayer = () => {
      const layer = layerRef.current;
      layerRef.current = null;
      if (!layer || !map.hasLayer(layer)) return;
      try {
        map.removeLayer(layer);
      } catch {
        /* layer may already be detached */
      }
    };

    const sync = () => {
      if (cancelled || !mapHasDrawableSize(map)) return;

      if (heatPoints.length === 0) {
        removeLayer();
        return;
      }

      try {
        if (!layerRef.current) {
          const layer = createHeatLayer(heatPoints, heatOptions);
          layerRef.current = layer;
          layer.addTo(map);
          return;
        }

        const layer = layerRef.current as unknown as {
          setLatLngs: (p: [number, number, number][]) => void;
          setOptions: (o: typeof heatOptions) => void;
        };
        if (!map.hasLayer(layerRef.current)) {
          removeLayer();
          sync();
          return;
        }
        layer.setLatLngs(heatPoints);
        layer.setOptions(heatOptions);
      } catch {
        removeLayer();
      }
    };

    const schedule = () => {
      if (cancelled) return;
      map.invalidateSize(false);
      if (mapHasDrawableSize(map)) {
        sync();
        return;
      }
      raf0 = requestAnimationFrame(() => {
        raf1 = requestAnimationFrame(() => {
          if (!cancelled) sync();
        });
      });
    };

    const onResize = () => {
      if (!cancelled) schedule();
    };

    map.whenReady(() => {
      if (cancelled) return;
      schedule();
    });

    map.on("resize", onResize);

    return () => {
      cancelled = true;
      map.off("resize", onResize);
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
      removeLayer();
    };
  }, [map, heatPoints, heatOptions]);

  return null;
};

export default HeatmapLayer;
