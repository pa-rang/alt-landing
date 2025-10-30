"use client";

import { useState, useEffect } from "react";
import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { DOWNLOAD_THRESHOLD_SCORE } from "@/lib/apple-game";
import { DownloadButton } from "./download-button";

const ALT_DOWNLOAD_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/Alt-0.0.6-arm64.dmg";
const STORAGE_EMAIL_KEY = "squareTomatoGameEmail";
const STORAGE_NICKNAME_KEY = "squareTomatoGameNickname";

type GameScoreSubmitProps = {
  score: number;
  bestScore: number;
  dictionary: Dictionary["game"]["scoreSubmit"];
  onSuccess: (data: { email: string; organization: string; rank: number }) => void;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; rank: number }
  | { status: "error"; message: string };

export function GameScoreSubmit({ score, bestScore, dictionary, onSuccess }: GameScoreSubmitProps) {
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [nickname, setNickname] = useState("");
  const [hasManualNickname, setHasManualNickname] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // 로컬스토리지에서 이메일/닉네임 불러오기
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);
      const savedNickname = localStorage.getItem(STORAGE_NICKNAME_KEY);

      if (savedEmail) {
        setEmail(savedEmail);
      }

      if (savedNickname) {
        setNickname(savedNickname);
        // 저장된 닉네임이 있으면 자동완성으로 덮어쓰지 않도록 플래그 설정
        setHasManualNickname(true);
      }

      // 초기화 완료
      setIsInitialized(true);
    } catch (error) {
      console.error("로컬스토리지에서 정보를 불러오지 못했습니다.", error);
      setIsInitialized(true);
    }
  }, []);

  // 이메일 로컬스토리지에 저장 (입력 중에만 저장)
  useEffect(() => {
    try {
      if (email) {
        localStorage.setItem(STORAGE_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(STORAGE_EMAIL_KEY);
      }
    } catch (error) {
      console.error("로컬스토리지에 이메일을 저장하지 못했습니다.", error);
    }
  }, [email]);

  // 닉네임은 수동으로 입력된 경우에만 로컬스토리지에 저장
  useEffect(() => {
    try {
      if (hasManualNickname && nickname) {
        localStorage.setItem(STORAGE_NICKNAME_KEY, nickname);
      }
    } catch (error) {
      console.error("로컬스토리지에 닉네임을 저장하지 못했습니다.", error);
    }
  }, [nickname, hasManualNickname]);

  // 이메일 변경 시 자동으로 organization과 nickname 업데이트 (초기화 후에만)
  useEffect(() => {
    // 초기 로드 시에는 실행하지 않음 (로컬스토리지에서 불러온 값 보존)
    if (!isInitialized) return;

    if (email.includes("@")) {
      const [localPart, domain] = email.split("@");
      // 도메인 파싱: 3개 이상이면 첫 번째만, 2개면 마지막 제거
      // 예: kaist.ac.kr -> kaist, gmail.com -> gmail
      const domainParts = domain.split(".");
      const parsedOrganization = domainParts.length > 2 ? domainParts[0] : domainParts.slice(0, -1).join(".");
      setOrganization(parsedOrganization);
      if (!hasManualNickname) {
        setNickname(localPart);
      }
    } else {
      setOrganization("");
      if (!hasManualNickname) {
        setNickname("");
      }
    }
  }, [email, hasManualNickname, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // 현재 점수가 최고 점수보다 낮으면 API 호출 없이 바로 닫기
    if (score <= bestScore) {
      // 닫기 전에도 입력한 정보는 저장
      try {
        if (email) localStorage.setItem(STORAGE_EMAIL_KEY, email);
        if (nickname) localStorage.setItem(STORAGE_NICKNAME_KEY, nickname);
      } catch (error) {
        console.error("정보 저장 실패:", error);
      }
      onSuccess({
        email,
        organization,
        rank: 0, // 업데이트 안함
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
        // 제출 성공 시 이메일과 닉네임을 로컬스토리지에 저장
        try {
          localStorage.setItem(STORAGE_EMAIL_KEY, email);
          localStorage.setItem(STORAGE_NICKNAME_KEY, nickname);
        } catch (error) {
          console.error("제출 후 정보 저장 실패:", error);
        }

        // 새 최고 기록일 때만 성공 상태로 전환
        if (data.isNewHighScore) {
          setState({ status: "success", rank: data.rank });
          onSuccess({
            email,
            organization,
            rank: data.rank,
          });
        } else {
          // 기존 기록 갱신 안됨 - 그냥 닫기
          onSuccess({
            email,
            organization,
            rank: data.rank,
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
          <DownloadButton downloadUrl={ALT_DOWNLOAD_URL} className="w-full bg-blue-600 hover:bg-blue-700">
            {dictionary.downloadAlt}
          </DownloadButton>
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
            onChange={(e) => {
              setNickname(e.target.value);
              setHasManualNickname(true);
            }}
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
          <DownloadButton
            downloadUrl={ALT_DOWNLOAD_URL}
            className="bg-black hover:bg-gray-800"
            icon={<ArrowDownToLine className="mr-2 h-4 w-4" />}
          >
            Download for macOS
          </DownloadButton>
          <Button type="submit" variant="outline" disabled={isSubmitting}>
            {isSubmitting ? dictionary.submitting : dictionary.submitLeaderboard}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? dictionary.submitting : dictionary.submitLeaderboard}
          </Button>
        </div>
      )}
    </form>
  );
}
