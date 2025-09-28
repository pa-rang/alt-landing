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

export async function sendWaitlistNotification(entry: WaitlistEntry): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL이 설정되지 않았습니다. 슬랙 알림을 건너뜁니다.");
    return;
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

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });

    if (!response.ok) {
      throw new Error(`슬랙 API 응답 오류: ${response.status} ${response.statusText}`);
    }

    console.log(`슬랙 알림 전송 성공: ${entry.email} (ID: ${entry.id})`);
  } catch (error) {
    console.error("슬랙 알림 전송 실패:", error);
    throw error; // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록
  }
}
