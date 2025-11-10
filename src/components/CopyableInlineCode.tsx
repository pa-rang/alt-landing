"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type CopyableInlineCodeProps = {
  code: string;
};

export function CopyableInlineCode({ code }: CopyableInlineCodeProps) {
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
    <code className="relative inline-flex items-center px-1.5 py-0.5 pr-8 bg-[#e6e5e1] dark:bg-zinc-800 rounded text-[12px] font-mono">
      {code}
      <button
        onClick={handleCopy}
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 hover:bg-stone-300 dark:hover:bg-stone-700 rounded transition-colors"
        aria-label="복사"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="h-3 w-3 text-stone-600 dark:text-stone-400" />
        )}
      </button>
    </code>
  );
}
