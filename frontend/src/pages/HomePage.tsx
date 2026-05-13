import HeroSection from '../sections/landing/HeroSection';
import StatsSection from '../sections/landing/StatsSection';
import MapSection from '../sections/landing/MapSection';
import ProviderScoreboardSection from '../sections/landing/ProviderScoreboardSection';
import UseCasesSection from '../sections/landing/UseCasesSection';
import CommunitySection from '../sections/landing/CommunitySection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      <div className="page">
        <MapSection />
        <ProviderScoreboardSection />
        <UseCasesSection />
        <CommunitySection />
      </div>
    </main>
  );
}
