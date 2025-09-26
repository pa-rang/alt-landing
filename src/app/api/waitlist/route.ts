import { NextResponse } from "next/server";
import { DatabaseError } from "pg";
import { query } from "@/lib/db";
import { waitlistSchema } from "@/lib/validation/waitlist";

function mapDatabaseError(error: unknown): { status: number; message: string } {
  if (error instanceof DatabaseError && error.code === "23505") {
    return {
      status: 409,
      message: "이미 등록된 이메일입니다.",
    };
  }

  return {
    status: 500,
    message: "서버 오류가 발생했습니다.",
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parseResult = waitlistSchema.safeParse(payload);

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      }

      return NextResponse.json(
        {
          ok: false,
          error: "입력값을 확인해주세요.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, platform, featureRequest } = parseResult.data;

    const result = await query(
      `insert into public.waitlist (email, platform, feature_request)
       values ($1, $2, $3)
       on conflict (email)
       do update set feature_request = excluded.feature_request, updated_at = now(), deleted_at = null
       returning id, email, platform, feature_request, invited_at, created_at, updated_at`,
      [email, platform, featureRequest ?? null]
    );

    return NextResponse.json({
      ok: true,
      waitlist: result.rows[0],
    });
  } catch (error) {
    console.error("waitlist POST 오류", error);
    const { status, message } = mapDatabaseError(error);

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status }
    );
  }
}
