import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 강조용 그라디언트 색상 조합
 * orange-600 → purple-500 → emerald-500
 */
export const accentGradient = {
  /** 텍스트에 사용하는 그라디언트 클래스 */
  text: "bg-gradient-to-r from-orange-600 via-purple-500 to-emerald-500 bg-clip-text text-transparent",
  /** 배경에 사용하는 그라디언트 클래스 (투명도 적용) */
  background: "bg-gradient-to-r from-orange-600/10 via-purple-500/15 to-emerald-500/15",
} as const;
