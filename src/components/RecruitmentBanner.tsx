"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const messages = ["함께 1,000조 기업을 만들 Co-founder를 찾습니다", "함께 Alt를 만드실 분을 찾습니다"];

export function RecruitmentBanner() {
  const [message, setMessage] = useState<string>(messages[0]);

  useEffect(() => {
    // 클라이언트 사이드에서 랜덤하게 메시지 선택
    const randomIndex = Math.floor(Math.random() * messages.length);
    setMessage(messages[randomIndex]);
  }, []);

  return (
    <div className="w-full bg-stone-700 text-[#f2f1ed]">
      <Link href="https://claphq.notion.site/join" target="_blank" rel="noopener noreferrer" className="block w-full">
        <div className="mx-auto max-w-7xl px-4 py-[10px] md:px-8">
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm font-medium text-center hover:underline">{message}</p>
            <ArrowUpRight className="w-4 h-4 shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
}
