"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AuthPageClientProps = {
  locale: Locale;
  dictionary: Dictionary;
};

const EMAIL_STORAGE_KEY = "auth_email";

export function AuthPageClient({ locale, dictionary }: AuthPageClientProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 로컬 스토리지에서 이메일 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // 이메일 단계일 때 이메일 input에 focus
  useEffect(() => {
    if (step === "email" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [step]);

  // OTP 단계로 변경될 때 첫 번째 OTP input에 focus
  useEffect(() => {
    if (step === "otp" && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [step]);

  // 이메일 변경 시 로컬 스토리지에 저장
  const handleEmailChange = (value: string) => {
    setEmail(value);
    localStorage.setItem(EMAIL_STORAGE_KEY, value);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 이메일을 로컬 스토리지에 저장
    localStorage.setItem(EMAIL_STORAGE_KEY, email);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || dictionary.auth.messages.genericError);
        return;
      }

      toast.success(dictionary.auth.messages.codeSent);
      setStep("otp");
    } catch {
      toast.error(dictionary.auth.messages.serverError);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // 숫자만 허용
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // 다음 input으로 포커스 이동
    if (digit && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // 백스페이스 시 이전 input으로 포커스 이동
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);
    // 마지막 입력된 위치로 포커스 이동
    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const otpCode = otp.join("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || dictionary.auth.messages.otpInvalid);
        return;
      }

      toast.success(dictionary.auth.messages.verificationSuccess);
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      toast.error(dictionary.auth.messages.serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 md:pt-32 pt-20">
      <div className="w-full max-w-lg space-y-10">
        <div className="text-center space-y-3">
          {step === "email" ? (
            <>
              <h1 className="text-3xl font-bold">{dictionary.auth.title}</h1>
              <p className="text-sm text-muted-foreground">{dictionary.auth.subtitle}</p>
            </>
          ) : (
            <h1 className="text-3xl font-bold">{dictionary.auth.otpSubtitle}</h1>
          )}
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <Input
              ref={emailInputRef}
              id="email"
              type="email"
              className="h-10 border-none shadow-none bg-[#e4e5de]"
              placeholder={dictionary.auth.emailPlaceholder}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? dictionary.auth.sending : dictionary.auth.sendCode}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-8">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  className="h-14 w-10 text-center text-xl font-mono bg-[#e4e5de] shadow-none border-none"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  maxLength={1}
                  required
                  disabled={loading}
                />
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="secondary"
                className="bg-white w-36"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                }}
                disabled={loading}
              >
                {dictionary.auth.backToEmail}
              </Button>
              <Button type="submit" className="w-36" disabled={loading}>
                {loading ? dictionary.auth.verifying : dictionary.auth.verifyCode}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
