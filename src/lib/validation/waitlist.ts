import { z } from "zod";

export const PLATFORM_OPTIONS = ["mac", "windows"] as const;

export type PlatformValue = (typeof PLATFORM_OPTIONS)[number];

export type WaitlistValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  platformInvalid: string;
  featureTooLong: string;
};

export function createWaitlistSchema(messages: WaitlistValidationMessages) {
  const platform = z
    .string()
    .refine((value): value is PlatformValue => PLATFORM_OPTIONS.includes(value as PlatformValue), {
      message: messages.platformInvalid,
    });

  return z.object({
    email: z
      .string()
      .trim()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid),
    platform,
    featureRequest: z
      .string()
      .max(500, messages.featureTooLong)
      .optional()
      .transform((value) => (value ? value.trim() : undefined)),
  });
}

export type WaitlistSchema = ReturnType<typeof createWaitlistSchema>;
export type WaitlistInput = z.infer<WaitlistSchema>;
