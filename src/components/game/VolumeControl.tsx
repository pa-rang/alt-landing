"use client";

import { Volume2, VolumeX } from "lucide-react";

type VolumeControlProps = {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  variant?: "light" | "dark";
};

export function VolumeControl({ volume, isMuted, onVolumeChange, onMuteToggle, variant = "dark" }: VolumeControlProps) {
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onMuteToggle}
        className={
          isLight
            ? "p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            : "p-1.5 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
        }
        aria-label={isMuted ? "음소거 해제" : "음소거"}
      >
        {isMuted ? (
          <VolumeX className={isLight ? "w-4 h-4 text-gray-500" : "w-4 h-4 text-white"} />
        ) : (
          <Volume2 className={isLight ? "w-4 h-4 text-gray-700" : "w-4 h-4 text-white"} />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={isMuted ? 0 : volume}
        onChange={(e) => {
          const newVolume = parseFloat(e.target.value);
          onVolumeChange(newVolume);
        }}
        className={
          isLight
            ? "w-14 sm:w-16 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            : "w-16 sm:w-20 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        }
      />
    </div>
  );
}
