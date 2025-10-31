"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDownToLine } from "lucide-react";

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
