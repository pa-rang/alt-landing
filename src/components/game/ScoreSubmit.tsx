"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionary";

// GA4 이벤트 추적 함수
function trackScoreSubmit(score: number, isNewHighScore: boolean, rank: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'score_submit', {
      event_category: 'game',
      event_label: 'leaderboard_submission',
      score_value: score,
      is_new_high_score: isNewHighScore,
      player_rank: rank,
      timestamp: new Date().toISOString()
    });
  }
}

const STORAGE_NICKNAME_KEY = "squareTomatoGameNickname";
const STORAGE_ORGANIZATION_KEY = "squareTomatoGameOrganization";

type GameScoreSubmitProps = {
  score: number;
  bestScore: number;
  dictionary: Dictionary["game"]["scoreSubmit"];
  onSuccess: (data: { nickname: string; organization: string; rank: number }) => void;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; rank: number; isNewHighScore: boolean; previousScore?: number }
  | { status: "error"; message: string };

export function GameScoreSubmit({ score, bestScore, dictionary, onSuccess }: GameScoreSubmitProps) {
  const [organization, setOrganization] = useState("");
  const [nickname, setNickname] = useState("");
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 로컬스토리지에서 닉네임/학교·직장 불러오기
  useEffect(() => {
    try {
      const savedNickname = localStorage.getItem(STORAGE_NICKNAME_KEY);
      const savedOrganization = localStorage.getItem(STORAGE_ORGANIZATION_KEY);

      if (savedNickname) {
        setNickname(savedNickname);
      }

      if (savedOrganization) {
        setOrganization(savedOrganization);
      }
    } catch (error) {
      console.error("로컬스토리지에서 정보를 불러오지 못했습니다.", error);
    }
  }, []);

  // 닉네임과 organization 로컬스토리지에 저장
  useEffect(() => {
    try {
      if (nickname) {
        localStorage.setItem(STORAGE_NICKNAME_KEY, nickname);
      }
      if (organization) {
        localStorage.setItem(STORAGE_ORGANIZATION_KEY, organization);
      }
    } catch (error) {
      console.error("로컬스토리지에 정보를 저장하지 못했습니다.", error);
    }
  }, [nickname, organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization,
          nickname,
          score,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setState({ status: "error", message: data.error || dictionary.messages.genericError });
        return;
      }

      if (data.ok) {
        // 제출 성공 시 닉네임과 organization을 로컬스토리지에 저장
        try {
          localStorage.setItem(STORAGE_NICKNAME_KEY, nickname);
          localStorage.setItem(STORAGE_ORGANIZATION_KEY, organization);
        } catch (error) {
          console.error("제출 후 정보 저장 실패:", error);
        }

        // GA4 이벤트 추적
        trackScoreSubmit(score, data.isNewHighScore, data.rank);

        // 성공 상태로 전환 (신기록 여부와 관계없이)
        setState({
          status: "success",
          rank: data.rank,
          isNewHighScore: data.isNewHighScore,
          previousScore: data.previousScore,
        });

        onSuccess({
          nickname,
          organization,
          rank: data.rank,
        });
      } else {
        setState({ status: "error", message: data.error || dictionary.messages.genericError });
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      setState({ status: "error", message: dictionary.messages.serverError });
    }
  };

  const isSubmitting = state.status === "submitting";
  const isSuccess = state.status === "success";

  if (isSuccess && state.status === "success") {
    if (state.isNewHighScore) {
      // 신기록 달성
      return (
        <div className="text-center py-6">
          <div className="text-2xl font-bold text-green-600 mb-2">🎉</div>
          <div className="text-lg font-semibold mb-1">{dictionary.success}</div>
          <div className="text-sm text-gray-600 mb-4">
            {dictionary.rankMessage.replace("{{rank}}", String(state.rank))}
          </div>
        </div>
      );
    } else {
      // 기존 점수 유지
      return (
        <div className="text-center py-6">
          <div className="text-2xl font-bold text-blue-600 mb-2">ℹ️</div>
          <div className="text-lg font-semibold mb-1">{dictionary.recordSubmitted}</div>
          <div className="text-sm text-gray-600 mb-2">
            {dictionary.previousScoreMaintained.replace("{{previousScore}}", String(state.previousScore))}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {dictionary.currentRank.replace("{{rank}}", String(state.rank))}
          </div>
        </div>
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <div className="mt-2 text-2xl font-bold text-blue-600">
          {score}
          {dictionary.pointsUnit}
        </div>
        {bestScore > 0 && (
          <div className="mt-1 text-sm text-gray-500">
            BEST <span className="font-semibold">{bestScore}</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Label htmlFor="nickname" className="w-24 text-sm shrink-0">
            {dictionary.nicknameLabel}
          </Label>
          <Input
            id="nickname"
            type="text"
            placeholder={dictionary.nicknamePlaceholder}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-8 text-sm"
          />
        </div>
        {fieldErrors.nickname && <p className="text-xs text-red-500 mt-1 ml-28">{fieldErrors.nickname}</p>}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Label htmlFor="organization" className="w-24 text-sm shrink-0">
            {dictionary.organizationLabel}
          </Label>
          <Input
            id="organization"
            type="text"
            placeholder={dictionary.organizationPlaceholder || "학교/직장명"}
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-8 text-sm"
          />
        </div>
        {fieldErrors.organization && <p className="text-xs text-red-500 mt-1 ml-28">{fieldErrors.organization}</p>}
      </div>

      {state.status === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{state.message}</div>
      )}

      <div className="h-2" />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? dictionary.submitting : dictionary.submitLeaderboard}
        </Button>
      </div>
    </form>
  );
}
