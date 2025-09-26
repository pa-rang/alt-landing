"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import {
  createWaitlistSchema,
  type PlatformValue,
  type WaitlistInput,
} from "@/lib/validation/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


type FormStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type FieldErrors = Partial<Record<keyof WaitlistInput, string>>;

type WaitlistDialogDictionary = Dictionary["waitlistForm"];

type WaitlistDialogProps = {
  locale: Locale;
  dictionary: WaitlistDialogDictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail: string;
};

type ServerFieldErrors = Partial<Record<keyof WaitlistInput, string>>;

function parseServerFieldErrors(input: unknown): ServerFieldErrors {
  if (!input || typeof input !== "object") {
    return {};
  }

  const result: ServerFieldErrors = {};
  for (const key of ["email", "platform", "featureRequest"] satisfies Array<keyof WaitlistInput>) {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      result[key] = value;
    }
  }

  return result;
}

export function WaitlistDialog({ locale, dictionary, open, onOpenChange, initialEmail }: WaitlistDialogProps) {
  const [email, setEmail] = useState(initialEmail);
  const [platform, setPlatform] = useState<PlatformValue>("mac");
  const [featureRequest, setFeatureRequest] = useState("");
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  const waitlistSchema = useMemo(() => createWaitlistSchema(dictionary.validation), [dictionary.validation]);

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
      setStatus({ state: "error", message: dictionary.messages.validationError });
      return;
    }

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify(parseResult.data),
      });

      const payload = await response.json();

      if (!response.ok) {
        const serverFieldErrors = parseServerFieldErrors(payload?.fieldErrors);
        if (response.status === 409 && !serverFieldErrors.email) {
          serverFieldErrors.email = dictionary.messages.duplicateEmail;
        }
        if (Object.keys(serverFieldErrors).length > 0) {
          setErrors(serverFieldErrors);
        }

        const errorMessage =
          typeof payload?.error === "string" && payload.error.trim().length > 0
            ? payload.error
            : dictionary.messages.genericError;
        setStatus({ state: "error", message: errorMessage });
        return;
      }

      setStatus({ state: "success", message: dictionary.messages.success });
      toast.success(dictionary.messages.success);
      setEmail("");
      setPlatform("mac");
      setFeatureRequest("");
      onOpenChange(false);
    } catch (error) {
      console.error("waitlist submit failed", error);
      const errorMessage = dictionary.messages.unknownError;
      setStatus({ state: "error", message: errorMessage });
      toast.error(errorMessage);
    }
  };

  const isSubmitting = status.state === "submitting";

  // 이메일이 변경될 때마다 상태 업데이트
  if (initialEmail !== email && !open) {
    setEmail(initialEmail);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            거의 다 됐습니다! OS와 기대하는 기능을 알려주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {dictionary.emailLabel}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={dictionary.emailPlaceholder}
              disabled={isSubmitting}
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>
              {dictionary.platformLabel}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-auto py-3 px-4 flex flex-col items-center gap-2 border transition-none hover:bg-background hover:text-foreground",
                  platform === "mac" && "bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground",
                  errors.platform && "border-destructive"
                )}
                onClick={() => setPlatform("mac")}
                disabled={isSubmitting}
              >
                <Image
                  src="/apple.png"
                  alt="macOS"
                  width={24}
                  height={24}
                  className={platform === "mac" ? "brightness-0 invert" : ""}
                />
                <span className="text-sm font-medium">{dictionary.platformOptions.mac}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-auto py-3 px-4 flex flex-col items-center gap-2 border transition-none hover:bg-background hover:text-foreground",
                  platform === "windows" && "bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground",
                  errors.platform && "border-destructive"
                )}
                onClick={() => setPlatform("windows")}
                disabled={isSubmitting}
              >
                <Image
                  src="/windows.svg"
                  alt="Windows"
                  width={24}
                  height={24}
                  className={platform === "windows" ? "brightness-0 invert" : ""}
                />
                <span className="text-sm font-medium">{dictionary.platformOptions.windows}</span>
              </Button>
            </div>
            {errors.platform ? <p className="text-sm text-destructive">{errors.platform}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="featureRequest">
              {dictionary.featureRequestLabel}
            </Label>
            <Textarea
              id="featureRequest"
              name="featureRequest"
              value={featureRequest}
              onChange={(event) => setFeatureRequest(event.target.value)}
              rows={3}
              className={cn(errors.featureRequest && "border-destructive")}
              placeholder={dictionary.featureRequestPlaceholder}
              disabled={isSubmitting}
            />
            {errors.featureRequest ? <p className="text-sm text-destructive">{errors.featureRequest}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? dictionary.submit.submitting : dictionary.submit.idle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}