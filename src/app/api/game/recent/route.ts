import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface RecentPlayEntry {
  nickname: string;
  organization: string;
  score: number;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // 모든 플레이 기록을 로그 테이블에서 조회 (슬랙 노티와 동일)
    const result = await query<RecentPlayEntry>(
      `SELECT 
         nickname,
         organization,
         score,
         created_at
       FROM public.game_play_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.min(limit, 20)]
    );

    return NextResponse.json({
      ok: true,
      plays: result.rows,
    });
  } catch (error) {
    console.error("recent plays GET failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch recent plays",
      },
      { status: 500 }
    );
  }
}
