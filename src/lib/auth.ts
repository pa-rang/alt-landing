/**
 * 사용자 권한 관련 유틸리티 함수
 */

export type UserRole = "admin" | "user";

/**
 * 사용자가 어드민인지 확인
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/**
 * 어드민 권한이 필요할 때 사용
 * 권한이 없으면 에러를 던집니다.
 */
export function requireAdmin(role: UserRole | null | undefined): void {
  if (!isAdmin(role)) {
    throw new Error("Admin access required");
  }
}

