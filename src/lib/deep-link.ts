/**
 * Alt 앱 딥링크 유틸리티
 *
 * 앱이 설치되어 있으면 딥링크로 열고,
 * 설치되지 않았으면 fallback URL로 이동합니다.
 */

/**
 * 딥링크를 통해 앱을 열고, 실패 시 fallback URL로 이동합니다.
 *
 * @param action - 딥링크 액션 (예: "open", "subscription-success")
 * @param params - 딥링크에 전달할 쿼리 파라미터 (선택사항)
 * @param fallbackUrl - 앱이 설치되지 않았을 때 이동할 URL (선택사항)
 * @param timeout - fallback으로 이동하기 전 대기 시간 (밀리초, 기본값: 2000)
 */
export function openInAppWithFallback(
  action: string,
  params: Record<string, string> = {},
  fallbackUrl?: string,
  timeout: number = 2000
): void {
  // 딥링크 URL 생성
  const queryString = new URLSearchParams(params).toString();
  const deepLink = `alt://${action}${queryString ? `?${queryString}` : ""}`;

  // 포커스 상태 저장 (앱이 열리면 포커스가 이동함)
  const hadFocus = document.hasFocus();

  // 딥링크 시도
  const link = document.createElement("a");
  link.href = deepLink;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 일정 시간 후 fallback URL로 이동 (선택사항)
  if (fallbackUrl) {
    setTimeout(() => {
      // 앱이 열렸다면 포커스가 이동했을 것
      // 하지만 브라우저가 백그라운드로 가도 포커스가 유지될 수 있으므로
      // 더 정확한 방법은 visibilitychange 이벤트를 사용하는 것입니다.
      if (!document.hasFocus() && hadFocus) {
        // 앱이 열렸을 가능성이 높음
        return;
      }

      // 앱이 열리지 않았다면 fallback으로 이동
      window.location.href = fallbackUrl;
    }, timeout);
  }
}

/**
 * 구독 성공 시 앱을 여는 헬퍼 함수
 *
 * @param fallbackUrl - 앱이 설치되지 않았을 때 이동할 URL (선택사항)
 */
export function openAppOnSubscriptionSuccess(fallbackUrl?: string): void {
  openInAppWithFallback("open", {}, fallbackUrl);
}
