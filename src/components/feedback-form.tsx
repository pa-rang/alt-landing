"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Bug, Lightbulb } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FeedbackFormDictionary = Dictionary["feedback"]["form"];

type FeedbackFormProps = {
  locale: Locale;
  dictionary: FeedbackFormDictionary;
};

type FeedbackFieldErrors = {
  feedbackType?: string;
  content?: string;
  email?: string;
};

export function FeedbackForm({ locale, dictionary }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FeedbackFieldErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 필드 에러 초기화
    setFieldErrors({});

    // 클라이언트 사이드 검증
    const emailResult = z
      .string()
      .trim()
      .min(1, dictionary.validation.emailRequired)
      .email(dictionary.validation.emailInvalid)
      .safeParse(email);

    if (!emailResult.success) {
      setFieldErrors({ email: emailResult.error.issues[0]?.message });
      return;
    }

    if (!feedbackType) {
      setFieldErrors({ feedbackType: dictionary.validation.typeRequired });
      return;
    }

    const contentResult = z.string().trim().min(1, dictionary.validation.contentRequired).safeParse(content);

    if (!contentResult.success) {
      setFieldErrors({ content: contentResult.error.issues[0]?.message });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({
          feedbackType,
          content,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || dictionary.messages.genericError);
      }

      // 성공 메시지 표시
      toast.success(dictionary.messages.success);

      // 폼 초기화
      setFeedbackType("");
      setContent("");
      setEmail("");
      setFieldErrors({});
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast.error(error instanceof Error ? error.message : dictionary.messages.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 피드백 유형 선택 */}
      <div className="space-y-2">
        <Label>{dictionary.typeLabel}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setFeedbackType("issue");
              if (fieldErrors.feedbackType) setFieldErrors({ ...fieldErrors, feedbackType: undefined });
            }}
            className={cn(
              "relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all hover:bg-accent hover:text-accent-foreground",
              feedbackType === "issue" && "border-primary bg-accent",
              fieldErrors.feedbackType && "border-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-500" />
              <span className="font-medium">{dictionary.typeOptions.issue}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setFeedbackType("idea");
              if (fieldErrors.feedbackType) setFieldErrors({ ...fieldErrors, feedbackType: undefined });
            }}
            className={cn(
              "relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all hover:bg-accent hover:text-accent-foreground",
              feedbackType === "idea" && "border-primary bg-accent",
              fieldErrors.feedbackType && "border-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">{dictionary.typeOptions.idea}</span>
            </div>
          </button>
        </div>
        {fieldErrors.feedbackType && <p className="text-sm text-destructive">{fieldErrors.feedbackType}</p>}
      </div>

      {/* 내용 입력 */}
      <div className="space-y-2">
        <Label htmlFor="content">{dictionary.contentLabel}</Label>
        <Textarea
          id="content"
          name="content"
          required
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            if (fieldErrors.content) setFieldErrors({ ...fieldErrors, content: undefined });
          }}
          placeholder={
            feedbackType === "issue"
              ? dictionary.contentPlaceholder.issue
              : feedbackType === "idea"
              ? dictionary.contentPlaceholder.idea
              : dictionary.contentPlaceholder.idea
          }
          className={cn("min-h-32 resize-none", fieldErrors.content && "border-destructive")}
          rows={6}
        />
        {fieldErrors.content && <p className="text-sm text-destructive">{fieldErrors.content}</p>}
      </div>

      {/* 이메일 입력 */}
      <div className="space-y-2">
        <Label htmlFor="email">{dictionary.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
          }}
          placeholder={dictionary.emailPlaceholder}
          className={cn(fieldErrors.email && "border-destructive")}
        />
        {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
      </div>

      {/* 제출 버튼 */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? dictionary.submit.submitting : dictionary.submit.idle}
      </Button>
    </form>
  );
}
