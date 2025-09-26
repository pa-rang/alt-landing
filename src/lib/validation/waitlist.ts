import { z } from "zod";

export const platformEnum = z.enum(["mac", "windows"], {
  errorMap: () => ({ message: "지원하지 않는 플랫폼입니다." }),
});

export const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "이메일을 입력하세요.")
    .email("올바른 이메일 주소가 아닙니다."),
  platform: platformEnum,
  featureRequest: z
    .string()
    .max(500, "요청 사항은 500자 이내로 적어주세요.")
    .optional()
    .transform((value) => (value ? value.trim() : undefined)),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
