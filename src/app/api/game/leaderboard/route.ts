import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import {
  type LeaderboardEntry,
  type OrganizationLeaderboardEntry,
} from "@/lib/validation/game-score";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "personal";
    const limit = parseInt(searchParams.get("limit") || "100");

    if (type === "organization") {
      // 학교/직장 리더보드: organization별 점수 합산
      const result = await query<OrganizationLeaderboardEntry>(
        `SELECT 
           organization,
           SUM(score) as total_score,
           COUNT(*) as member_count,
           ROW_NUMBER() OVER (ORDER BY SUM(score) DESC) as rank
         FROM public.game_scores
         GROUP BY organization
         ORDER BY total_score DESC
         LIMIT $1`,
        [Math.min(limit, 100)]
      );

      return NextResponse.json({
        ok: true,
        leaderboard: result.rows,
        type: "organization",
      });
    } else {
      // 개인 리더보드: 최고 점수 순
      const result = await query<LeaderboardEntry>(
        `SELECT 
           email,
           nickname,
           score,
           ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
         FROM public.game_scores
         ORDER BY score DESC, created_at ASC
         LIMIT $1`,
        [Math.min(limit, 100)]
      );

      return NextResponse.json({
        ok: true,
        leaderboard: result.rows,
        type: "personal",
      });
    }
  } catch (error) {
    console.error("leaderboard GET failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch leaderboard",
      },
      { status: 500 }
    );
  }
}
