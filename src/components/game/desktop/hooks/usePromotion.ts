"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROMO_THRESHOLD_SCORE,
  SUPER_PROMO_THRESHOLD_SCORE,
  PROMO_CODE,
  SUPER_PROMO_CODE,
} from "@/lib/apple-game";
import { PROMO_UNLOCKED_KEY, SUPER_PROMO_UNLOCKED_KEY } from "../../shared/constants";

type GameState = "idle" | "running" | "ended";

export function usePromotion(gameState: GameState, score: number) {
  const [hasUnlockedPromo, setHasUnlockedPromo] = useState<boolean>(false);
  const [hasUnlockedSuperPromo, setHasUnlockedSuperPromo] = useState<boolean>(false);
  const [isPromoBannerVisible, setIsPromoBannerVisible] = useState<boolean>(false);
  const [promoCodeCopied, setPromoCodeCopied] = useState<boolean>(false);
  const promoBannerRef = useRef<HTMLDivElement>(null);
  const promoBannerButtonRef = useRef<HTMLButtonElement>(null);

  // 프로모션 코드 해제 상태 로컬스토리지에서 불러오기
  useEffect(() => {
    const unlocked = localStorage.getItem(PROMO_UNLOCKED_KEY);
    if (unlocked === "true") {
      setHasUnlockedPromo(true);
    }
    const superUnlocked = localStorage.getItem(SUPER_PROMO_UNLOCKED_KEY);
    if (superUnlocked === "true") {
      setHasUnlockedSuperPromo(true);
    }
  }, []);

  // 배너 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPromoBannerVisible &&
        promoBannerRef.current &&
        !promoBannerRef.current.contains(event.target as Node) &&
        promoBannerButtonRef.current &&
        !promoBannerButtonRef.current.contains(event.target as Node)
      ) {
        setIsPromoBannerVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPromoBannerVisible]);

  // 게임 종료 시 프로모션 코드 해제 확인
  useEffect(() => {
    if (gameState === "ended") {
      // 슈퍼 프로모션 (100점 이상) 체크
      if (score >= SUPER_PROMO_THRESHOLD_SCORE && !hasUnlockedSuperPromo) {
        setHasUnlockedSuperPromo(true);
        localStorage.setItem(SUPER_PROMO_UNLOCKED_KEY, "true");
        // 일반 프로모션도 같이 해제 처리 (없다면)
        if (!hasUnlockedPromo) {
          setHasUnlockedPromo(true);
          localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
        }
      }
      // 일반 프로모션 (60점 이상) 체크
      else if (score >= PROMO_THRESHOLD_SCORE && !hasUnlockedPromo) {
        setHasUnlockedPromo(true);
        localStorage.setItem(PROMO_UNLOCKED_KEY, "true");
      }
    }
  }, [gameState, score, hasUnlockedPromo, hasUnlockedSuperPromo]);

  // PROMO_THRESHOLD_SCORE 이상일 때 confetti 발사
  const triggerConfetti = useCallback(async () => {
    console.log("🎉 Confetti 발사! 점수:", score, "기준점수:", PROMO_THRESHOLD_SCORE);
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  }, [score]);

  // 프로모션 코드 복사 핸들러
  const handleCopyPromoCode = useCallback(async (isSuper: boolean = false) => {
    try {
      await navigator.clipboard.writeText(isSuper ? SUPER_PROMO_CODE : PROMO_CODE);
      setPromoCodeCopied(true);
      setTimeout(() => setPromoCodeCopied(false), 2000);
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  }, []);

  const togglePromoBanner = useCallback(() => {
    setIsPromoBannerVisible((prev) => !prev);
  }, []);

  // 현재 표시할 프로모션 타입 결정
  const currentPromoType: "super" | "normal" | null = hasUnlockedSuperPromo ? "super" : hasUnlockedPromo ? "normal" : null;

  return {
    hasUnlockedPromo,
    hasUnlockedSuperPromo,
    isPromoBannerVisible,
    promoCodeCopied,
    promoBannerRef,
    promoBannerButtonRef,
    currentPromoType,
    handleCopyPromoCode,
    togglePromoBanner,
    triggerConfetti,
  };
}

