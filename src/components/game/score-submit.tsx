"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { DOWNLOAD_THRESHOLD_SCORE } from "@/lib/apple-game";

const ALT_DOWNLOAD_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/Alt-0.0.6-arm64.dmg";

type GameScoreSubmitProps = {
  score: number;
  dictionary: Dictionary["game"]["scoreSubmit"];
  onSuccess: (data: { email: string; organization: string; rank: number; bestScore: number }) => void;
  initialEmail?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; rank: number }
  | { status: "error"; message: string };

export function GameScoreSubmit({ score, dictionary, onSuccess, initialEmail }: GameScoreSubmitProps) {
  const [email, setEmail] = useState(initialEmail || "");
  const [organization, setOrganization] = useState("");
  const [nickname, setNickname] = useState("");
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
      setNickname(localPart);
    } else {
      setOrganization("");
      setNickname("");
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
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
        setState({ status: "success", rank: data.rank });
        onSuccess({
          email,
          organization,
          rank: data.rank,
          bestScore: data.score.score,
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
      </div>

      <div>
        <Label htmlFor="email">{dictionary.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          placeholder={dictionary.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          className="mt-2"
        />
        {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
      </div>

      <div>
        <Label>{dictionary.organizationLabel}</Label>
        <div className="mt-2 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
          {organization || "-"}
        </div>
        {fieldErrors.organization && <p className="text-xs text-red-500 mt-1">{fieldErrors.organization}</p>}
      </div>

      <div>
        <Label htmlFor="nickname">{dictionary.nicknameLabel}</Label>
        <Input
          id="nickname"
          type="text"
          placeholder={dictionary.nicknamePlaceholder}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={isSubmitting}
          required
          className="mt-2"
        />
        {fieldErrors.nickname && <p className="text-xs text-red-500 mt-1">{fieldErrors.nickname}</p>}
      </div>

      {state.status === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{state.message}</div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? dictionary.submitting : score >= DOWNLOAD_THRESHOLD_SCORE ? dictionary.submitHighScore : dictionary.submit}
      </Button>
    </form>
  );
}
