// GA4 이벤트 추적 함수 (공통)
type Platform = "mobile" | "desktop";

export function trackGameStart(platform: Platform) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_start", {
      event_category: "game",
      event_label: "game_play_start",
      platform: platform,
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackGameRetry(platform: Platform) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_retry", {
      event_category: "game",
      event_label: "game_retry_during_play",
      platform: platform,
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackGameRestart(platform: Platform) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "game_restart", {
      event_category: "game",
      event_label: "game_restart_after_end",
      platform: platform,
      timestamp: new Date().toISOString(),
    });
  }
}
