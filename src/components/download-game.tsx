"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  APPLE_COLS as COLS,
  APPLE_ROWS as ROWS,
  GAME_SECONDS,
  computeSelectedIndicesFromRect,
  formatTime,
  generateValues,
} from "@/lib/apple-game";

type DownloadGameProps = {
  onClose: () => void;
};

type Cell = {
  id: number;
  value: number;
  removed: boolean;
};

export function DownloadGame({ onClose }: DownloadGameProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [cells, setCells] = useState<Cell[]>(() => {
    const values = generateValues(ROWS, COLS);
    return values.map((v, i) => ({ id: i, value: v, removed: false }));
  });
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_SECONDS);
  const [gameState, setGameState] = useState<"idle" | "running" | "ended">("idle");

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const resetGame = useCallback(() => {
    const values = generateValues(ROWS, COLS);
    setCells(values.map((v, i) => ({ id: i, value: v, removed: false })));
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setGameState("idle");
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectedIndices([]);
  }, []);

  // 타이머
  useEffect(() => {
    if (gameState !== "running") return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState("ended");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const selectionSum = useMemo(() => {
    return selectedIndices.reduce((acc, idx) => {
      const cell = cells[idx];
      if (!cell || cell.removed) return acc;
      return acc + cell.value;
    }, 0);
  }, [selectedIndices, cells]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (gameState !== "running") return;
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setStartPos({ x, y });
      setCurrentPos({ x, y });
      setSelectedIndices([]);
      try {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      } catch {}
    },
    [gameState]
  );

  const computeSelectedIndices = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!boardRef.current) return [] as number[];
      const rect = boardRef.current.getBoundingClientRect();
      const removedMask = cells.map((c) => c.removed);
      return computeSelectedIndicesFromRect(
        rect.width,
        rect.height,
        x1,
        y1,
        x2,
        y2,
        ROWS,
        COLS,
        removedMask
      );
    },
    [cells]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !boardRef.current || !startPos) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentPos({ x, y });
      const inds = computeSelectedIndices(startPos.x, startPos.y, x, y);
      setSelectedIndices(inds);
    },
    [isDragging, startPos, computeSelectedIndices]
  );

  const clearSelection = useCallback(() => {
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectedIndices([]);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (selectionSum === 10 && selectedIndices.length > 0) {
        setCells((prev) => {
          const next = prev.slice();
          selectedIndices.forEach((idx) => {
            if (next[idx]) next[idx] = { ...next[idx], removed: true };
          });
          return next;
        });
        setScore((s) => s + selectedIndices.length);
      }
      clearSelection();
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [isDragging, selectionSum, selectedIndices, clearSelection]
  );

  const selectionRect = useMemo(() => {
    if (!isDragging || !startPos || !currentPos) return null as null | {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(startPos.x - currentPos.x);
    const height = Math.abs(startPos.y - currentPos.y);
    return { left, top, width, height };
  }, [isDragging, startPos, currentPos]);

  const sumIsTen = selectionSum === 10 && selectedIndices.length > 0;

  const handleStart = useCallback(() => {
    if (gameState === "idle") {
      setGameState("running");
    }
  }, [gameState]);

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-fade-in p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <div className="font-semibold text-lg sm:text-xl">사과 게임</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>닫기</Button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm sm:text-base">
            <span className="px-3 py-1 rounded-md bg-gray-100">점수: <b>{score}</b></span>
            <span className={cn("px-3 py-1 rounded-md", timeLeft <= 10 ? "bg-red-100 text-red-700" : "bg-gray-100")}>남은 시간: <b>{formatTime(timeLeft)}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleStart} disabled={gameState !== "idle"}>시작</Button>
            <Button variant="outline" onClick={resetGame}>리셋</Button>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-5">
          <div
            ref={boardRef}
            className={cn(
              "relative w-full mx-auto bg-green-50 rounded-lg border overflow-hidden select-none",
              "aspect-[17/10]"
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            // 모바일 스크롤 방지 및 터치 부드럽게
            style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
          >
            {/* 그리드 */}
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
            >
              {cells.map((cell) => (
                <div
                  key={cell.id}
                  className={cn(
                    "relative flex items-center justify-center border-[0.5px] border-emerald-200",
                    cell.removed ? "bg-transparent" : "bg-white"
                  )}
                >
                  {!cell.removed ? (
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-transform will-change-transform",
                        sumIsTen && isDragging && selectedIndices.includes(cell.id)
                          ? "bg-red-500 text-white scale-105"
                          : "bg-rose-200 text-rose-900"
                      )}
                    >
                      {cell.value}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* 드래그 박스 */}
            {selectionRect ? (
              <div
                className={cn(
                  "absolute border-2 rounded-sm pointer-events-none",
                  sumIsTen ? "border-red-500 bg-red-500/10" : "border-gray-400 bg-gray-400/10"
                )}
                style={{
                  left: selectionRect.left,
                  top: selectionRect.top,
                  width: selectionRect.width,
                  height: selectionRect.height,
                }}
              />
            ) : null}
          </div>

          {/* 가이드 텍스트 */}
          <div className="mt-3 text-xs sm:text-sm text-gray-600">
            - 사각형으로 드래그하여 숫자 합이 정확히 10인 사과들을 제거하세요. 합이 10이면 박스가 빨간색으로 표시됩니다.
          </div>
        </div>

        {/* 종료 화면 */}
        {gameState === "ended" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl text-center">
              <div className="text-xl sm:text-2xl font-bold mb-2">게임 종료</div>
              <div className="text-base sm:text-lg mb-6">최종 점수: <b>{score}</b></div>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetGame}>재도전</Button>
                <Button variant="secondary" onClick={onClose}>닫기</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
