import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendDownloadNotification } from "@/lib/slack";

export const dynamic = "force-dynamic";

interface DownloadLogEntry {
  id: number;
  email?: string | null;
  platform: string;
  user_agent?: string | null;
  ip_address?: string | null;
  download_url: string;
  version?: string | null;
  created_at: string;
}

function getClientIp(request: Request): string | null {
  // Vercel 및 일반적인 프록시 환경에서 IP 추출
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0]?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

function extractVersionFromUrl(url: string): string | null {
  try {
    // URL에서 버전 추출 (예: Alt-0.0.6-arm64.dmg -> 0.0.6)
    const match = url.match(/Alt-(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// /api/mac 엔드포인트를 호출하여 실제 다운로드 URL 가져오기
async function resolveDownloadUrl(originalUrl: string, baseUrl: string): Promise<string> {
  // /api/mac인 경우 실제 다운로드 URL을 가져오기 위해 서버에서 호출
  if (originalUrl.includes("/api/mac")) {
    try {
      // 서버 사이드에서 /api/mac를 호출하여 리디렉션 URL 확인
      const response = await fetch(`${baseUrl}/api/mac?debug=true`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.convertedUrl || data.latestUrl) {
          return data.convertedUrl || data.latestUrl;
        }
      }
    } catch (error) {
      console.error("다운로드 URL 확인 실패:", error);
    }
  }

  return originalUrl;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, downloadUrl } = body;

    if (!downloadUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "downloadUrl is required",
        },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || null;
    const ipAddress = getClientIp(request);
    const platform = "macos"; // 현재는 macOS만 지원

    // URL에서 base URL 추출
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // 실제 다운로드 URL 확인
    const finalDownloadUrl = await resolveDownloadUrl(downloadUrl, baseUrl);
    const version = extractVersionFromUrl(finalDownloadUrl);

    // DB에 다운로드 로그 저장
    const result = await query<DownloadLogEntry>(
      `INSERT INTO public.downloads (email, platform, user_agent, ip_address, download_url, version, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, email, platform, user_agent, ip_address, download_url, version, created_at`,
      [email || null, platform, userAgent, ipAddress, finalDownloadUrl, version]
    );

    const downloadEntry = result.rows[0];

    // Slack 알림 전송 (비동기, 실패해도 다운로드는 진행)
    Promise.resolve().then(() => {
      sendDownloadNotification(downloadEntry).catch((error) => {
        console.error("Slack notification error:", error);
      });
    });

    return NextResponse.json({
      ok: true,
      downloadId: downloadEntry.id,
    });
  } catch (error) {
    console.error("download log POST failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to log download",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
