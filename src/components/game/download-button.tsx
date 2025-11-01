"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownToLine } from "lucide-react";

// GA4 이벤트 추적 함수
function trackDownloadClick() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'download_click', {
      event_category: 'conversion',
      event_label: 'macos_download',
      platform: 'macos',
      timestamp: new Date().toISOString()
    });
  }
}

const DEFAULT_DOWNLOAD_URL = "/api/mac";

type DownloadButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
  downloadUrl?: string;
  icon?: React.ReactNode;
};

export function DownloadButton({
  className,
  variant = "default",
  size = "default",
  children = "Download for macOS",
  downloadUrl = DEFAULT_DOWNLOAD_URL,
}: DownloadButtonProps) {
  const handleDownload = () => {
    // GA4 이벤트 추적
    trackDownloadClick();
    // macOS 다운로드 링크로 이동
    window.open(downloadUrl, "_blank");
  };

  return (
    <Button variant={variant} size={size} className={cn(className)} onClick={handleDownload} type="button">
      {children}
      <ArrowDownToLine className="h-4 w-4" />
    </Button>
  );
}
