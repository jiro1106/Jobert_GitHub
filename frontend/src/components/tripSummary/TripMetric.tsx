export const TripMetric: React.FC<{ value: string; label: string; color?: string }> = ({ value, label, color }) => {
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: color ?? 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{label}</div>
    </div>
  );
}