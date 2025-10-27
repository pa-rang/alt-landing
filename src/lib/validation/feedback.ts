import { z } from "zod";

export const FEEDBACK_TYPE_OPTIONS = ["issue", "idea"] as const;

export type FeedbackTypeValue = (typeof FEEDBACK_TYPE_OPTIONS)[number];

export type FeedbackValidationMessages = {
  typeRequired: string;
  contentRequired: string;
  contentTooShort: string;
  emailRequired: string;
  emailInvalid: string;
};

export function createFeedbackSchema(messages: FeedbackValidationMessages) {
  const feedbackType = z
    .string()
    .refine((value): value is FeedbackTypeValue => FEEDBACK_TYPE_OPTIONS.includes(value as FeedbackTypeValue), {
      message: messages.typeRequired,
    });

  return z.object({
    feedbackType,
    content: z.string().trim().min(1, messages.contentRequired).min(10, messages.contentTooShort),
    email: z.string().trim().min(1, messages.emailRequired).email(messages.emailInvalid),
  });
}

export type FeedbackSchema = ReturnType<typeof createFeedbackSchema>;
export type FeedbackInput = z.infer<FeedbackSchema>;
