import { TripMetric } from "./TripMetric";

type TripSummaryProps = {
  distanceKm: number;
  durationMin: number;
};

export const TripSummary: React.FC<TripSummaryProps> = ({
  distanceKm,
  durationMin,
}) => {
  const hours = Math.floor(durationMin / 60);
  const minutes = Math.round(durationMin % 60);

  return (
    <div className="panel">
      <div style={{ padding: '18px 18px 8px' }}>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
          Trip overview
        </div>

        <div className="text-3xl font-semibold">
          {distanceKm.toFixed(1)}
          <sub className="text-sm text-gray-400 ml-1">km</sub>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          padding: '14px 18px 18px',
          gap: 12,
          borderTop: '1px solid #eee',
          marginTop: 14,
        }}
      >
        <TripMetric
          value={`${hours}h ${minutes}m`}
          label="Est. drive time"
        />
        <TripMetric
          value={`${distanceKm.toFixed(1)} km`}
          label="Route distance"
        />
      </div>
    </div>
  );
};