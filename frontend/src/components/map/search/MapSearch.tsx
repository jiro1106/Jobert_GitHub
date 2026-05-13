import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

type LatLng = {
  lat: number;
  lng: number;
};

type Prediction = {
  description: string;
  place_id: string;
};

type Props = {
  map: google.maps.Map | null;
};

const MapSearch: React.FC<Props> = ({ map }) => {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef =
    useRef<google.maps.places.PlacesService | null>(null);
  const directionsServiceRef =
    useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [originText, setOriginText] = useState("Current location");
  const [destinationText, setDestinationText] = useState("");
  const [activeField, setActiveField] =
    useState<"origin" | "destination">("destination");
  const [isFieldFocused, setIsFieldFocused] = useState(false);

  const canQueryPlaces = useMemo(() => {
    return query.trim().length >= 2;
  }, [query]);

  const clearMarker = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  const dropMarker = (location: LatLng) => {
    if (!map) return;
    clearMarker();
    markerRef.current = new google.maps.Marker({
      position: location,
      map,
      animation: google.maps.Animation.DROP,
    });
  };

  const clearRoute = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  };

  useEffect(() => {
    if (!map) return;

    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new google.maps.places.AutocompleteService();
    }

    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
  }, [map]);

  useEffect(() => {
    if (!map || origin) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setOrigin(location);
        setOriginText("Current location");
      },
      () => {
        setOriginText("Current location");
      }
    );
  }, [map, origin]);

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (!isFieldFocused || !event.latLng) return;

        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };

        if (activeField === "origin") {
          setOrigin(location);
          setOriginText("Pinned location");
        } else {
          setDestination(location);
          setDestinationText("Pinned location");
        }

        setSuggestions([]);
        setQuery("");
      }
    );

    return () => {
      listener.remove();
    };
  }, [map, activeField, isFieldFocused]);

  useEffect(() => {
    if (!autocompleteServiceRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (!canQueryPlaces) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      autocompleteServiceRef.current?.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: "ph" },
        },
        (predictions) => {
          if (!predictions) {
            setSuggestions([]);
            return;
          }

          setSuggestions(
            predictions.map((prediction) => ({
              description: prediction.description,
              place_id: prediction.place_id,
            }))
          );
        }
      );
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, canQueryPlaces]);

  const selectPlace = (placeId: string, description: string) => {
    if (!placesServiceRef.current || !map) return;

    placesServiceRef.current.getDetails(
      {
        placeId,
        fields: ["geometry", "name"],
      },
      (place) => {
        if (!place?.geometry?.location) return;

        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        setSuggestions([]);
        setQuery("");

        if (activeField === "origin") {
          setOrigin(location);
          setOriginText(description);
        } else {
          setDestination(location);
          setDestinationText(description);
        }
      }
    );
  };

  const handleSubmit = () => {
    if (!map) return;

    if (origin && destination) {
      clearMarker();
      if (!directionsServiceRef.current) return;

      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#2563EB",
            strokeWeight: 5,
          },
        });

        directionsRendererRef.current.setMap(map);
      }

      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRendererRef.current?.setDirections(result);
          }
        }
      );
      return;
    }

    const target = destination ?? origin;
    if (!target) return;

    clearRoute();
    map.panTo(target);
    map.setZoom(16);
    dropMarker(target);
  };

  const handleInputFocus = (field: "origin" | "destination") => {
    setActiveField(field);
    setIsFieldFocused(true);
    const value = field === "origin" ? originText : destinationText;
    setQuery(value === "Current location" ? "" : value);
  };

  const handleInputBlur = () => {
    setIsFieldFocused(false);
  };

  return (
    <div className="absolute top-3 left-3 z-50 w-125">
  <div className="flex items-center bg-white rounded-xl shadow-xl border border-gray-100 py-1 px-1.5 gap-2">

    {/* FROM */}
    <div className="flex items-center flex-1 gap-2">
      <span className="text-[10px] font-semibold text-gray-500">From</span>
      <input
        value={originText}
        onFocus={() => handleInputFocus("origin")}
        onBlur={handleInputBlur}
        onChange={(e) => {
          setActiveField("origin");
          setIsFieldFocused(true);
          setOriginText(e.target.value);
        }}
        placeholder="Current location"
        className="w-full text-xs outline-none font-semibold"
      />
    </div>

    {/* DIVIDER */}
    <div className="h-6 w-px bg-gray-200" />

    {/* TO */}
    <div className="flex items-center flex-1 gap-2">
      <span className="text-[10px] font-semibold text-gray-500">To</span>
      <input
        value={destinationText}
        onFocus={() => handleInputFocus("destination")}
        onBlur={handleInputBlur}
        onChange={(e) => {
          setActiveField("destination");
          setIsFieldFocused(true);
          setDestinationText(e.target.value);
        }}
        placeholder="Search destination"
        className="w-full text-xs font-semibold outline-none"
      />
    </div>

    {/* SEARCH BUTTON */}
    <button
      onClick={handleSubmit}
      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg active:scale-95 transition cursor-pointer "
    >
      <Search size={14} />
      Search
    </button>
  </div>

  {/* SUGGESTIONS */}
  {suggestions.length > 0 && (
    <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border bg-white shadow-lg">
      {suggestions.map((s) => (
        <button
          key={s.place_id}
          onClick={() => selectPlace(s.place_id, s.description)}
          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50"
        >
          {s.description}
        </button>
      ))}
    </div>
  )}
</div>
  );
};

export default MapSearch;