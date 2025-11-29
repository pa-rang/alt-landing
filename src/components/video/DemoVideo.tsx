"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { isMobileDevice } from "@/lib/device";

interface DemoVideoProps {
  src: string;
  poster?: string;
  className?: string;
  fallbackImage?: string;
}

export function DemoVideo({ src, poster, className = "", fallbackImage = "/alt_reddit.png" }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 상태 관리
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 컨트롤 자동 숨김
  const resetHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    setShowControls(true);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    resetHideTimer();
  }, [resetHideTimer]);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    resetHideTimer();
  }, [resetHideTimer]);

  // 시크 핸들러
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      video.currentTime = percentage * video.duration;
      resetHideTimer();
    },
    [resetHideTimer]
  );

  // 전체화면 토글
  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // 모바일 기기에서는 비디오 요소 자체에 전체화면 요청
    if (isMobile) {
      // iOS Safari용 (webkitEnterFullscreen은 TypeScript 타입에 없으므로 타입 단언 사용)
      const videoWithWebkit = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
      if (videoWithWebkit.webkitEnterFullscreen && typeof videoWithWebkit.webkitEnterFullscreen === "function") {
        videoWithWebkit.webkitEnterFullscreen();
        return;
      }
      // Android/기타 모바일 브라우저용
      if (video.requestFullscreen) {
        try {
          await video.requestFullscreen();
        } catch (error) {
          console.error("Failed to enter fullscreen on mobile:", error);
        }
        return;
      }
    }

    // 데스크탑에서는 컨테이너 전체를 전체화면으로
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
    resetHideTimer();
  }, [resetHideTimer, isMobile]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 컨테이너가 포커스 받았을 때만 동작
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 5;
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 5;
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen]);

  // 비디오 이벤트 핸들러
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // duration이 유효한 값이면 업데이트
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handleDurationChange = () => {
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("error", handleError);
    };
  }, []);

  // 모바일 감지
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // 에러 시 폴백 이미지
  if (hasError) {
    return (
      <Image
        src={fallbackImage}
        alt="AI Transcript Platform Screenshot"
        width={1600}
        height={964}
        className={`relative z-10 w-full h-auto ${className}`}
        quality={100}
        priority
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group ${className}`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* 버퍼링 인디케이터 */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 비디오 */}
      <video
        ref={videoRef}
        src={src}
        poster={poster || fallbackImage}
        preload="auto"
        playsInline={!isFullscreen}
        muted
        loop
        autoPlay
        className="w-full h-auto rounded-xl"
        onClick={togglePlay}
        controls={isMobile && isFullscreen}
      />

      {/* 컨트롤 바 - 재생바 + 전체화면 버튼 */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 pb-3 px-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* 프로그레스 바 */}
          <div
            className="relative flex-1 h-1 bg-white/30 rounded-full cursor-pointer group/progress"
            onClick={handleSeek}
          >
            {/* 버퍼 진행률 */}
            <div className="absolute top-0 left-0 h-full bg-white/40 rounded-full" style={{ width: `${buffered}%` }} />
            {/* 재생 진행률 */}
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* 시크 핸들 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* 전체화면 */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-white/80 transition-colors shrink-0"
            aria-label="전체화면"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
