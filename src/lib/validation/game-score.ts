import { z } from "zod";

export type GameScoreValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  organizationRequired: string;
  organizationTooLong: string;
  nicknameRequired: string;
  nicknameTooLong: string;
  nicknameInvalid: string;
  scoreRequired: string;
  scoreInvalid: string;
  scoreNegative: string;
};

export function createGameScoreSchema(messages: GameScoreValidationMessages) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid),
    organization: z
      .string()
      .trim()
      .min(1, messages.organizationRequired)
      .max(255, messages.organizationTooLong),
    nickname: z
      .string()
      .trim()
      .min(1, messages.nicknameRequired)
      .max(100, messages.nicknameTooLong)
      .regex(/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s_-]+$/, messages.nicknameInvalid),
    score: z
      .number({
        message: messages.scoreInvalid,
      })
      .int({ message: messages.scoreInvalid })
      .nonnegative({ message: messages.scoreNegative }),
  });
}

export type GameScoreSchema = ReturnType<typeof createGameScoreSchema>;
export type GameScoreInput = z.infer<GameScoreSchema>;

// 타입 정의
export interface GameScore {
  id: number;
  email: string;
  organization: string;
  nickname: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  email: string;
  nickname: string;
  score: number;
}

export interface OrganizationLeaderboardEntry {
  rank: number;
  organization: string;
  total_score: number;
  member_count: number;
}
