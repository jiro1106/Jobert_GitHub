import React, { useEffect, useMemo, useState } from 'react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const mapContainerStyle = useMemo(
    () => ({
      width: '100%',
      height: isFullscreen ? '100%' : normalHeight,
    }),
    [isFullscreen, normalHeight]
  );

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'relative'}>
      <div
        className={`relative overflow-hidden shadow-md transition-all duration-300 ${
          isFullscreen
            ? 'h-full w-full rounded-none bg-white'
            : 'rounded-xl border border-gray-100'
        }`}
      >
        {children({
          isFullscreen,
          mapContainerStyle,
          toggleFullscreen: () => setIsFullscreen((value) => !value),
        })}
      </div>
    </div>
  );
};

export default FullscreenMap;
