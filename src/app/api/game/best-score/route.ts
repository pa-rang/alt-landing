import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // 이메일로 최고점수 조회
    const result = await query<{ score: number }>(
      `SELECT score
       FROM public.game_scores
       WHERE email = $1
       ORDER BY score DESC
       LIMIT 1`,
      [email]
    );

    const bestScore = result.rows[0]?.score || 0;

    return NextResponse.json({
      ok: true,
      bestScore,
    });
  } catch (error) {
    console.error("best-score GET failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch best score",
      },
      { status: 500 }
    );
  }
}
