import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L, { type Map as LeafletMap } from 'leaflet';
import FullscreenMap from './FullscreenMap';
import MapControls from './controls/MapControls';
import ProviderFilters from './controls/ProviderFilters';
import type { Provider, SignalRange, Tower } from './types';
import { PROVIDER_COLORS, PROVIDER_FILTER_STYLES } from './ui/providerColors';
import towerData from '../../data/MockCelltowerData.json';
import MapSearchLeaflet, {
  type RouteMetricsFromMap,
} from './search/MapSearchLeaflet';
import HeatmapLayer from './HeatmapLayer';
import { getNearbyTowers } from '../../libs/api';

export type { RouteMetricsFromMap };

// ─── Types ────────────────────────────────────────────────────────────────────

type MapType = 'roadmap' | 'satellite' | 'terrain';

interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  province: string;
}

interface Props {
  onLocationChange?: (info: LocationInfo) => void;
  initialOriginText?: string;
  initialDestinationText?: string;
  onRouteMetrics?: (metrics: RouteMetricsFromMap | null) => void;
  onRouteCoordinates?: (coords: {originLat: number; originLng: number; originName: string; destLat: number; destLng: number; destName: string} | null) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CENTER = { lat: 13.7565, lng: 121.0583 };


const SIGNAL_FILTER_STYLES: Record<SignalRange, { active: string; inactive: string }> = {
  All: { active: 'bg-[#2B67EB] text-white border-[#2B67EB]', inactive: 'bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300' },
  Strong: { active: 'bg-[#16A34A] text-white border-[#16A34A]', inactive: 'bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300' },
  Moderate: { active: 'bg-[#F59E0B] text-white border-[#F59E0B]', inactive: 'bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300' },
  Weak: { active: 'bg-[#DC2626] text-white border-[#DC2626]', inactive: 'bg-white/90 text-gray-700 border-gray-200 hover:border-gray-300' },
};

type TowerData = {
  id: string;
  provider: Exclude<Provider, 'All'>;
  lat: number;
  lng: number;
  signal: number;
  radiusMeters: number;
};

const TOWER_DATA = towerData as TowerData[];

const MOCK_TOWERS: Tower[] = TOWER_DATA.map((tower) => ({
  id: tower.id,
  provider: tower.provider,
  position: { lat: tower.lat, lng: tower.lng },
  signal: tower.signal,
  radiusMeters: tower.radiusMeters,
}));

const TILE_LAYERS: Record<MapType, { url: string; attribution: string; maxZoom?: number }> = {
  roadmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxZoom: 17,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const MapEvents: React.FC<{
  mapRef: React.MutableRefObject<LeafletMap | null>;
  onZoomChange: (zoom: number) => void;
  onMapClick: () => void;
  onReady: (map: LeafletMap) => void;
  onMoveEnd: (map: LeafletMap) => void;
}> = ({ mapRef, onZoomChange, onMapClick, onReady, onMoveEnd }) => {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    onReady(map);
  }, [map, mapRef, onReady]);

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
      onMoveEnd(map);
    },
    moveend: () => onMoveEnd(map),
    click: () => onMapClick(),
  });

  return null;
};

// Sits inside MapContainer — watches the container element for any size change
// and immediately tells Leaflet to re-tile. Works for fullscreen, window resize, etc.
const MapResizer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

