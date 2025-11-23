interface WaitlistEntry {
  id: number;
  email: string;
  platform: string;
  feature_request?: string | null;
  created_at: string;
  updated_at: string;
}

interface FeedbackEntry {
  id: number;
  feedback_type: string;
  content: string;
  email: string;
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
    ),
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
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}

export async function sendFeedbackNotification(entry: FeedbackEntry): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL이 설정되지 않았습니다. 슬랙 알림을 건너뜁니다.");
    return false;
  }

  const feedbackTypeText = entry.feedback_type === "issue" ? "🐛 이슈" : "💡 아이디어";
  const timeText = new Date(entry.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message: SlackMessage = {
    text: "📝 새로운 피드백이 접수되었습니다!",
    attachments: [
      {
        color: entry.feedback_type === "issue" ? "danger" : "warning",
        fields: [
          {
            title: "📋 유형",
            value: feedbackTypeText,
            short: true,
          },
          {
            title: "📧 이메일",
            value: entry.email,
            short: true,
          },
          {
            title: "🕐 접수 시간",
            value: timeText,
            short: true,
          },
          {
            title: "🆔 ID",
            value: `#${entry.id}`,
            short: true,
          },
          {
            title: "📝 내용",
            value: entry.content,
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
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}

interface GameScoreEntry {
  id: number;
  email: string;
  organization: string;
  nickname: string;
  score: number;
  created_at: string;
  updated_at: string;
}

interface DownloadEntry {
  id: number;
  email?: string | null;
  platform: string;
  user_agent?: string | null;
  ip_address?: string | null;
  download_url: string;
  version?: string | null;
  location?: string | null;
  created_at: string;
}

export async function sendDownloadNotification(entry: DownloadEntry): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL이 설정되지 않았습니다. 슬랙 알림을 건너뜁니다.");
    return false;
  }

  const platformText =
    entry.platform === "macos" ? "🖥️ macOS" : entry.platform === "windows" ? "🪟 Windows" : entry.platform;
  const emailText = entry.email || "익명 사용자";
  const timeText = new Date(entry.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message: SlackMessage = {
    text: "📦 alt 다운로드가 발생했습니다!",
    attachments: [
      {
        color: "good",
        fields: [
          {
            title: "📧 이메일",
            value: emailText,
            short: true,
          },
          {
            title: "💻 플랫폼",
            value: platformText,
            short: true,
          },
          {
            title: "🕐 다운로드 시간",
            value: timeText,
            short: true,
          },
          {
            title: "🆔 ID",
            value: `#${entry.id}`,
            short: true,
          },
          ...(entry.version
            ? [
                {
                  title: "📌 버전",
                  value: entry.version,
                  short: true,
                },
              ]
            : []),
          ...(entry.location
            ? [
                {
                  title: "📍 위치",
                  value: entry.location,
                  short: true,
                },
              ]
            : []),
          {
            title: "🔗 다운로드 URL",
            value: entry.download_url.length > 100 ? `${entry.download_url.substring(0, 100)}...` : entry.download_url,
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
          console.error(`슬랙 알림 최종 실패: 다운로드 ID ${entry.id}`);
          return false;
        }
        // 재시도 전 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.log(`슬랙 알림 전송 성공: 다운로드 ID ${entry.id}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`슬랙 알림 전송 실패 (시도 ${attempt}/${maxRetries}):`, errorMessage);

      if (attempt === maxRetries) {
        console.error(`슬랙 알림 최종 실패: 다운로드 ID ${entry.id} - ${errorMessage}`);
        return false;
      }

      // 재시도 전 대기 (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}

export async function sendGameScoreNotification(entry: GameScoreEntry): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL이 설정되지 않았습니다. 슬랙 알림을 건너뜁니다.");
    return false;
  }

  const timeText = new Date(entry.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const message: SlackMessage = {
    text: "🎮 리더보드에 새로운 점수가 등록되었습니다!",
    attachments: [
      {
        color: "good",
        fields: [
          {
            title: "👤 닉네임",
            value: entry.nickname,
            short: true,
          },
          {
            title: "🏢 Organization",
            value: entry.organization,
            short: true,
          },
          {
            title: "🎯 점수",
            value: `${entry.score.toLocaleString()}점`,
            short: true,
          },
          {
            title: "🕐 등록 시간",
            value: timeText,
            short: true,
          },
          {
            title: "🆔 ID",
            value: `#${entry.id}`,
            short: true,
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
          console.error(`슬랙 알림 최종 실패: ${entry.nickname} (ID: ${entry.id})`);
          return false;
        }
        // 재시도 전 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.log(`슬랙 알림 전송 성공: ${entry.nickname} (ID: ${entry.id})`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`슬랙 알림 전송 실패 (시도 ${attempt}/${maxRetries}):`, errorMessage);

      if (attempt === maxRetries) {
        console.error(`슬랙 알림 최종 실패: ${entry.nickname} (ID: ${entry.id}) - ${errorMessage}`);
        return false;
      }

      // 재시도 전 대기 (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
}
