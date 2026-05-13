import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { Tower } from "./types";

interface Props {
  towers: Tower[];
  zoom: number;
}

const HeatmapLayer: React.FC<Props> = ({ towers, zoom }) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  // dynamic radius based on zoom
  const radius = useMemo(() => Math.max(18, 60 - zoom * 3), [zoom]);

  // convert towers → heatmap points
  const points = useMemo(
    () =>
      towers.map((tower) => [
        tower.position.lat,
        tower.position.lng,
        Math.max(tower.signal, 0.15),
      ]),
    [towers]
  );

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      layerRef.current = (L as any).heatLayer(points, {
        radius,
        blur: Math.round(radius * 1.2),
        maxZoom: 18,
        minOpacity: 0.25,
        gradient: {
          0.0: "#16A34A",
          0.45: "#FACC15",
          0.7: "#F97316",
          1.0: "#DC2626",
        },
      });

      layerRef.current.addTo(map);
    } else {
      layerRef.current.setLatLngs(points);
      layerRef.current.setOptions({
        radius,
        blur: Math.round(radius * 1.2),
      });
    }
  }, [map, points, radius]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
};

export default HeatmapLayer;