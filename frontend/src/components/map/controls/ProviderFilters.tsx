import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}) => {
  const [showProviders, setShowProviders] = useState(true);
  const [showStrength, setShowStrength] = useState(true);

  return (
    <div className="absolute bottom-4 left-3 z-10 flex items-end gap-2">
      <button
        onClick={() => setShowProviders((value) => !value)}
        className={`h-8 w-8 rounded-full border bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all ${
          showProviders ? "border-[#2B67EB] text-[#2B67EB]" : "border-gray-200 text-gray-500"
        }`}
        aria-label="Toggle provider filters"
      >
        {showProviders ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
      <div className={`relative h-8 overflow-hidden transition-all duration-300 ${
        showProviders ? "w-[320px]" : "w-0"
      }`}>
        <div
          className={`flex h-full flex-wrap items-center gap-2 transition-all duration-300 ${
            showProviders
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          {(["All", "Globe", "Smart", "DITO", "SUN", "TM"] as Provider[]).map((provider) => {
            const styles = providerStyles[provider];
            const isActive = selectedProvider === provider;
            return (
              <button
                key={provider}
                onClick={() => onProviderChange(provider)}
                className={`cursor-pointer px-2 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-sm backdrop-blur-sm ${
                  isActive ? styles.active : styles.inactive
                }`}
              >
                {provider}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-6 w-px bg-gray-300/70" />
      <button
        onClick={() => setShowStrength((value) => !value)}
        className={`h-8 w-8 rounded-full border bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all ${
          showStrength ? "border-[#2B67EB] text-[#2B67EB]" : "border-gray-200 text-gray-500"
        }`}
        aria-label="Toggle strength filters"
      >
        {showStrength ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
      <div className={`relative h-8 overflow-hidden transition-all duration-300 ${
        showStrength ? "w-65" : "w-0"
      }`}>
        <div
          className={`flex h-full flex-nowrap items-center gap-1.5 transition-all duration-300 ${
            showStrength
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          {(["All", "Strong", "Moderate", "Weak"] as SignalRange[]).map((range) => {
            const styles = signalStyles[range];
            const isActive = signalRange === range;
            return (
              <button
                key={range}
                onClick={() => onSignalRangeChange(range)}
                className={`cursor-pointer px-2 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-sm backdrop-blur-sm ${
                  isActive ? styles.active : styles.inactive
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProviderFilters;

