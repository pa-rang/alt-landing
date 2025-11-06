import { NextResponse } from "next/server";
import { getPublicKeyBase64 } from "@/lib/decryption";

export const dynamic = "force-dynamic";

/**
 * 클라이언트에서 공개키를 요청하는 API
 * 공개키는 클라이언트에 노출되어도 안전합니다.
 */
export async function GET() {
  try {
    const publicKeyBase64 = getPublicKeyBase64();
    
    return NextResponse.json({
      ok: true,
      publicKey: publicKeyBase64,
    });
  } catch (error) {
    console.error("Failed to get public key:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to get encryption key",
      },
      { status: 500 }
    );
  }
}

