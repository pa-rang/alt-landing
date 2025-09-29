interface WaitlistEntry {
  id: number;
  email: string;
  platform: string;
  feature_request?: string | null;
  created_at: string;
  updated_at: string;
}

interface SlackMessage {
  text: string;
  attachments: Array<{
    color: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
  }>;
}

// Promise.race를 사용한 수동 타임아웃 구현
function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function sendWaitlistNotification(entry: WaitlistEntry): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL이 설정되지 않았습니다. 슬랙 알림을 건너뜁니다.");
    return false;
  }

  const platformText = entry.platform === "mac" ? "Mac" : "Windows";
  const featureText = entry.feature_request || "요청 없음";
  const timeText = new Date(entry.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message: SlackMessage = {
    text: "🎉 alt의 새로운 웨이트리스트 신청이 있습니다!",
    attachments: [
      {
        color: "good",
        fields: [
          {
            title: "📧 이메일",
            value: entry.email,
            short: true,
          },
          {
            title: "💻 플랫폼",
            value: platformText,
            short: true,
          },
          {
            title: "🕐 신청 시간",
            value: timeText,
            short: true,
          },
          {
            title: "🆔 ID",
            value: `#${entry.id}`,
            short: true,
          },
          {
            title: "💡 기능 요청",
            value: featureText,
            short: false,
          },
        ],
      },
    ],
  };

  // 재시도 로직 포함
  const maxRetries = 2;
  const baseTimeout = 10000; // 10초

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeout = baseTimeout * attempt; // 점진적 타임아웃 증가

      const response = await fetchWithTimeout(
        webhookUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        },
        timeout
      );

      if (!response.ok) {
        console.warn(`슬랙 API 응답 오류 (시도 ${attempt}/${maxRetries}): ${response.status} ${response.statusText}`);
        if (attempt === maxRetries) {
          console.error(`슬랙 알림 최종 실패: ${entry.email} (ID: ${entry.id})`);
          return false;
        }
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.log(`슬랙 알림 전송 성공: ${entry.email} (ID: ${entry.id})`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`슬랙 알림 전송 실패 (시도 ${attempt}/${maxRetries}):`, errorMessage);

      if (attempt === maxRetries) {
        console.error(`슬랙 알림 최종 실패: ${entry.email} (ID: ${entry.id}) - ${errorMessage}`);
        return false;
      }

      // 재시도 전 대기 (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}
