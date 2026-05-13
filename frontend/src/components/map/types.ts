export type Provider = "All" | "Globe" | "Smart" | "DITO" | "SUN" | "TM";

export type SignalRange = "All" | "Strong" | "Moderate" | "Weak";

export type Tower = {
  id: string;
  provider: Exclude<Provider, "All">;
  position: { lat: number; lng: number };
  signal: number;
  radiusMeters: number;
};
