"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameState = "idle" | "running" | "ended";

export function useGameAudio(gameState: GameState) {
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const clearSfxRef = useRef<HTMLAudioElement | null>(null);
  const [bgmVolume, setBgmVolume] = useState<number>(0.3);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // BGM 초기화
  useEffect(() => {
    bgmRef.current = new Audio("/tomato-game-bgm.wav");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.3;

    clearSfxRef.current = new Audio("/tomato-clear-bgm.wav");
    clearSfxRef.current.volume = 0.5;

    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
      clearSfxRef.current = null;
    };
  }, []);

  // 게임 상태에 따라 BGM 재생/중지
  useEffect(() => {
    if (!bgmRef.current) return;

    if (gameState === "running") {
      bgmRef.current.play().catch(() => {
        // 자동 재생 차단 시 무시
      });
    } else {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [gameState]);

  // 볼륨 및 음소거 상태 동기화
  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = isMuted ? 0 : bgmVolume;
    }
  }, [bgmVolume, isMuted]);

  const playClearSound = useCallback(() => {
    if (clearSfxRef.current && !isMuted) {
      clearSfxRef.current.currentTime = 0;
      clearSfxRef.current.volume = bgmVolume;
      clearSfxRef.current.play().catch(() => {});
    }
  }, [isMuted, bgmVolume]);

  const stopBgm = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setBgmVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    bgmVolume,
    isMuted,
    playClearSound,
    stopBgm,
    handleVolumeChange,
    toggleMute,
  };
}

