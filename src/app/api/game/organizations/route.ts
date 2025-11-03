import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // 검색어가 있으면 LIKE 검색, 없으면 모든 organization 반환
    const result = await query<{ organization: string }>(
      search
        ? `SELECT DISTINCT organization 
           FROM public.game_scores 
           WHERE organization ILIKE $1 
           ORDER BY organization ASC 
           LIMIT 20`
        : `SELECT DISTINCT organization 
           FROM public.game_scores 
           ORDER BY organization ASC 
           LIMIT 50`,
      search ? [`%${search}%`] : []
    );

    const organizations = result.rows.map((row) => row.organization);

    return NextResponse.json({
      ok: true,
      organizations,
    });
  } catch (error) {
    console.error("organizations GET failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch organizations",
      },
      { status: 500 }
    );
  }
}

