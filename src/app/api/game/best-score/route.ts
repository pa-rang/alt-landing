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

    // 이메일로 최고점수와 닉네임 조회
    const result = await query<{ score: number; nickname: string }>(
      `SELECT score, nickname
       FROM public.game_scores
       WHERE email = $1
       ORDER BY score DESC
       LIMIT 1`,
      [email]
    );

    const bestScore = result.rows[0]?.score || 0;
    const nickname = result.rows[0]?.nickname || "";

    return NextResponse.json({
      ok: true,
      bestScore,
      nickname,
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
