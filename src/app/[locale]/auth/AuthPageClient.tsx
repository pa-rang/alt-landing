"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

type AuthPageClientProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function AuthPageClient({ locale, dictionary }: AuthPageClientProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: otp }),
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
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">{dictionary.auth.title}</h1>
          <p className="text-sm text-muted-foreground">{dictionary.auth.subtitle}</p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <Input
              id="email"
              type="email"
              className="h-10 border-none shadow-none bg-[#ecede6]"
              placeholder={dictionary.auth.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? dictionary.auth.sending : dictionary.auth.sendCode}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">{dictionary.auth.otpLabel}</Label>
              <Input
                id="otp"
                type="text"
                placeholder={dictionary.auth.otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                }}
                disabled={loading}
              >
                {dictionary.auth.backToEmail}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? dictionary.auth.verifying : dictionary.auth.verifyCode}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
