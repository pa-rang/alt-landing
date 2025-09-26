"use client";

import { useState, FormEvent } from "react";
import { waitlistSchema, platformEnum, type WaitlistInput } from "@/lib/validation/waitlist";

type FormStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type FieldErrors = Partial<Record<keyof WaitlistInput, string>>;

const PLATFORMS = platformEnum.options;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>("mac");
  const [featureRequest, setFeatureRequest] = useState("");
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  const resetErrors = () => setErrors({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetErrors();
    setStatus({ state: "submitting" });

    const parseResult = waitlistSchema.safeParse({
      email,
      platform,
      featureRequest: featureRequest || undefined,
    });

    if (!parseResult.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          fieldErrors[path as keyof WaitlistInput] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setStatus({ state: "error", message: "입력값을 확인해주세요." });
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseResult.data),
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = typeof payload?.error === "string" ? payload.error : "등록에 실패했습니다.";
        setStatus({ state: "error", message });
        return;
      }

      setStatus({ state: "success", message: "웨이팅 리스트에 등록되었습니다!" });
      setEmail("");
      setPlatform("mac");
      setFeatureRequest("");
    } catch (error) {
      console.error("waitlist submit failed", error);
      setStatus({ state: "error", message: "알 수 없는 오류가 발생했습니다." });
    }
  };

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground"
          placeholder="you@example.com"
          disabled={isSubmitting}
        />
        {errors.email ? <p className="text-sm text-red-500">{errors.email}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="platform" className="block text-sm font-medium text-foreground">
          플랫폼
        </label>
        <select
          id="platform"
          name="platform"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as typeof PLATFORMS[number])}
          className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground"
          disabled={isSubmitting}
        >
          {PLATFORMS.map((option) => (
            <option key={option} value={option}>
              {option === "mac" ? "Mac" : "Windows"}
            </option>
          ))}
        </select>
        {errors.platform ? <p className="text-sm text-red-500">{errors.platform}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="featureRequest" className="block text-sm font-medium text-foreground">
          기대하는 기능 (선택)
        </label>
        <textarea
          id="featureRequest"
          name="featureRequest"
          value={featureRequest}
          onChange={(event) => setFeatureRequest(event.target.value)}
          rows={4}
          className="w-full rounded-md border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground"
          placeholder="원하는 기능이나 사용 목적을 알려주세요."
          disabled={isSubmitting}
        />
        {errors.featureRequest ? <p className="text-sm text-red-500">{errors.featureRequest}</p> : null}
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-foreground px-4 py-2 text-background transition hover:opacity-90 disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "등록 중..." : "웨이팅 리스트 등록"}
      </button>

      {status.state === "success" ? <p className="text-sm text-green-600">{status.message}</p> : null}
      {status.state === "error" && status.message ? <p className="text-sm text-red-500">{status.message}</p> : null}
    </form>
  );
}
