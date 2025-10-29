"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionary";

type GameScoreSubmitProps = {
  score: number;
  dictionary: Dictionary["game"]["scoreSubmit"];
  onSuccess: (data: { email: string; organization: string; rank: number }) => void;
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
      // TLD 제거 (예: kaist.ac.kr -> kaist, gmail.com -> gmail)
      const domainParts = domain.split(".");
      const organization = domainParts.slice(0, -1).join(".") || domainParts[0];
      setOrganization(organization);
      setNickname(localPart);
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
        onSuccess({ email, organization, rank: data.rank });
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
        <div className="text-sm text-gray-600">{dictionary.rankMessage.replace("{{rank}}", String(state.rank))}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-1">{dictionary.title}</h3>
        <p className="text-sm text-gray-600">{dictionary.description}</p>
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
        <Label htmlFor="organization">{dictionary.organizationLabel}</Label>
        <Input
          id="organization"
          type="text"
          placeholder={dictionary.organizationPlaceholder}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          disabled={isSubmitting}
          required
          className="mt-2"
        />
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
        {isSubmitting ? dictionary.submitting : dictionary.submit}
      </Button>
    </form>
  );
}
