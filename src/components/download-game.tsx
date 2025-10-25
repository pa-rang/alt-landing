"use client";

import { useState } from "react";

type DownloadGameProps = {
  onClose: () => void;
};

export function DownloadGame({ onClose }: DownloadGameProps) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center animate-fade-in">
      <div className="text-white text-4xl">
        {/* 게임 로직 */}
        Game Screen
        <button
          onClick={onClose}
          className="mt-8 px-6 py-3 bg-white text-black rounded-lg block mx-auto hover:bg-gray-200 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
