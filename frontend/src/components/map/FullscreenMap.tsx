import React, { useEffect, useMemo, useState } from 'react';

interface FullscreenMapRenderArgs {
  isFullscreen: boolean;
  /** Pass directly to MapContainer's `style` prop — gives it the right height. */
  mapContainerStyle: React.CSSProperties;
  toggleFullscreen: () => void;
}

interface Props {
  normalHeight?: string;
  children: (args: FullscreenMapRenderArgs) => React.ReactNode;
}

const FullscreenMap: React.FC<Props> = ({ normalHeight = '500px', children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock body scroll while fullscreen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isFullscreen ? 'hidden' : prev;
    return () => { document.body.style.overflow = prev; };
  }, [isFullscreen]);

  // mapContainerStyle is what gets spread into MapContainer's `style` prop.
  // In fullscreen: 100dvh forces the Leaflet canvas to fill the viewport.
  // In normal:     use the passed normalHeight (a px value or '100%').
  const mapContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: isFullscreen ? '100dvh' : normalHeight,
      minHeight: 0,
    }),
    [isFullscreen, normalHeight]
  );

  const fillParent = normalHeight === '100%';

  // FullscreenMap owns the full-screen overlay.
  // The inner wrapper div establishes the stacking context.
  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-white'           // true fullscreen overlay
          : `relative ${fillParent ? 'h-full w-full' : ''}`
      }
    >
      <div
        className={[
          'relative overflow-hidden transition-all duration-300',
          isFullscreen
            ? 'h-full w-full rounded-none'
            : fillParent
              ? 'h-full w-full rounded-xl border border-gray-100 shadow-md'
              : 'rounded-xl border border-gray-100 shadow-md',
        ].join(' ')}
      >
        {children({
          isFullscreen,
          mapContainerStyle,
          toggleFullscreen: () => setIsFullscreen((v) => !v),
        })}
      </div>
    </div>
  );
};

export default FullscreenMap;
