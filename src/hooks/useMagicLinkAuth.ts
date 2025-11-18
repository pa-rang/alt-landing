"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type UseMagicLinkAuthOptions = {
  onError?: (error: Error) => void;
  errorMessage?: string;
};

/**
 * Magic Link 인증 처리 Custom Hook
 *
 * URL fragment의 매직링크 토큰을 파싱하고 Supabase 세션을 설정합니다.
 * 순차적 처리를 보장하여 로그인 상태를 즉시 반영합니다.
 *
 * @param options - 옵션 객체
 * @param options.errorMessage - 에러 발생 시 표시할 메시지
 * @param options.onError - 에러 발생 시 콜백 함수
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useMagicLinkAuth({
 *     errorMessage: "로그인에 실패했습니다.",
 *     onError: (error) => console.error(error)
 *   });
 * }
 * ```
 */
export function useMagicLinkAuth(options: UseMagicLinkAuthOptions = {}) {
  const hasHandled = useRef(false);
  const { errorMessage, onError } = options;

  useEffect(() => {
    if (hasHandled.current) {
      return;
    }

    // URL fragment 확인 (#access_token=...)
    const hash = window.location.hash.substring(1);
    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const tokenType = params.get("type");

    // Magic Link 타입이고 토큰이 있는 경우에만 처리
    if (tokenType === "magiclink" && accessToken && refreshToken) {
      hasHandled.current = true;

      const supabase = createClient();

      // Step 1: 인증 상태 변경 리스너 설정 (setSession 전에)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Step 4: SIGNED_IN 이벤트로 로그인 보장 확인
        if (event === "SIGNED_IN" && session) {
          console.log("✅ [AUTH] User signed in via magic link");

          // Step 5: URL fragment 제거
          const url = new URL(window.location.href);
          url.hash = "";

          // Step 6: 하드 리로드로 서버 컴포넌트 재실행 보장
          // → Server Component가 새 세션 쿠키를 읽도록 보장
          window.location.href = url.toString();
        }
      });

      // Step 2: 세션 설정
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(async ({ data, error }) => {
          if (error) {
            console.error("❌ [AUTH] Failed to set session:", error);
            const message = errorMessage || "세션 설정에 실패했습니다.";
            toast.error(message);
            subscription.unsubscribe();
            onError?.(error);
            return;
          }

          // Step 3: 세션 설정 성공 확인
          if (!data.session) {
            const error = new Error("Session not established");
            console.error("❌ [AUTH] Session not established");
            const message = errorMessage || "세션 설정에 실패했습니다.";
            toast.error(message);
            subscription.unsubscribe();
            onError?.(error);
            return;
          }

          console.log("✅ [AUTH] Session set successfully, waiting for auth state change...");
          // onAuthStateChange가 SIGNED_IN 이벤트를 발생시킬 것임
        })
        .catch((err) => {
          console.error("❌ [AUTH] setSession error:", err);
          const message = errorMessage || "세션 설정에 실패했습니다.";
          toast.error(message);
          subscription.unsubscribe();
          onError?.(err);
        });
    }
  }, [errorMessage, onError]);
}
