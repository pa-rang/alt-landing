"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface RecentPlay {
  nickname: string;
  organization: string;
  score: number;
  created_at: string;
}

interface RecentPlaysProps {
  className?: string;
  refreshTrigger?: number;
}

// n분전 형식으로 변환
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초전`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분전`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간전`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일전`;
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}주전`;
}

export function RecentPlays({ className, refreshTrigger }: RecentPlaysProps) {
  const [plays, setPlays] = useState<RecentPlay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const fetchRecentPlays = useCallback(async () => {
    try {
      const res = await fetch("/api/game/recent?limit=5");
      const data = await res.json();
      if (data.ok && data.plays.length > 0) {
        setPlays(data.plays);
      }
    } catch (error) {
      console.error("Failed to fetch recent plays:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecentPlays();
  }, [fetchRecentPlays, refreshTrigger]);

  // 10초마다 최근 플레이 데이터 풀링
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentPlays();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRecentPlays]);

  // 롤업 애니메이션: 3초마다 다음 항목으로 전환
  useEffect(() => {
    if (plays.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setIsVisible(false);

      // fade out 완료 후 인덱스 변경하고 fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % plays.length);
        setIsVisible(true);
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [plays.length]);

  if (plays.length === 0) {
    return null;
  }

  const currentPlay = plays[currentIndex];

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <Image
        src="/icons/🎮️ game_light.svg"
        alt="game"
        width={16}
        height={16}
        className="shrink-0"
      />
      <div
        className={`flex items-center gap-1 text-xs transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <span className="font-medium text-gray-800 truncate max-w-[60px]">{currentPlay.nickname}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600 truncate max-w-[50px]">{currentPlay.organization}</span>
        <span className="text-gray-400">·</span>
        <span className="font-semibold text-emerald-600">{currentPlay.score}점</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500 whitespace-nowrap">{formatTimeAgo(currentPlay.created_at)}</span>
      </div>
    </div>
  );
}

// 데스크톱용 큰 버전
export function RecentPlaysDesktop({ className, refreshTrigger }: RecentPlaysProps) {
  const [plays, setPlays] = useState<RecentPlay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const fetchRecentPlays = useCallback(async () => {
    try {
      const res = await fetch("/api/game/recent?limit=5");
      const data = await res.json();
      if (data.ok && data.plays.length > 0) {
        setPlays(data.plays);
      }
    } catch (error) {
      console.error("Failed to fetch recent plays:", error);
    }
  }, []);

  useEffect(() => {
    fetchRecentPlays();
  }, [fetchRecentPlays, refreshTrigger]);

  // 10초마다 최근 플레이 데이터 풀링
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentPlays();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRecentPlays]);

  // 롤업 애니메이션: 3초마다 다음 항목으로 전환
  useEffect(() => {
    if (plays.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);

      // fade out 완료 후 인덱스 변경하고 fade in
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % plays.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [plays.length]);

  if (plays.length === 0) {
    return null;
  }

  const currentPlay = plays[currentIndex];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm ${className || ""}`}
    >
      <Image
        src="/icons/🎮️ game_light.svg"
        alt="game"
        width={20}
        height={20}
        className="shrink-0"
      />
      <div
        className={`flex items-center gap-1.5 text-sm text-white transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <span className="font-medium truncate max-w-[80px]">{currentPlay.nickname}</span>
        <span className="text-white/60">·</span>
        <span className="text-white/80 truncate max-w-[80px]">{currentPlay.organization}</span>
        <span className="text-white/60">·</span>
        <span className="font-semibold text-emerald-400">{currentPlay.score}점</span>
        <span className="text-white/60">·</span>
        <span className="text-white/70 whitespace-nowrap">{formatTimeAgo(currentPlay.created_at)}</span>
      </div>
    </div>
  );
}

