import React from "react";
import type { Provider, SignalRange } from "../types";

type FilterStyles<T extends string> = Record<
  T,
  { active: string; inactive: string }
>;

type Props = {
  selectedProvider: Provider;
  onProviderChange: (provider: Provider) => void;
  signalRange: SignalRange;
  onSignalRangeChange: (range: SignalRange) => void;
  providerStyles: FilterStyles<Provider>;
  signalStyles: FilterStyles<SignalRange>;
};

const ProviderFilters: React.FC<Props> = ({
  selectedProvider,
  onProviderChange,
  signalRange,
  onSignalRangeChange,
  providerStyles,
  signalStyles,
}) => (
  <div className="absolute bottom-4 left-3 z-10 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
    <div className="flex flex-wrap items-center gap-2">
      {(["All", "Globe", "Smart", "DITO", "SUN", "TM"] as Provider[]).map((provider) => {
        const styles = providerStyles[provider];
        const isActive = selectedProvider === provider;
        return (
          <button
            key={provider}
            onClick={() => onProviderChange(provider)}
            className={`cursor-pointer px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm backdrop-blur-sm ${
              isActive ? styles.active : styles.inactive
            }`}
          >
            {provider}
          </button>
        );
      })}
    </div>
    <div className="hidden h-5 w-px bg-white/60 sm:block" />
    <div className="flex flex-wrap items-center gap-2">
      {(["All", "Strong", "Moderate", "Weak"] as SignalRange[]).map((range) => {
        const styles = signalStyles[range];
        const isActive = signalRange === range;
        return (
          <button
            key={range}
            onClick={() => onSignalRangeChange(range)}
            className={`cursor-pointer px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm backdrop-blur-sm ${
              isActive ? styles.active : styles.inactive
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  </div>
);

export default ProviderFilters;

