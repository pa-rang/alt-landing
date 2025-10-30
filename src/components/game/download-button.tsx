"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_DOWNLOAD_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/Alt-0.0.6-arm64.dmg";

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
  icon
}: DownloadButtonProps) {
  const handleDownload = () => {
    // macOS 다운로드 링크로 이동
    window.open(downloadUrl, "_blank");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleDownload}
    >
      {icon}
      {children}
    </Button>
  );
}
