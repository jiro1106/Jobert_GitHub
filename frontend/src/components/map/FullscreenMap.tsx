import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface FullscreenMapRenderArgs {
  isFullscreen: boolean;
  mapContainerStyle: React.CSSProperties;
  toggleFullscreen: () => void;
}

interface Props {
  normalHeight?: string;
  children: (args: FullscreenMapRenderArgs) => React.ReactNode;
}

const FullscreenMap: React.FC<Props> = ({ normalHeight = '500px', children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Use explicit 100vh so the Leaflet MapContainer always gets a real pixel height.
  const mapContainerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      height: isFullscreen ? '100vh' : normalHeight,
    }),
    [isFullscreen, normalHeight],
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${
        isFullscreen ? 'bg-white' : 'rounded-xl border border-gray-100 shadow-md'
      }`}
    >
      {children({ isFullscreen, mapContainerStyle, toggleFullscreen })}
    </div>
  );
};

export default FullscreenMap;
