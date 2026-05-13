import { useSearchParams } from "react-router-dom";
import MapComponent from "../components/map/MapComponent";

export default function MapsPage() {
  const [searchParams] = useSearchParams();
  const initialOriginText = searchParams.get("from") ?? undefined;
  const initialDestinationText = searchParams.get("to") ?? undefined;

  return (
    <main className="min-h-screen px-4 py-6 md:!px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-ink">Coverage Map</h1>
          <p className="text-ink-4">Explore signal coverage and route forecasts.</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm">
          <MapComponent
            initialOriginText={initialOriginText}
            initialDestinationText={initialDestinationText}
          />
        </div>
      </div>
    </main>
  );
}
