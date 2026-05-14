import { useState } from 'react';
import HeroSection from '../sections/landing/HeroSection';
import StatsSection from '../sections/landing/StatsSection';
import MapSection from '../sections/landing/MapSection';
import ProviderScoreboardSection from '../sections/landing/ProviderScoreboardSection';
import UseCasesSection from '../sections/landing/UseCasesSection';
import CommunitySection from '../sections/landing/CommunitySection';
import type { RouteForecast } from '../types/coverage';

export interface RouteCoords {
  originLat: number;
  originLng: number;
  originName: string;
  destLat: number;
  destLng: number;
  destName: string;
}

export default function HomePage() {
  const [activeRoute, setActiveRoute] = useState<RouteCoords | null>(null);
  const [forecast, setForecast] = useState<RouteForecast | null>(null);

  const handleRouteActive = (coords: RouteCoords | null) => {
    setActiveRoute(coords);
    if (!coords) setForecast(null);
  };

  return (
    <main>
      <HeroSection />
      <StatsSection />
      <div className="page">
        <MapSection onRouteActive={handleRouteActive} onForecastReady={setForecast} />
        <ProviderScoreboardSection activeRoute={activeRoute} forecast={forecast} />
        <UseCasesSection activeRoute={activeRoute} forecast={forecast} />
        <CommunitySection />
      </div>
    </main>
  );
}
