"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, Loader2 } from "lucide-react";

// GA4 이벤트 추적 함수
function trackDownloadClick() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "download_click", {
      event_category: "conversion",
      event_label: "macos_download",
      platform: "macos",
      timestamp: new Date().toISOString(),
    });
  }
}

const DEFAULT_DOWNLOAD_URL = "/api/mac";
const STORAGE_NICKNAME_KEY = "squareTomatoGameNickname";
const STORAGE_ORGANIZATION_KEY = "squareTomatoGameOrganization";

// 로컬스토리지에서 닉네임과 organization 가져오기
function getNicknameFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_NICKNAME_KEY);
  } catch {
    return null;
  }
}

function getOrganizationFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_ORGANIZATION_KEY);
  } catch {
    return null;
  }
}

type DownloadButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  downloadUrl?: string;
  icon?: React.ReactNode;
  nickname?: string; // 선택적 닉네임 prop
  organization?: string; // 선택적 organization prop
  location?: string; // 다운로드 버튼 위치 (예: "home", "pricing", "game")
};

export function DownloadButton({
  className,
  variant = "default",
  size = "default",
  children = "Download for macOS",
  downloadUrl = DEFAULT_DOWNLOAD_URL,
  nickname,
  organization,
  location,
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    // GA4 이벤트 추적
    trackDownloadClick();

    // 다운로드 URL (리디렉션될 수 있으므로 원본 URL 사용)
    const downloadUrlToLog = downloadUrl;

    // 로딩 상태 시작
    setIsLoading(true);

    // 다운로드 즉시 시작 (로그 기록과 독립적으로)
    window.open(downloadUrl, "_blank");

    // 다운로드 로그 기록 (비동기, 실패해도 다운로드는 이미 진행됨)
    try {
      const nicknameToLog = nickname || getNicknameFromStorage();
      const organizationToLog = organization || getOrganizationFromStorage();

      // 로그 기록은 비동기로 처리하고 응답을 기다리지 않음
      fetch("/api/download/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nicknameToLog,
          organization: organizationToLog,
          downloadUrl: downloadUrlToLog,
          location: location,
        }),
      }).catch((error) => {
        console.error("다운로드 로그 기록 실패:", error);
      });
    } catch (error) {
      console.error("다운로드 로그 기록 실패:", error);
    }

    // 짧은 딜레이 후 로딩 상태 해제 (사용자 경험 개선)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleDownload}
      type="button"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {children}
          <ArrowDownToLine className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
