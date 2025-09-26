"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import {
  PLATFORM_OPTIONS,
  createWaitlistSchema,
  type PlatformValue,
  type WaitlistInput,
} from "@/lib/validation/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLATFORMS = PLATFORM_OPTIONS;

type FormStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type FieldErrors = Partial<Record<keyof WaitlistInput, string>>;

type WaitlistFormDictionary = Dictionary["waitlistForm"];

type WaitlistFormProps = {
  locale: Locale;
  dictionary: WaitlistFormDictionary;
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

export function WaitlistForm({ locale, dictionary }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
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
    } catch (error) {
      console.error("waitlist submit failed", error);
      const errorMessage = dictionary.messages.unknownError;
      setStatus({ state: "error", message: errorMessage });
      toast.error(errorMessage);
    }
  };

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
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
        <Label htmlFor="platform">
          {dictionary.platformLabel}
        </Label>
        <Select
          value={platform}
          onValueChange={(value) => setPlatform(value as PlatformValue)}
          disabled={isSubmitting}
        >
          <SelectTrigger className={cn(errors.platform && "border-destructive")}>
            <SelectValue placeholder={dictionary.platformOptions[platform]} />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((option) => (
              <SelectItem key={option} value={option}>
                {dictionary.platformOptions[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          rows={4}
          className={cn(errors.featureRequest && "border-destructive")}
          placeholder={dictionary.featureRequestPlaceholder}
          disabled={isSubmitting}
        />
        {errors.featureRequest ? <p className="text-sm text-destructive">{errors.featureRequest}</p> : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? dictionary.submit.submitting : dictionary.submit.idle}
      </Button>
    </form>
  );
}
