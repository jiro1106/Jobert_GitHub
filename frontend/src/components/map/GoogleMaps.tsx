import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, OverlayView } from '@react-google-maps/api';
import { RadioTower } from 'lucide-react';
import CellTowerMapLayer from './CellTowerMarker';
import MapControls from './controls/MapControls';
import ProviderFilters from './controls/ProviderFilters';
import type { Provider, SignalRange, Tower } from './types';
import { PROVIDER_COLORS, PROVIDER_FILTER_STYLES } from './ui/providerColors';
import towerData from '../../data/MockCelltowerData.json';
import SignalLegend from './ui/SignalLegend';
import SignalHeatmap from './SignalHeatmap';
import MapSearch from './search/MapSearch';

// ─── Types ────────────────────────────────────────────────────────────────────

type MapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  province: string;
}

interface Props {
  onLocationChange?: (info: LocationInfo) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Must be stable reference – defined outside component
const LIBRARIES: ("visualization" | "places")[] = ["visualization", "places"];

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

// Clean map style for roadmap mode
const ROAD_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'all',      elementType: 'labels.text.fill',   stylers: [{ color: '#475569' }] },
  { featureType: 'water',    elementType: 'geometry',            stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'landscape',elementType: 'geometry',            stylers: [{ color: '#F1F5F9' }] },
  { featureType: 'road',     elementType: 'geometry',            stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road',     elementType: 'geometry.stroke',     stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'poi',      elementType: 'geometry',            stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'transit',  elementType: 'geometry',            stylers: [{ color: '#E2E8F0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#93C5FD' }] },
];



// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPixelCenter = (width: number, height: number) => ({
  x: -(width / 2),
  y: -(height / 2),
});

// ─── Component ────────────────────────────────────────────────────────────────

const GoogleMaps: React.FC<Props> = ({ onLocationChange }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: LIBRARIES,
  });

  const [mapRef, setMapRef]                 = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation]     = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter]           = useState(DEFAULT_CENTER);
  const [selectedProvider, setProvider]     = useState<Provider>('All');
  const [signalRange, setSignalRange]       = useState<SignalRange>('All');
  const [mapType, setMapType]               = useState<MapType>('roadmap');
  const [showLayers, setShowLayers]         = useState(true);
  const [showTypeMenu, setShowTypeMenu]     = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);
  const [mapZoom, setMapZoom]               = useState(12);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

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
          const city     = data.address?.city || data.address?.town || data.address?.municipality || 'Unknown';
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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
    setMapZoom(map.getZoom() ?? 12);
  }, []);

  const recenter = () => {
    if (mapRef && userLocation) {
      mapRef.panTo(userLocation);
      mapRef.setZoom(13);
    }
  };

  const matchesSignalRange = (tower: Tower) => {
    if (signalRange === 'All') return true;
    if (signalRange === 'Strong') return tower.signal > 0.7;
    if (signalRange === 'Moderate') return tower.signal > 0.45 && tower.signal <= 0.7;
    return tower.signal <= 0.45;
  };

  const filteredTowers = MOCK_TOWERS.filter(
    (tower) => (selectedProvider === 'All' || tower.provider === selectedProvider)
      && matchesSignalRange(tower)
  );

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loadError) return (
    <div className="w-full h-125 bg-red-50 rounded-xl flex items-center justify-center text-red-500 text-sm font-medium">
      Failed to load Google Maps
    </div>
  );

  if (!isLoaded) return (
    <div className="w-full h-125 bg-[#EFF6FF] rounded-xl flex items-center justify-center gap-2">
      <div className="w-2 h-2 bg-[#2B67EB] rounded-full animate-bounce [animation-delay:0ms]" />
      <div className="w-2 h-2 bg-[#2B67EB] rounded-full animate-bounce [animation-delay:150ms]" />
      <div className="w-2 h-2 bg-[#2B67EB] rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );

  const mapContainerStyle = {
    width: '100%',
    height: isFullscreen ? '100%' : '500px',
  };

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'relative'}>
      <div
        className={`relative overflow-hidden shadow-md transition-all duration-300 ${
          isFullscreen
            ? 'h-full w-full rounded-none bg-white'
            : 'rounded-xl border border-gray-100'
        }`}
      >
      {/* ── Signal Legend ────────────────────────────────────────────────── */}
        <SignalLegend />
        <MapSearch map={mapRef} />
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((value) => !value)}
        onRecenter={recenter}
        canRecenter={Boolean(userLocation)}
      />

      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={12}
        mapTypeId={mapType}
        onLoad={onMapLoad}
        onZoomChanged={() => {
          if (mapRef) {
            setMapZoom(mapRef.getZoom() ?? 12);
          }
        }}
        onClick={() => setShowTypeMenu(false)}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          styles: mapType === 'roadmap' ? ROAD_MAP_STYLES : undefined,
        }}
      >
        {showLayers && mapRef && (
          <SignalHeatmap
            map={mapRef}
            towers={filteredTowers}
            zoom={mapZoom}
          />
        )}
        {/* Heatmap rings + tower icons */}
        {showLayers && (
          <CellTowerMapLayer 
            towers={filteredTowers} 
            hoveredTowerId={hoveredTowerId} 
            onHoverChange={setHoveredTowerId} 
            providerColors={PROVIDER_COLORS} 
            zoom={mapZoom} 
          />
        )}

        {/* User location pulse */}
        {userLocation && (
          <OverlayView
            position={userLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={getPixelCenter}
          >
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
              <div className="absolute inset-1 bg-blue-400/20 rounded-full" />
              <div className="w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-lg relative z-10" />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* ── Provider Filter ───────────────────────────────────────────────── */}
      <ProviderFilters
        selectedProvider={selectedProvider}
        onProviderChange={setProvider}
        signalRange={signalRange}
        onSignalRangeChange={setSignalRange}
        providerStyles={PROVIDER_FILTER_STYLES}
        signalStyles={SIGNAL_FILTER_STYLES}
      />

      {/* ── Tower count badge ─────────────────────────────────────────────── */}
      {showLayers && (
        <div className="absolute bottom-4 right-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-gray-100 flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
          <RadioTower size={11} className="text-gray-400" />
          {filteredTowers.length} tower{filteredTowers.length !== 1 ? 's' : ''}
        </div>
      )}
      </div>
    </div>
  );
};

export default GoogleMaps;