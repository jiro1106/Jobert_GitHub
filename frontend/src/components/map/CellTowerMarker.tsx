import React, { Fragment, useMemo } from "react";
import { OverlayView } from "@react-google-maps/api";
import { RadioTower } from "lucide-react";
import type { Tower } from "./types";
import type { ProviderColors } from "./ui/providerColors";

type Props = {
  towers: Tower[];
  hoveredTowerId: string | null;
  onHoverChange: (id: string | null) => void;
  providerColors: ProviderColors;
  zoom: number;
};

const MARKER_SIZE = 28;

const getOffset = () => ({
  x: -(MARKER_SIZE / 2),
  y: -(MARKER_SIZE / 2),
});

const getGridSizeDegrees = (zoom: number) => {
  const base = 0.12;
  const scale = Math.pow(2, 12 - zoom);
  return Math.max(base * scale, 0.005);
};

const pickDenseTowers = (towers: Tower[], zoom: number) => {
  if (zoom >= 12) return towers;

  const cellSize = getGridSizeDegrees(zoom);
  const buckets = new Map<string, Tower>();

  towers.forEach((tower) => {
    const latIndex = Math.floor(tower.position.lat / cellSize);
    const lngIndex = Math.floor(tower.position.lng / cellSize);
    const key = `${latIndex}:${lngIndex}`;

    const existing = buckets.get(key);
    if (!existing || tower.signal > existing.signal) {
      buckets.set(key, tower);
    }
  });

  return Array.from(buckets.values());
};

const CellTowerMarker: React.FC<Props> = ({
  towers,
  hoveredTowerId,
  onHoverChange,
  providerColors,
  zoom,
}) => {
  // PERFORMANCE: hide markers when zoomed out
  if (zoom < 8) return null;

  const visibleTowers = useMemo(
    () => pickDenseTowers(towers, zoom),
    [towers, zoom]
  );

  return (
    <>
      {visibleTowers.map((tower) => {
        const isHovered = hoveredTowerId === tower.id;

        const colors =
          providerColors[tower.provider];

        return (
          <Fragment key={tower.id}>
            <OverlayView
              position={tower.position}
              mapPaneName={
                OverlayView.OVERLAY_MOUSE_TARGET
              }
              getPixelPositionOffset={getOffset}
            >
              <div
                onMouseEnter={() =>
                  onHoverChange(tower.id)
                }
                onMouseLeave={() =>
                  onHoverChange(null)
                }
                className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-125"
                style={{
                  backgroundColor: colors.light,
                  borderColor: colors.solid,

                  // soft glow instead of circles
                  boxShadow: isHovered
                    ? `0 0 25px ${colors.solid}`
                    : `0 0 10px ${colors.solid}55`,
                }}
              >
                <RadioTower
                  size={13}
                  color={colors.solid}
                />

                {/* tooltip */}
                {isHovered && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white shadow-lg">
                    {tower.provider} ·{" "}
                    {Math.round(tower.signal * 100)}%
                  </div>
                )}
              </div>
            </OverlayView>
          </Fragment>
        );
      })}
    </>
  );
};

export default CellTowerMarker;