"use client";

import { useCallback, useMemo, useState } from "react";
import {
  TOMATO_COLS as COLS,
  TOMATO_ROWS as ROWS,
  computeSelectedIndicesFromRect,
} from "@/lib/apple-game";
import type { Cell } from "../../shared/types";

type GameState = "idle" | "running" | "ended";

export function useDragSelection(
  gameState: GameState,
  cells: Cell[],
  boardRef: React.RefObject<HTMLDivElement | null>,
  onClear: (indices: number[], sum: number) => void
) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const computeSelectedIndices = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!boardRef.current) return [] as number[];
      const rect = boardRef.current.getBoundingClientRect();
      const removedMask = cells.map((c) => c.removed);
      return computeSelectedIndicesFromRect(rect.width, rect.height, x1, y1, x2, y2, ROWS, COLS, removedMask);
    },
    [cells, boardRef]
  );

  const selectionSum = useMemo(() => {
    return selectedIndices.reduce((acc, idx) => {
      const cell = cells[idx];
      if (!cell || cell.removed) return acc;
      return acc + cell.value;
    }, 0);
  }, [selectedIndices, cells]);

  const clearSelection = useCallback(() => {
    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    setSelectedIndices([]);
  }, []);

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
    [gameState, boardRef]
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
    [isDragging, startPos, computeSelectedIndices, boardRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (selectionSum === 10 && selectedIndices.length > 0) {
        onClear(selectedIndices, selectionSum);
      }
      clearSelection();
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}
    },
    [isDragging, selectionSum, selectedIndices, clearSelection, onClear]
  );

  const selectionRect = useMemo(() => {
    if (!isDragging || !startPos || !currentPos)
      return null as null | {
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

  return {
    isDragging,
    selectedIndices,
    selectionRect,
    selectionSum,
    sumIsTen,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    clearSelection,
  };
}

