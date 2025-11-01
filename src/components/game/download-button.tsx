"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownToLine } from "lucide-react";

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
const STORAGE_EMAIL_KEY = "squareTomatoGameEmail";

// 로컬스토리지에서 이메일 가져오기
function getEmailFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_EMAIL_KEY);
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
  email?: string; // 선택적 이메일 prop
};

export function DownloadButton({
  className,
  variant = "default",
  size = "default",
  children = "Download for macOS",
  downloadUrl = DEFAULT_DOWNLOAD_URL,
  email,
}: DownloadButtonProps) {
  const [isLogging, setIsLogging] = useState(false);

  const handleDownload = async () => {
    // GA4 이벤트 추적
    trackDownloadClick();

    // 다운로드 URL (리디렉션될 수 있으므로 원본 URL 사용)
    const downloadUrlToLog = downloadUrl;

    try {
      // 다운로드 로그 기록 시도 (실패해도 다운로드는 진행)
      setIsLogging(true);

      // 다운로드 이벤트 로깅 (서버에서 실제 URL을 알아냄)
      const emailToLog = email || getEmailFromStorage();
      await fetch("/api/download/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailToLog,
          downloadUrl: downloadUrlToLog,
        }),
      }).catch((error) => {
        console.error("다운로드 로그 기록 실패:", error);
      });
    } catch (error) {
      console.error("다운로드 로그 기록 실패:", error);
    } finally {
      setIsLogging(false);
    }

    // 실제 다운로드 진행
    window.open(downloadUrl, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleDownload}
      type="button"
      disabled={isLogging}
    >
      {children}
      <ArrowDownToLine className="h-4 w-4" />
    </Button>
  );
}
