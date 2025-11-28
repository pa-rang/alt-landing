"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { TOMATO_COLS as COLS, TOMATO_ROWS as ROWS } from "@/lib/apple-game";
import type { Cell } from "../../shared/types";

type SelectionRect = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

type GameBoardProps = {
  cells: Cell[];
  selectedIndices: number[];
  selectionRect: SelectionRect;
  sumIsTen: boolean;
  isDragging: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function GameBoard({
  cells,
  selectedIndices,
  selectionRect,
  sumIsTen,
  isDragging,
  boardRef,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: GameBoardProps) {
  return (
    <div
      ref={boardRef}
      className={cn(
        "relative bg-green-50 rounded-lg border overflow-hidden select-none mx-auto w-fit",
        "grid"
      )}
      style={{
        gridTemplateColumns: `repeat(${COLS}, 40px)`,
        gridTemplateRows: `repeat(${ROWS}, 40px)`,
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
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
                "w-10 h-10 flex items-center justify-center text-base sm:text-lg font-semibold transition-transform will-change-transform relative overflow-hidden rounded-lg",
                sumIsTen && isDragging && selectedIndices.includes(cell.id) ? "scale-105" : ""
              )}
            >
              <Image
                src="/apple_game_items/gemini_tomato_removebg.png"
                alt="tomato"
                fill
                className="object-contain select-none"
                unoptimized
                draggable={false}
              />
              <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {cell.value}
              </span>
            </div>
          ) : null}
        </div>
      ))}

      {/* 드래그 박스 */}
      {selectionRect ? (
        <div
          className={cn(
            "absolute border-2 pointer-events-none",
            sumIsTen ? "border-emerald-500 bg-emerald-500/10" : "border-yellow-500 bg-yellow-500/10"
          )}
          style={{
            left: selectionRect.left,
            top: selectionRect.top,
            width: selectionRect.width,
            height: selectionRect.height,
          }}
        />
      ) : null}

      {/* Children (e.g., GameStartOverlay) */}
      {children}
    </div>
  );
}