const MapComponent: React.FC<Props> = ({
  onLocationChange,
  initialOriginText,
  initialDestinationText,
  onRouteMetrics,
  onRouteCoordinates,
}) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedProvider, setProvider] = useState<Provider>('All');
  const [signalRange, setSignalRange] = useState<SignalRange>('All');
  const [mapType, setMapType] = useState<MapType>('roadmap');
  const [showLayers, setShowLayers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(12);

  // ── Live towers from API ──────────────────────────────────────────────────
  type LiveTower = {
    id: string;
    provider: string;
    lat: number;
    lng: number;
    signal_strength?: number;
    distance_km?: number;
  };
  const [liveTowers, setLiveTowers] = useState<LiveTower[]>([]);
  const liveFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLiveTowers = useCallback(async (lat: number, lng: number, zoom: number) => {
    // Only fetch when zoomed in enough to be useful
    if (zoom < 11) return;
    try {
      const radius = zoom >= 14 ? 2 : zoom >= 12 ? 5 : 10;
      const result = await getNearbyTowers(lat, lng, radius, 200);
      setLiveTowers(result.towers.map(t => ({
        id: String(t.id),
        provider: t.provider,
        lat: t.latitude,
        lng: t.longitude,
        signal_strength: t.signal_strength,
        distance_km: t.distance_km,
      })));
    } catch {
      // Silently ignore — backend may not be running
    }
  }, []);

  // Initial live fetch on mount
  useEffect(() => {
    fetchLiveTowers(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, 12);
  }, [fetchLiveTowers]);

  const handleMapMoveEnd = useCallback((map: LeafletMap) => {
    if (liveFetchTimer.current) clearTimeout(liveFetchTimer.current);
    liveFetchTimer.current = setTimeout(() => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      fetchLiveTowers(center.lat, center.lng, zoom);
    }, 600);
  }, [fetchLiveTowers]);

  // ── Geolocation ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);

        // Reverse geocode using Nominatim (free, no key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.municipality || 'Unknown';
          const province = data.address?.state || 'Unknown';
          onLocationChange?.({ ...loc, city, province });
        } catch {
          onLocationChange?.({ ...loc, city: 'Current Location', province: '' });
        }
      },
      () => {
        // Fallback: Batangas City
        onLocationChange?.({ ...DEFAULT_CENTER, city: 'Batangas City', province: 'Batangas, Calabarzon' });
      }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recenter = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView(userLocation, 13, { animate: true });
    }
  };

  const matchesSignalRange = (tower: Tower) => {
    if (signalRange === 'All') return true;
    if (signalRange === 'Strong') return tower.signal > 0.7;
    if (signalRange === 'Moderate') return tower.signal > 0.45 && tower.signal <= 0.7;
    return tower.signal <= 0.45;
  };

  // Prefer live API towers; fall back to empty array (no misleading mock pins)
  const baseTowers: Tower[] = liveTowers.length > 0
    ? liveTowers.map(t => ({
        id: t.id,
        provider: (t.provider as Exclude<Provider, 'All'>) in PROVIDER_COLORS
          ? (t.provider as Exclude<Provider, 'All'>)
          : 'Globe' as const,
        position: { lat: t.lat, lng: t.lng },
        signal: typeof t.signal_strength === 'number'
          ? Math.min(1, Math.max(0, t.signal_strength / 100))
          : 0.5,
        radiusMeters: 500,
      }))
    : [];

  const filteredTowers = baseTowers.filter(
    (tower) => (selectedProvider === 'All' || tower.provider === selectedProvider)
      && matchesSignalRange(tower)
  );

  const visibleTowers = useMemo(
    () => pickDenseTowers(filteredTowers, mapZoom),
    [filteredTowers, mapZoom]
  );

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(mapCenter, mapRef.current.getZoom() ?? 12, { animate: true });
  }, [mapCenter]);

  const tileLayer = TILE_LAYERS[mapType];

    const towerIcons = useMemo(() => {
      return Object.fromEntries(
        Object.entries(PROVIDER_COLORS).map(([provider, colors]) => {
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${colors.solid}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.9 19.1a11 11 0 0 1 0-14.2"/>
              <path d="M7.8 16.2a7 7 0 0 1 0-8.4"/>
              <path d="M16.2 7.8a7 7 0 0 1 0 8.4"/>
              <path d="M19.1 4.9a11 11 0 0 1 0 14.2"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M12 14v7"/>
            </svg>
          `;

          return [
            provider,
            L.divIcon({
              className: '',
              html: `
                <div style="width:28px;height:28px;border-radius:9999px;border:2px solid ${colors.solid};background:${colors.light};box-shadow:0 0 10px ${colors.solid}55;display:flex;align-items:center;justify-content:center;">
                  ${svg}
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            }),
          ];
        })
      ) as Record<Exclude<Provider, 'All'>, L.DivIcon>;
    }, []);

  return (
    <FullscreenMap>
      {({ isFullscreen, mapContainerStyle, toggleFullscreen }) => (
        <div className="relative">
          {/* ── Top-right controls ───────────────────────────────────────────── */}
          <MapControls
            mapType={mapType}
            onMapTypeChange={(type) => {
              setMapType(type);
              setShowTypeMenu(false);
            }}
            showMapTypeMenu={showTypeMenu}
            onToggleMapTypeMenu={() => setShowTypeMenu((value) => !value)}
            showLayers={showLayers}
            onToggleLayers={() => setShowLayers((value) => !value)}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap((value) => !value)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onRecenter={recenter}
            canRecenter={Boolean(userLocation)}
          />

          <MapSearchLeaflet
            map={mapInstance}
            origin={userLocation}
            initialOriginText={initialOriginText}
            initialDestinationText={initialDestinationText}
            isFullscreen={isFullscreen}
            onRouteMetrics={onRouteMetrics}
            onRouteCoordinates={onRouteCoordinates}
          />

          {/* ── Map ──────────────────────────────────────────────────────────── */}
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={mapZoom}
            style={{
              width: '100%',
              ...mapContainerStyle,
            }}
            zoomControl={false}
            className="z-0 w-full"
          >
            <MapResizer />
            <TileLayer
              url={tileLayer.url}
              attribution={tileLayer.attribution}
              maxZoom={tileLayer.maxZoom}
            />
            <MapEvents
              mapRef={mapRef}
              onZoomChange={setMapZoom}
              onMapClick={() => setShowTypeMenu(false)}
              onReady={setMapInstance}
              onMoveEnd={handleMapMoveEnd}
            />

            {/* Heatmap + tower icons */}
            {showLayers && showHeatmap && (
              <HeatmapLayer towers={filteredTowers} zoom={mapZoom} />
            )}
            {showLayers && visibleTowers.map((tower) => {
              const isHovered = hoveredTowerId === tower.id;

              return (
                <React.Fragment key={tower.id}>
                  {showLayers && !showHeatmap && (
                    <Circle
                      center={[tower.position.lat, tower.position.lng]}
                      radius={tower.radiusMeters}
                      pathOptions={{
                        color: tower.signal > 0.7
                          ? '#16A34A'
                          : tower.signal > 0.45
                            ? '#FACC15'
                            : tower.signal > 0.25
                              ? '#F97316'
                              : '#DC2626',
                        fillColor: tower.signal > 0.7
                          ? '#16A34A'
                          : tower.signal > 0.45
                            ? '#FACC15'
                            : tower.signal > 0.25
                              ? '#F97316'
                              : '#DC2626',
                        fillOpacity: 0.16,
                        opacity: 0.6,
                        weight: isHovered ? 2 : 1,
                      }}
                    />
                  )}
                  <Marker
                    position={[tower.position.lat, tower.position.lng]}
                    icon={towerIcons[tower.provider]}
                    eventHandlers={{
                      mouseover: () => setHoveredTowerId(tower.id),
                      mouseout: () => setHoveredTowerId(null),
                    }}
                  >
                    {isHovered && (
                      <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                        {tower.provider} · {Math.round(tower.signal * 100)}%
                      </Tooltip>
                    )}
                  </Marker>
                </React.Fragment>
              );
            })}

            {/* User location */}
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={250}
                  pathOptions={{
                    color: '#1D4ED8',
                    fillColor: '#93C5FD',
                    fillOpacity: 0.18,
                    opacity: 0.6,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#1D4ED8',
                    fillColor: '#BFDBFE',
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                    Current location
                  </Tooltip>
                </CircleMarker>
              </>
            )}

            {/* ── Live API tower pins ──────────────────────────────────── */}
            {showLayers && liveTowers
              .filter(t =>
                selectedProvider === 'All' || t.provider === selectedProvider
              )
              .map(tower => {
                const providerKey = tower.provider as Exclude<Provider, 'All'>;
                const colors = PROVIDER_COLORS[providerKey] ?? {
                  solid: '#16A34A', light: '#dcfce7',
                };
                const icon = L.divIcon({
                  className: '',
                  html: `
                    <div style="
                      width:32px;height:32px;border-radius:9999px;
                      border:2.5px solid ${colors.solid};
                      background:${colors.light};
                      box-shadow:0 0 0 4px ${colors.solid}33, 0 0 14px ${colors.solid}55;
                      display:flex;align-items:center;justify-content:center;
                    ">
                      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
                        stroke='${colors.solid}' stroke-width='2.2'
                        stroke-linecap='round' stroke-linejoin='round'
                        width='18' height='18'>
                        <path d='M4.9 19.1a11 11 0 0 1 0-14.2'/>
                        <path d='M7.8 16.2a7 7 0 0 1 0-8.4'/>
                        <path d='M16.2 7.8a7 7 0 0 1 0 8.4'/>
                        <path d='M19.1 4.9a11 11 0 0 1 0 14.2'/>
                        <circle cx='12' cy='12' r='2'/>
                        <path d='M12 14v7'/>
                      </svg>
                    </div>
                  `,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                });
                const distText = tower.distance_km != null
                  ? `${(tower.distance_km * 1000).toFixed(0)} m away`
                  : '';
                return (
                  <Marker
                    key={`live-${tower.id}`}
                    position={[tower.lat, tower.lng]}
                    icon={icon}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                      📡 {tower.provider} · Live tower{distText ? ` · ${distText}` : ''}
                    </Tooltip>
                  </Marker>
                );
              })
            }
          </MapContainer>

          {/* ── Provider Filter ───────────────────────────────────────────────── */}
          <ProviderFilters
            selectedProvider={selectedProvider}
            onProviderChange={setProvider}
            signalRange={signalRange}
            onSignalRangeChange={setSignalRange}
            providerStyles={PROVIDER_FILTER_STYLES}
            signalStyles={SIGNAL_FILTER_STYLES}
          />
        </div>
      )}
    </FullscreenMap>
  );
};

export default MapComponent;