"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { DOWNLOAD_THRESHOLD_SCORE } from "@/lib/apple-game";

const ALT_DOWNLOAD_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/Alt-0.0.6-arm64.dmg";

type GameScoreSubmitProps = {
  score: number;
  bestScore: number;
  dictionary: Dictionary["game"]["scoreSubmit"];
  onSuccess: (data: { email: string; organization: string; rank: number; bestScore: number }) => void;
  initialEmail?: string;
  initialNickname?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; rank: number }
  | { status: "error"; message: string };

export function GameScoreSubmit({ score, bestScore, dictionary, onSuccess, initialEmail, initialNickname }: GameScoreSubmitProps) {
  const [email, setEmail] = useState(initialEmail || "");
  const [organization, setOrganization] = useState("");
  const [nickname, setNickname] = useState(initialNickname || "");
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 이메일 변경 시 자동으로 organization과 nickname 업데이트
  useEffect(() => {
    if (email.includes("@")) {
      const [localPart, domain] = email.split("@");
      // 도메인 파싱: 3개 이상이면 첫 번째만, 2개면 마지막 제거
      // 예: kaist.ac.kr -> kaist, gmail.com -> gmail
      const domainParts = domain.split(".");
      const parsedOrganization = domainParts.length > 2 ? domainParts[0] : domainParts.slice(0, -1).join(".");
      setOrganization(parsedOrganization);
      // initialNickname이 있으면 유지, 없으면 이메일에서 파싱
      if (!initialNickname) {
        setNickname(localPart);
      }
    } else {
      setOrganization("");
      if (!initialNickname) {
        setNickname("");
      }
    }
  }, [email, initialNickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // 현재 점수가 최고 점수보다 낮으면 API 호출 없이 바로 닫기
    if (score <= bestScore) {
      onSuccess({
        email,
        organization,
        rank: 0, // 업데이트 안함
        bestScore: bestScore,
      });
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
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
        // 새 최고 기록일 때만 성공 상태로 전환
        if (data.isNewHighScore) {
          setState({ status: "success", rank: data.rank });
          onSuccess({
            email,
            organization,
            rank: data.rank,
            bestScore: data.score.score,
          });
        } else {
          // 기존 기록 갱신 안됨 - 그냥 닫기
          onSuccess({
            email,
            organization,
            rank: data.rank,
            bestScore: data.score.score,
          });
        }
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
    return (
      <div className="text-center py-6">
        <div className="text-2xl font-bold text-green-600 mb-2">🎉</div>
        <div className="text-lg font-semibold mb-1">{dictionary.success}</div>
        <div className="text-sm text-gray-600 mb-4">
          {dictionary.rankMessage.replace("{{rank}}", String(state.rank))}
        </div>
        {score >= DOWNLOAD_THRESHOLD_SCORE && (
          <Button
            onClick={() => window.open(ALT_DOWNLOAD_URL, "_blank")}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {dictionary.downloadAlt}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <div className="mt-2 text-2xl font-bold text-blue-600">{score}점</div>
        {bestScore > 0 && (
          <div className="mt-1 text-sm text-gray-500">
            BEST <span className="font-semibold">{bestScore}</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Label htmlFor="email" className="w-24 text-sm shrink-0">
            {dictionary.emailLabel}
          </Label>
          <Input
            id="email"
            type="email"
            placeholder={dictionary.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            className="h-8 text-sm"
          />
        </div>
        {fieldErrors.email && <p className="text-xs text-red-500 mt-1 ml-28">{fieldErrors.email}</p>}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Label className="w-24 text-sm shrink-0">{dictionary.organizationLabel}</Label>
          <div className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-sm h-8 flex items-center">
            {organization || "-"}
          </div>
        </div>
        {fieldErrors.organization && <p className="text-xs text-red-500 mt-1 ml-28">{fieldErrors.organization}</p>}
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

      {state.status === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{state.message}</div>
      )}

      {score >= DOWNLOAD_THRESHOLD_SCORE ? (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => window.open(ALT_DOWNLOAD_URL, "_blank")}
            className="bg-black hover:bg-gray-800"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Download for macOS
          </Button>
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? dictionary.submitting : dictionary.close}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? dictionary.submitting : dictionary.close}
          </Button>
        </div>
      )}
    </form>
  );
}
