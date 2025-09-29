import { NextResponse } from "next/server";
import { DatabaseError } from "pg";

import { query } from "@/lib/db";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/utils";
import { createWaitlistSchema, type WaitlistInput } from "@/lib/validation/waitlist";
import { sendWaitlistNotification } from "@/lib/slack";

type WaitlistEntry = {
  id: number;
  email: string;
  platform: string;
  feature_request?: string | null;
  invited_at?: string | null;
  created_at: string;
  updated_at: string;
};

type WaitlistFieldErrors = Partial<Record<keyof WaitlistInput, string>>;

type WaitlistFormDictionary = Dictionary["waitlistForm"];

type SchemaResult = {
  dictionary: WaitlistFormDictionary;
  schema: ReturnType<typeof createWaitlistSchema>;
};

function mapDatabaseError(
  error: unknown,
  dictionary: WaitlistFormDictionary
): { status: number; message: string; fieldErrors?: WaitlistFieldErrors } {
  if (error instanceof DatabaseError && error.code === "23505") {
    return {
      status: 409,
      message: dictionary.messages.duplicateEmail,
      fieldErrors: {
        email: dictionary.messages.duplicateEmail,
      },
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

  const dictionary = (await getDictionary(locale)).waitlistForm;
  const schema = createWaitlistSchema(dictionary.validation);

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
      const fieldErrors: WaitlistFieldErrors = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path[0];
        if (key === "featureRequest" || key === "platform" || key === "email") {
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

    const { email, platform, featureRequest } = parseResult.data;

    const result = await query<WaitlistEntry>(
      `insert into public.waitlist (email, platform, feature_request)
       values ($1, $2, $3)
       on conflict (email)
       do update set feature_request = excluded.feature_request, updated_at = now(), deleted_at = null
       returning id, email, platform, feature_request, invited_at, created_at, updated_at`,
      [email, platform, featureRequest ?? null]
    );

    // 슬랙 알림 전송 (완전히 격리된 백그라운드 처리)
    // 사용자 응답과 완전히 분리하여 에러가 전파되지 않도록 함
    setImmediate(() => {
      sendWaitlistNotification(result.rows[0])
        .then(success => {
          if (!success) {
            console.warn(`슬랙 알림 전송 실패 (웨이트리스트 ID: ${result.rows[0].id})`);
          }
        })
        .catch((slackError) => {
          // 예상치 못한 에러도 안전하게 처리
          console.error('슬랙 알림 처리 중 예외 발생:', slackError);
        });
    });

    return NextResponse.json({
      ok: true,
      waitlist: result.rows[0],
    });
  } catch (error) {
    console.error("waitlist POST failed", error);
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
