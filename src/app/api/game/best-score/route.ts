import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get("nickname");
    const organization = searchParams.get("organization");

    // nickname과 organization을 받아서 email 형식으로 변환
    // 또는 기존 email 형식("닉네임 (학교/직장)")도 지원
    const email = nickname && organization 
      ? `${nickname} (${organization})` 
      : searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nickname and organization (or email) are required",
        },
        { status: 400 }
      );
    }

    // email 형식("닉네임 (학교/직장)")으로 최고점수와 닉네임 조회
    const result = await query<{ score: number; nickname: string }>(
      `SELECT score, nickname
       FROM public.game_scores
       WHERE email = $1
       ORDER BY score DESC
       LIMIT 1`,
      [email]
    );

    const bestScore = result.rows[0]?.score || 0;
    const nicknameFromDb = result.rows[0]?.nickname || "";

    return NextResponse.json({
      ok: true,
      bestScore,
      nickname: nicknameFromDb,
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
