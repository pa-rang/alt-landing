import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query<{ now: string }>("select now() as now");

    return NextResponse.json({
      ok: true,
      timestamp: result.rows[0]?.now ?? null,
    });
  } catch (error) {
    console.error("DB 연결 실패", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
