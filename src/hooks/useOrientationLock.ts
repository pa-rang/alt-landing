"use client";

import { useEffect, useState } from "react";

type Orientation = "portrait" | "landscape";

type UseOrientationLockOptions = {
  /** 잠글 방향 (기본값: "portrait") */
  lockTo?: Orientation;
};

type UseOrientationLockReturn = {
  /** 현재 기기 방향 */
  deviceOrientation: Orientation;
  /** 세로 모드 여부 */
  isPortrait: boolean;
  /** 가로 모드 여부 */
  isLandscape: boolean;
};

/**
 * 화면 방향을 고정하고 현재 기기 방향을 감지하는 훅
 *
 * - Screen Orientation API를 사용해 방향 잠금 시도 (Android Chrome 지원)
 * - iOS Safari 등 미지원 브라우저에서는 CSS transform 보정용 방향 상태 제공
 *
 * @example
 * const { deviceOrientation, isPortrait } = useOrientationLock({ lockTo: "portrait" });
 */
export function useOrientationLock(options: UseOrientationLockOptions = {}): UseOrientationLockReturn {
  const { lockTo = "portrait" } = options;
  const [deviceOrientation, setDeviceOrientation] = useState<Orientation>("portrait");

  // Screen Orientation API로 방향 잠금
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.lock === "function") {
          await orientation.lock(lockTo);
        }
      } catch {
        // iOS Safari 등 지원하지 않는 브라우저에서는 무시
      }
    };

    lockOrientation();

    return () => {
      // 컴포넌트 언마운트 시 방향 잠금 해제
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.unlock === "function") {
          orientation.unlock();
        }
      } catch {
        // 무시
      }
    };
  }, [lockTo]);

  // CSS transform 보정을 위한 기기 방향 감지
  useEffect(() => {
    const detectOrientation = () => {
      // window.orientation (deprecated but works on iOS)
      // 0, 180: portrait, 90, -90: landscape
      if (typeof window.orientation === "number") {
        const isLandscape = Math.abs(window.orientation) === 90;
        setDeviceOrientation(isLandscape ? "landscape" : "portrait");
      } else if (screen.orientation) {
        // Screen Orientation API
        const isLandscape = screen.orientation.type.includes("landscape");
        setDeviceOrientation(isLandscape ? "landscape" : "portrait");
      } else {
        // 폴백: 화면 비율로 판단
        const isLandscape = window.innerWidth > window.innerHeight;
        setDeviceOrientation(isLandscape ? "landscape" : "portrait");
      }
    };

    detectOrientation();

    window.addEventListener("orientationchange", detectOrientation);
    window.addEventListener("resize", detectOrientation);

    return () => {
      window.removeEventListener("orientationchange", detectOrientation);
      window.removeEventListener("resize", detectOrientation);
    };
  }, []);

  return {
    deviceOrientation,
    isPortrait: deviceOrientation === "portrait",
    isLandscape: deviceOrientation === "landscape",
  };
}
