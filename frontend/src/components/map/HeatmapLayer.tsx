import { useEffect, useMemo, useRef } from "react";
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

const HeatmapLayer: React.FC<Props> = ({ towers, zoom }) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  const radius = useMemo(() => Math.max(18, 60 - zoom * 3), [zoom]);

  const points = useMemo(
    () =>
      towers.map((tower) => [
        tower.position.lat,
        tower.position.lng,
        Math.max(tower.signal, 0.15),
      ]) as [number, number, number][],
    [towers]
  );

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

      try {
        if (!layerRef.current) {
          const layer = (L as typeof L & { heatLayer: typeof L.heatLayer }).heatLayer(
            points,
            heatOptions
          );
          layerRef.current = layer;
          layer.addTo(map);
          return;
        }

        const layer = layerRef.current as {
          setLatLngs: (p: typeof points) => void;
          setOptions: (o: typeof heatOptions) => void;
        };
        if (!map.hasLayer(layerRef.current)) {
          removeLayer();
          sync();
          return;
        }
        layer.setLatLngs(points);
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
  }, [map, points, heatOptions]);

  return null;
};

export default HeatmapLayer;
