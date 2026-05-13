import React from "react";
import { Layers, Maximize2, Minimize2, Navigation, RadioTower } from "lucide-react";

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

type Props = {
    mapType: MapType;
    onMapTypeChange: (mapType: MapType) => void;
    showMapTypeMenu: boolean;
    onToggleMapTypeMenu: () => void;
    showLayers: boolean;
    onToggleLayers: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onRecenter: () => void;
    canRecenter: boolean;
};

const MAP_TYPE_LABELS: Record<MapType, string> = {
    roadmap: "Road",
    satellite: "Satellite",
    hybrid: "Hybrid",
    terrain: "Terrain",
};

const MapControls: React.FC<Props> = ({
    mapType,
    onMapTypeChange,
    showMapTypeMenu,
    onToggleMapTypeMenu,
    showLayers,
    onToggleLayers,
    isFullscreen,
    onToggleFullscreen,
    onRecenter,
    canRecenter,
}) => (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
            onClick={onToggleFullscreen}
            className="cursor-pointer bg-white backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-100 text-gray-500 hover:text-[#2B67EB] hover:border-[#2B67EB] transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        <div className="relative">
            <button
                onClick={onToggleMapTypeMenu}
                className={`cursor-pointer bg-white backdrop-blur-sm p-2 rounded-lg shadow-sm border transition-all ${
                    showMapTypeMenu ? "border-[#2B67EB] text-[#2B67EB]" : "border-gray-100 text-gray-600"
                }`}
                title={`Map type: ${MAP_TYPE_LABELS[mapType]}`}
            >
                <Layers size={14} />
            </button>
            {showMapTypeMenu && (
                <div className="cursor-pointer absolute right-10 top-0  bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden w-28">
                    {(Object.keys(MAP_TYPE_LABELS) as MapType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => onMapTypeChange(type)}
                            className={`cursor-pointer w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                                mapType === type
                                    ? "bg-[#2B67EB] text-white"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {MAP_TYPE_LABELS[type]}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <button
            onClick={onToggleLayers}
            className={`cursor-pointer bg-white backdrop-blur-sm p-2 rounded-lg shadow-sm border transition-all ${
                showLayers ? "border-[#2B67EB] text-[#2B67EB]" : "border-gray-100 text-gray-400 hover:text-gray-600"
            }`}
            title="Toggle cell towers & heatmap"
        >
            <RadioTower size={14} />
        </button>

        <button
            onClick={onRecenter}
            disabled={!canRecenter}
            className="cursor-pointer bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-100 text-gray-500 hover:text-[#2B67EB] hover:border-[#2B67EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Go to my location"
        >
            <Navigation size={14} />
        </button>
    </div>
);

export default MapControls;