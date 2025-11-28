"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TOMATO_COLS as COLS,
  TOMATO_ROWS as ROWS,
  GAME_SECONDS,
  generateValues,
} from "@/lib/apple-game";
import { BEST_SCORE_KEY, BEST_RANK_KEY } from "../../shared/constants";
import type { Cell } from "../../shared/types";

type GameState = "idle" | "running" | "ended";

export function useGameState() {
  const [cells, setCells] = useState<Cell[]>(() => {
    const values = generateValues(ROWS, COLS);
    return values.map((v, i) => ({ id: i, value: v, removed: false }));
  });
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_SECONDS);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [showScoreSubmit, setShowScoreSubmit] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    nickname: string;
    organization: string;
    rank: number;
  } | null>(null);
  const [bestScore, setBestScore] = useState<number>(0);
  const [bestRank, setBestRank] = useState<number>(0);
  const [organizationRank, setOrganizationRank] = useState<number>(0);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState<number>(0);

  // 소속 랭킹 정보 불러오기
  const fetchOrganizationRank = useCallback((organization: string) => {
    fetch(`/api/game/best-score?organization=${encodeURIComponent(organization)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setOrganizationRank(data.organizationRank);
          setOrganizationName(organization);
        }
      })
      .catch(console.error);
  }, []);

  // 최고점수, 최고랭크 로컬스토리지에서 불러오기
  useEffect(() => {
    const savedScore = localStorage.getItem(BEST_SCORE_KEY);
    if (savedScore) {
      setBestScore(parseInt(savedScore, 10));
    }

    const savedRank = localStorage.getItem(BEST_RANK_KEY);
    if (savedRank) {
      setBestRank(parseInt(savedRank, 10));
    }

    const organization = localStorage.getItem("squareTomatoGameOrganization");
    if (organization) {
      setOrganizationName(organization);
      fetchOrganizationRank(organization);
    }
  }, [fetchOrganizationRank]);

  const resetGame = useCallback(() => {
    const values = generateValues(ROWS, COLS);
    setCells(values.map((v, i) => ({ id: i, value: v, removed: false })));
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setGameState("idle");
    setShowScoreSubmit(false);
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
          setShowScoreSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // 게임 종료 시 최고점수 업데이트
  useEffect(() => {
    if (gameState === "ended") {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      }
    }
  }, [gameState, score, bestScore]);

  const startGame = useCallback(() => {
    if (gameState === "idle") {
      resetGame();
      setGameState("running");
    }
  }, [gameState, resetGame]);

  const removeCells = useCallback((indices: number[]) => {
    setCells((prev) => {
      const next = prev.slice();
      indices.forEach((idx) => {
        if (next[idx]) next[idx] = { ...next[idx], removed: true };
      });
      return next;
    });
    setScore((s) => s + indices.length);
  }, []);

  const handleScoreSubmitSuccess = useCallback(
    (data: { nickname: string; organization: string; rank: number }) => {
      setSubmittedData({ nickname: data.nickname, organization: data.organization, rank: data.rank });
      setShowScoreSubmit(false);
      setLeaderboardRefreshTrigger((prev) => prev + 1);
      fetchOrganizationRank(data.organization);

      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      }

      if (bestRank === 0 || data.rank < bestRank) {
        setBestRank(data.rank);
        localStorage.setItem(BEST_RANK_KEY, String(data.rank));
      }
    },
    [fetchOrganizationRank, score, bestScore, bestRank]
  );

  return {
    // State
    cells,
    score,
    timeLeft,
    gameState,
    showScoreSubmit,
    submittedData,
    bestScore,
    bestRank,
    organizationRank,
    organizationName,
    leaderboardRefreshTrigger,
    // Setters
    setTimeLeft,
    setShowScoreSubmit,
    setGameState,
    // Actions
    resetGame,
    startGame,
    removeCells,
    handleScoreSubmitSuccess,
  };
}

