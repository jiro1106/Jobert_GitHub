import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Search } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';

type LatLng = {
  lat: number;
  lng: number;
};

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type OriginMode = 'current' | 'typed' | 'pinned';
type DestinationMode = 'typed' | 'pinned';

type Props = {
  map: LeafletMap | null;
  origin?: LatLng | null;
  initialOriginText?: string;
  initialDestinationText?: string;
  isFullscreen?: boolean;
};

const MapSearchLeaflet: React.FC<Props> = ({
  map,
  origin,
  initialOriginText,
  initialDestinationText,
  isFullscreen = false,
}) => {
  const routingRef = useRef<any>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const destinationDebounceRef = useRef<number | null>(null);
  const destinationAbortRef = useRef<AbortController | null>(null);
  const originDebounceRef = useRef<number | null>(null);
  const originAbortRef = useRef<AbortController | null>(null);
  const initialAppliedRef = useRef(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [originMode, setOriginMode] = useState<OriginMode>('current');
  const [originLocation, setOriginLocation] = useState<LatLng | null>(null);
  const [originQuery, setOriginQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
  const [originText, setOriginText] = useState('Current location');
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('typed');
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [destinationText, setDestinationText] = useState('');
  const geocodeLocation = async (value: string) => {
    const params = new URLSearchParams({
      q: value,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: 'ph',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      label: String(data[0].display_name ?? value),
    };
  };

  useEffect(() => {
    if (!map || initialAppliedRef.current) return;
    if (!initialOriginText && !initialDestinationText) return;

    initialAppliedRef.current = true;

    const applyInitial = async () => {
      if (initialOriginText) {
        setOriginMode('typed');
        setOriginText(initialOriginText);
        const result = await geocodeLocation(initialOriginText);
        if (result) {
          setOriginLocation({ lat: result.lat, lng: result.lng });
          setOriginText(result.label);
        }
      }

      if (initialDestinationText) {
        setDestinationMode('typed');
        setDestinationText(initialDestinationText);
        const result = await geocodeLocation(initialDestinationText);
        if (result) {
          setDestination({ lat: result.lat, lng: result.lng });
          setDestinationText(result.label);
          map.setView([result.lat, result.lng], Math.max(map.getZoom(), 12));
        }
      }
    };

    void applyInitial();
  }, [map, initialOriginText, initialDestinationText]);

  const destinationIcon = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5">
        <path d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 4.7 5.1 10.3 6.1 11.4a.6.6 0 0 0 .8 0c1-1.1 6.1-6.7 6.1-11.4 0-3.6-2.9-6.5-6.5-6.5Z"/>
        <circle cx="12" cy="9" r="2.7" fill="#FEE2E2"/>
      </svg>
    `;
    return L.icon({
      iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 22],
    });
  }, []);

  const effectiveOrigin = useMemo<LatLng | null>(() => {
    if (originMode === 'current') {
      if (origin) return origin;
      if (!map) return null;
      const center = map.getCenter();
      return { lat: center.lat, lng: center.lng };
    }

    return originLocation;
  }, [map, origin, originLocation, originMode]);

  useEffect(() => {
    if (originMode === 'current') {
      setOriginLocation(null);
      setOriginText('Current location');
      setOriginQuery('');
      setOriginSuggestions([]);
      return;
    }

    if (originMode === 'typed') {
      setOriginLocation(null);
      setOriginText('');
      setOriginQuery('');
      setOriginSuggestions([]);
      return;
    }

    setOriginLocation(null);
    setOriginText('Click map to pin start');
    setOriginQuery('');
    setOriginSuggestions([]);
  }, [originMode]);

  useEffect(() => {
    if (destinationMode === 'typed') {
      setDestinationText('');
      return;
    }

    setDestinationText('Click map to pin destination');
    setQuery('');
    setSuggestions([]);
  }, [destinationMode]);

  useEffect(() => {
    if (!map) return;
    if (!routingRef.current) {
      const routing = (L as any).Routing;
      routingRef.current = routing.control({
        waypoints: [],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
        lineOptions: {
          styles: [
            { color: '#2563EB', weight: 5, opacity: 0.9 },
          ],
        },
      }).addTo(map);
    }

    const handleClick = (event: L.LeafletMouseEvent) => {
      const picked = { lat: event.latlng.lat, lng: event.latlng.lng };

      if (originMode === 'pinned') {
        setOriginLocation(picked);
        setOriginText('Pinned location');
        setOriginQuery('');
        setOriginSuggestions([]);
        return;
      }

      if (destinationMode === 'pinned') {
        setDestination(picked);
        setDestinationText('Pinned location');
        setQuery('');
        setSuggestions([]);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      if (routingRef.current) {
        map.removeControl(routingRef.current);
        routingRef.current = null;
      }
    };
  }, [map, originMode, destinationMode]);

  useEffect(() => {
    if (!routingRef.current) return;
    if (!destination || !effectiveOrigin) return;

    routingRef.current.setWaypoints([
      L.latLng(effectiveOrigin.lat, effectiveOrigin.lng),
      L.latLng(destination.lat, destination.lng),
    ]);
  }, [destination, effectiveOrigin]);

  useEffect(() => {
    if (!map) return;

    if (!destination) {
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
      return;
    }

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(
        [destination.lat, destination.lng],
        { icon: destinationIcon }
      ).addTo(map);
      return;
    }

    destinationMarkerRef.current.setLatLng([
      destination.lat,
      destination.lng,
    ]);
  }, [destination, map]);

  useEffect(() => {
    if (destinationDebounceRef.current) {
      window.clearTimeout(destinationDebounceRef.current);
    }

    if (destinationAbortRef.current) {
      destinationAbortRef.current.abort();
      destinationAbortRef.current = null;
    }

    const trimmed = query.trim();
    if (destinationMode !== 'typed' || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    destinationDebounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      destinationAbortRef.current = controller;

      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: 'json',
          addressdetails: '1',
          limit: '6',
          countrycodes: 'ph',
        });

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSuggestions([]);
        }
      }
    }, 300);

    return () => {
      if (destinationDebounceRef.current) {
        window.clearTimeout(destinationDebounceRef.current);
      }
    };
  }, [destinationMode, query]);

  useEffect(() => {
    if (originMode !== 'typed') return;

    if (originDebounceRef.current) {
      window.clearTimeout(originDebounceRef.current);
    }

    if (originAbortRef.current) {
      originAbortRef.current.abort();
      originAbortRef.current = null;
    }

    const trimmed = originQuery.trim();
    if (trimmed.length < 2) {
      setOriginSuggestions([]);
      return;
    }

    originDebounceRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      originAbortRef.current = controller;

      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: 'json',
          addressdetails: '1',
          limit: '6',
          countrycodes: 'ph',
        });

        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setOriginSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setOriginSuggestions([]);
        }
      }
    }, 300);

    return () => {
      if (originDebounceRef.current) {
        window.clearTimeout(originDebounceRef.current);
      }
    };
  }, [originMode, originQuery]);

  const applyDestination = (suggestion: Suggestion) => {
    const selected = {
      lat: Number(suggestion.lat),
      lng: Number(suggestion.lon),
    };
    setDestination(selected);
    setDestinationText(suggestion.display_name);
    setQuery('');
    setSuggestions([]);
    if (!map) return;
    map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 12));
  };

  const applyOrigin = (suggestion: Suggestion) => {
    const selected = {
      lat: Number(suggestion.lat),
      lng: Number(suggestion.lon),
    };
    setOriginLocation(selected);
    setOriginText(suggestion.display_name);
    setOriginQuery('');
    setOriginSuggestions([]);
    if (!map) return;
    map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 12));
  };

  const handleSubmit = () => {
    if (!map || !destination) return;
    map.setView([destination.lat, destination.lng], Math.max(map.getZoom(), 12));
  };

  if (!map) return null;

  const containerStyle = isFullscreen
    ? { width: "calc(100% - 96px)", maxWidth: "75vw" }
    : { width: "min(70vw, 560px)" };

  return (
    <div className="absolute top-3 left-3 z-40" style={containerStyle}>
      <div className="flex items-center bg-white rounded-xl shadow-xl border border-gray-100 py-1 px-1.5 gap-2">
        <div className="flex items-center gap-2">
          <select
            value={originMode}
            onChange={(event) => setOriginMode(event.target.value as OriginMode)}
            className="text-[10px] font-semibold rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600"
          >
            <option value="current">Current</option>
            <option value="typed">Typed</option>
            <option value="pinned">Pinned</option>
          </select>
        </div>
        <div className="flex flex-col flex-1">
          {originMode === 'typed' ? (
            <input
              value={originQuery || originText}
              onChange={(event) => {
                setOriginQuery(event.target.value);
                setOriginText('');
              }}
              placeholder="Type a start location"
              className="w-full text-xs font-semibold outline-none"
            />
          ) : (
            <div className="text-xs font-semibold text-gray-600 truncate">
              {originText}
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <select
            value={destinationMode}
            onChange={(event) => setDestinationMode(event.target.value as DestinationMode)}
            className="text-[10px] font-semibold rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-600"
          >
            <option value="typed">Typed</option>
            <option value="pinned">Pinned</option>
          </select>
        </div>
        <div className="flex flex-col flex-1">
          {destinationMode === 'typed' ? (
            <input
              value={query || destinationText}
              onChange={(event) => {
                setQuery(event.target.value);
                setDestinationText('');
              }}
              placeholder="Search destination"
              className="w-full text-xs font-semibold outline-none"
            />
          ) : (
            <div className="text-xs font-semibold text-gray-600 truncate">
              {destinationText}
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg active:scale-95 transition cursor-pointer"
        >
          <Search size={14} />
          Search
        </button>
      </div>

      {originMode === 'typed' && originSuggestions.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border bg-white shadow-lg">
          {originSuggestions.map((suggestion) => (
            <button
              key={`origin-${suggestion.lat}-${suggestion.lon}`}
              onClick={() => applyOrigin(suggestion)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
            >
              {suggestion.display_name}
            </button>
          ))}
        </div>
      )}

      {destinationMode === 'typed' && suggestions.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border bg-white shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.lat}-${suggestion.lon}`}
              onClick={() => applyDestination(suggestion)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
            >
              {suggestion.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapSearchLeaflet;
