import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get("nickname");
    const organization = searchParams.get("organization");
    const emailParam = searchParams.get("email");

    // nickname과 organization을 받아서 email 형식으로 변환
    // 또는 기존 email 형식("닉네임 (학교/직장)")도 지원
    const email = nickname && organization ? `${nickname} (${organization})` : emailParam;

    if (!email && !organization) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nickname/Organization or just Organization is required",
        },
        { status: 400 }
      );
    }

    let bestScore = 0;
    let personalRank = 0;
    let organizationRank = 0;

    // 개인 기록 조회 (email이 있을 때만)
    if (email) {
      // email로 최고 점수 조회
      const scoreResult = await query<{ score: number; created_at: Date }>(
        `SELECT score, created_at
         FROM public.game_scores
         WHERE email = $1
         ORDER BY score DESC
         LIMIT 1`,
        [email]
      );

      bestScore = scoreResult.rows[0]?.score || 0;
      const bestScoreCreatedAt = scoreResult.rows[0]?.created_at;

      if (bestScore > 0 && bestScoreCreatedAt) {
        // 개인 순위 조회 (ROW_NUMBER와 동일한 로직: 점수 내림차순, 생성일 오름차순)
        const personalRankResult = await query<{ rank: string }>(
          `SELECT COUNT(*) + 1 as rank
           FROM public.game_scores
           WHERE score > $1 OR (score = $1 AND created_at < $2)`,
          [bestScore, bestScoreCreatedAt]
        );
        personalRank = parseInt(personalRankResult.rows[0]?.rank || "0", 10);
      }
    }

    // 소속 순위 조회 (organization이 있을 때만)
    if (organization) {
      const orgRankResult = await query<{ rank: string }>(
        `WITH OrgScores AS (
           SELECT organization, SUM(score) as total_score
           FROM public.game_scores
           GROUP BY organization
         ),
         RankedOrgs AS (
           SELECT organization, ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
           FROM OrgScores
         )
         SELECT rank FROM RankedOrgs WHERE organization = $1`,
        [organization]
      );
      organizationRank = parseInt(orgRankResult.rows[0]?.rank || "0", 10);
    }

    return NextResponse.json({
      ok: true,
      bestScore,
      personalRank,
      organizationRank,
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
