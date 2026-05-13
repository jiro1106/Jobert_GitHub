import React, { useState } from 'react';
import GoogleMaps from '../map/GoogleMaps';
import { MapPin, Wifi } from 'lucide-react';

interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  province: string;
}

const MapsComponent: React.FC = () => {
  const [location, setLocation] = useState<LocationInfo | null>(null);

  return (
    <div className="bg-transparent flex flex-col gap-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#EFF6FF] h-10 w-10 justify-center items-center rounded-md flex border border-[#BFDBFE]">
          <MapPin size={18} color="#2B67EB" />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[#2B67EB] font-semibold text-lg leading-none">
            {location?.city ?? 'Locating…'}
          </p>
          {location?.province && (
            <>
              <span className="text-sm text-gray-400 font-medium">/</span>
              <p className="text-sm text-gray-500 font-medium">{location.province}</p>
            </>
          )}
        </div>
      </div>

      {/* Map */}
      <GoogleMaps onLocationChange={setLocation} />
    </div>
  );
};

export default MapsComponent;