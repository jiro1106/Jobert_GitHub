import React, { useState } from 'react';
import GoogleMaps from '../map/GoogleMaps';
import { MapPin, Wifi } from 'lucide-react';

interface LocationInfo {
  lat: number;
  lng: number;
  city: string;
  province: string;
}

const MapSection: React.FC = () => {
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

      {/* Signal Results Footer */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#2B67EB] rounded-lg w-9 h-9 flex items-center justify-center shrink-0">
            <Wifi size={16} color="white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              Signal results for {location?.city ?? '…'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              4 providers analyzed · Based on community reports and NTC data
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-1 rounded-full shrink-0">
          Updated today
        </span>
      </div>
    </div>
  );
};

export default MapSection;