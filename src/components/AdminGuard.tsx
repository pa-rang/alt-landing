import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { isAdmin, type UserRole } from "@/lib/auth";

type AdminGuardProps = {
  children: React.ReactNode;
  locale: string;
};

/**
 * Next.js redirect 에러 타입 가드
 * redirect() 함수가 던지는 특별한 에러를 확인합니다.
 */
function isNextRedirectError(error: unknown): error is Error & { digest?: string } {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message === "NEXT_REDIRECT") {
    return true;
  }

  const errorWithDigest = error as Error & { digest?: string };
  const digest = errorWithDigest.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * 어드민 권한이 필요한 페이지를 감싸는 가드 컴포넌트
 * 권한이 없으면 로그인 페이지나 홈으로 리다이렉트합니다.
 */
export default async function AdminGuard({ children, locale }: AdminGuardProps) {
  const supabase = await createClient();

  // 1. 사용자 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/auth`);
  }

  // 2. DB에서 권한 조회
  try {
    const result = await query<{ role: UserRole }>(
      `SELECT role
       FROM user_profiles 
       WHERE id = $1`,
      [user.id]
    );

    const role = result.rows[0]?.role;

    // 3. 어드민 권한 확인
    if (!isAdmin(role)) {
      redirect(`/${locale}`);
    }
  } catch (error) {
    // Next.js 리다이렉트 에러는 통과
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("AdminGuard permission check failed:", error);
    redirect(`/${locale}/auth`);
  }

  // 권한이 확인되면 자식 컴포넌트 렌더링
  return <>{children}</>;
}
