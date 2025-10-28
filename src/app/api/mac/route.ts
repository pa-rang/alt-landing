import { NextResponse } from "next/server";

const S3_URL = "https://altalt-dev.s3.ap-northeast-2.amazonaws.com/alt/darwin/arm64/Alt-0.0.5-arm64.dmg";
const FILENAME = "Alt-0.0.5-arm64.dmg";

export async function GET() {
  try {
    // S3에서 파일 가져오기
    const response = await fetch(S3_URL, {
      headers: {
        Accept: "application/octet-stream",
      },
    });

    if (!response.ok) {
      console.error(`S3 fetch failed: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // S3에서 받은 Content-Type이 있으면 사용, 없으면 기본값 사용
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // 스트림으로 파일 전송
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${FILENAME}"`,
        "Content-Length": buffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600", // 1시간 캐시
      },
    });
  } catch (error) {
    console.error("Download API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
