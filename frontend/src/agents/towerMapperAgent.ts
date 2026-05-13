const PROVIDER_COLORS: Record<string, string> = {
  Globe: "#2563eb",
  Smart: "#16a34a",
  DITO: "#f97316",
  Unknown: "#6b7280",
};

export type TowerMapOutput = {
  map_layers: {
    tower_markers: any[];
    tower_radius_circles: any[];
    route_points: any[];
    weak_segments: any[];
  };
};

function dedupeTowersForMap(closestTowers: any[]) {
  const unique = new Map<number, any>();

  for (const tower of closestTowers) {
    const towerId = tower.tower_id;
    if (!towerId) continue;

    const existing = unique.get(towerId);

    if (!existing || tower.distance_meters < existing.distance_meters) {
      unique.set(towerId, tower);
    }
  }

  return Array.from(unique.values());
}

export class TowerMapperAgent {
  run(analysisResult: any): TowerMapOutput {
    const closestTowers = analysisResult?.closest_towers || [];
    const uniqueTowers = dedupeTowersForMap(closestTowers);

    const towerMarkers = uniqueTowers.map((tower: any) => {
      const provider = tower.provider_name || "Unknown";

      return {
        tower_id: tower.tower_id,
        provider_name: provider,
        radio: tower.radio,
        net: tower.net,
        latitude: tower.tower_latitude,
        longitude: tower.tower_longitude,
        distance_meters: tower.distance_meters,
        signal_score: tower.signal_score,
        is_within_estimated_range: tower.is_within_estimated_range,
        color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.Unknown,
      };
    });

    const towerRadiusCircles = uniqueTowers.map((tower: any) => {
      const provider = tower.provider_name || "Unknown";
      const actualRange = tower.tower_range_meters;

      return {
        tower_id: tower.tower_id,
        provider_name: provider,
        latitude: tower.tower_latitude,
        longitude: tower.tower_longitude,
        radius_meters: actualRange || 1000,
        range_source: actualRange ? "opencellid" : "fallback_display_radius",
        color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.Unknown,
      };
    });

    return {
      map_layers: {
        tower_markers: towerMarkers,
        tower_radius_circles: towerRadiusCircles,
        route_points: analysisResult?.route_points || [],
        weak_segments: analysisResult?.weak_segments || [],
      },
    };
  }
}