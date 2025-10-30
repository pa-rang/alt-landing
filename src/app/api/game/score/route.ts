import { NextResponse } from "next/server";
import { DatabaseError } from "pg";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/utils";
import { createGameScoreSchema, type GameScoreInput, type GameScore } from "@/lib/validation/game-score";

type GameScoreFieldErrors = Partial<Record<keyof GameScoreInput, string>>;

type GameScoreFormDictionary = Dictionary["game"]["scoreSubmit"];

type SchemaResult = {
  dictionary: GameScoreFormDictionary;
  schema: ReturnType<typeof createGameScoreSchema>;
};

function mapDatabaseError(
  error: unknown,
  dictionary: GameScoreFormDictionary
): { status: number; message: string; fieldErrors?: GameScoreFieldErrors } {
  if (error instanceof DatabaseError) {
    console.error("Database error:", error);

    // 중복 이메일 처리
    if (error.code === "23505") {
      return {
        status: 409,
        message: dictionary.messages.duplicateEmail,
      };
    }

    return {
      status: 500,
      message: dictionary.messages.serverError,
    };
  }

  return {
    status: 500,
    message: dictionary.messages.serverError,
  };
}

async function resolveSchema(request: Request): Promise<SchemaResult> {
  const locale = resolveLocale({
    headerLocale: request.headers.get("accept-language"),
  });

  const dictionary = (await getDictionary(locale)).game.scoreSubmit;
  const schema = createGameScoreSchema(dictionary.validation);

  return { schema, dictionary };
}

export async function POST(request: Request) {
  let schemaResult: SchemaResult | null = null;

  try {
    schemaResult = await resolveSchema(request);
    const { schema, dictionary } = schemaResult;

    const payload = await request.json();
    const parseResult = schema.safeParse(payload);

    if (!parseResult.success) {
      const fieldErrors: GameScoreFieldErrors = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path[0];
        if (key === "email" || key === "organization" || key === "nickname" || key === "score") {
          fieldErrors[key] = issue.message;
        }
      }

      return NextResponse.json(
        {
          ok: false,
          error: dictionary.messages.validationError,
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, organization, nickname, score } = parseResult.data;

    // 기존 점수 확인
    const existingResult = await query<GameScore>(
      `SELECT score FROM public.game_scores WHERE email = $1`,
      [email]
    );
    const previousScore = existingResult.rows[0]?.score;

    // UPSERT: 이메일이 이미 존재하면 정보를 덮어쓰기
    const result = await query<GameScore>(
      `INSERT INTO public.game_scores (email, organization, nickname, score, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email)
       DO UPDATE SET
         organization = EXCLUDED.organization,
         nickname = EXCLUDED.nickname,
         score = CASE
           WHEN EXCLUDED.score > game_scores.score THEN EXCLUDED.score
           ELSE game_scores.score
         END,
         updated_at = NOW()
       RETURNING id, email, organization, nickname, score, created_at, updated_at`,
      [email, organization, nickname, score]
    );

    const savedScore = result.rows[0];
    const isNewHighScore = previousScore === undefined || score > previousScore;

    // 개인 순위 계산
    const rankResult = await query<{ rank: number }>(
      `SELECT COUNT(*) + 1 as rank
       FROM public.game_scores
       WHERE score > $1`,
      [savedScore.score]
    );

    const rank = rankResult.rows[0]?.rank || 1;

    // TODO: Slack 알림 전송 (선택적)
    // setImmediate(() => {
    //   sendGameScoreNotification(savedScore)
    //     .catch((error) => console.error("Slack notification error:", error));
    // });

    return NextResponse.json({
      ok: true,
      score: savedScore,
      rank,
      isNewHighScore,
      previousScore: previousScore ?? null,
    });
  } catch (error) {
    console.error("game score POST failed", error);
    const dictionary = schemaResult?.dictionary ?? (await resolveSchema(request)).dictionary;
    const { status, message, fieldErrors } = mapDatabaseError(error, dictionary);

    return NextResponse.json(
      {
        ok: false,
        error: message,
        fieldErrors,
      },
      { status }
    );
  }
}
