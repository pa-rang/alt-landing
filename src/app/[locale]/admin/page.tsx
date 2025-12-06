import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { isSupportedLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

type ProfileData = {
  role: string | null;
};

type AdminPageProps = {
  params: { locale: string };
};

/**
 * 어드민 페이지
 * 어드민 권한이 있는 사용자만 접근 가능합니다.
 */
export default async function AdminPage({ params }: { params: Promise<AdminPageProps["params"]> }) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supabase = await createClient();

  // 사용자 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/auth`);
  }

  // user_profiles 테이블에서 role 조회
  let profileData: ProfileData | null = null;
  try {
    const profileResult = await query<ProfileData>(
      `SELECT role
       FROM user_profiles 
       WHERE id = $1`,
      [user.id]
    );

    profileData = profileResult.rows[0] || null;
  } catch (profileError) {
    console.error("Failed to fetch user profile:", profileError);
    redirect(`/${locale}/auth`);
  }

  const userRole = (profileData?.role || "user") as "admin" | "user";

  // 어드민 권한 확인
  if (!isAdmin(userRole)) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Admin Page</h1>
        <p className="text-muted-foreground">어드민 페이지입니다.</p>
      </div>
    </div>
  );
}
