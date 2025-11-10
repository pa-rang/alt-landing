"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CopyableCodeProps = {
  code: string;
  className?: string;
};

export function CopyableCode({ code, className }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 복사 실패 시 아무것도 표시하지 않음
    }
  };

  return (
    <code
      className={cn(
        "relative flex items-center justify-start md:justify-center h-[46px] px-4 pr-12 font-mono text-sm bg-[#e6e5e1] dark:bg-[#27272a] text-[#27272a] dark:text-[#f2f1ed] rounded-[2px] whitespace-nowrap",
        className
      )}
    >
      {code}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 hover:bg-stone-300 dark:hover:bg-stone-700 rounded-md transition-colors"
        aria-label="복사"
      >
        {copied ? (
          <Check className="h-[13px] w-[13px] text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="h-[13px] w-[13px] text-stone-600 dark:text-stone-400" />
        )}
      </button>
    </code>
  );
}
