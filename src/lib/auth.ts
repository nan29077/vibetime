import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { getSession } from "./session";
import type { Profile, Role } from "./schema";

// ===========================================================================
// 인증/권한 헬퍼 (서버 전용)
// ===========================================================================

/** 가입비 미결제(pending) 회원이 이동해야 할 안내 페이지 */
export const ACTIVATION_PATH = "/payment/activate";

/** 현재 로그인 사용자 (없으면 null) */
export function getCurrentUser(): Profile | null {
  const session = getSession();
  if (!session) return null;
  const db = getDb();
  const user = db.profiles.find((p) => p.id === session.userId) ?? null;
  if (!user || user.status === "suspended" || user.status === "withdrawn") return null;
  // 비밀번호 변경 이전에 발급된 토큰은 무효 (탈취된 세션 차단)
  if (user.password_changed_at && Date.parse(user.password_changed_at) > session.issuedAt) {
    return null;
  }
  return user;
}

/** 로그인 필수. 미로그인 시 /login 으로 리다이렉트 */
export function requireUser(): Profile {
  const user = getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 특정 역할 필수. 권한 없으면 /unauthorized */
export function requireRole(...roles: Role[]): Profile {
  const user = requireUser();
  if (!roles.includes(user.role)) redirect("/unauthorized");
  // 활성 상태가 아니면(가입비 결제 대기 등) 결제 안내 페이지로
  if (user.status === "pending") redirect(ACTIVATION_PATH);
  if (user.status === "suspended") redirect("/unauthorized");
  if (user.status === "withdrawn") redirect("/unauthorized");
  return user;
}

/** 관리자 전용 */
export function requireAdmin(): Profile {
  return requireRole("admin");
}

// --- API 라우트용 가드 ----------------------------------------------------

export type ActiveUserGuard =
  | { user: Profile; response: null }
  | { user: null; response: NextResponse };

/**
 * API 라우트 전용: 로그인 + 활성 상태(가입비 결제 완료)를 함께 검사한다.
 *
 * - 미로그인          → 401
 * - 가입비 결제 대기  → 402 + `redirect: "/payment/activate"`
 *
 * 사용 예)
 * ```ts
 * const auth = requireActiveUser();
 * if (auth.response) return auth.response;
 * const user = auth.user;
 * ```
 * 가입비 결제 자체를 막지 않도록 `/api/auth/*`, `/api/payments/*`,
 * 그리고 결제 문의 창구인 `/api/support` 에는 적용하지 않는다.
 */
export function requireActiveUser(): ActiveUserGuard {
  const user = getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }
  if (user.status !== "active") {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "가입비 결제가 완료되어야 이용할 수 있습니다.",
          redirect: ACTIVATION_PATH,
        },
        { status: 402 }
      ),
    };
  }
  return { user, response: null };
}
