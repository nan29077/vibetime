import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

// ===========================================================================
// 세션 = 서명된 쿠키(HMAC). 로컬 모드 전용 Mock Auth.
// [TODO] Supabase 전환 시 supabase.auth 세션으로 대체.
// ---------------------------------------------------------------------------
// 토큰 형식: `${userId}.${issuedAtMs}.${hmac(userId.issuedAtMs)}`
//  - issuedAt(iat)을 서명 대상에 포함하여 위조 없이 발급 시각을 검증한다.
//  - MAX_TOKEN_AGE_MS 를 넘긴 토큰은 서명이 맞아도 무효로 처리한다.
// ===========================================================================

const COOKIE_NAME = "vf_session";

/** 쿠키/토큰 유효기간 (7일) */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MAX_TOKEN_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export interface SessionInfo {
  userId: string;
  /** 토큰 발급 시각(epoch ms) */
  issuedAt: number;
}

// SESSION_SECRET 환경변수 처리
// - production: 미설정 시 에러 throw
// - development: 미설정 시 경고만 출력하고 dev-secret 사용
// ---------------------------------------------------------------------------
// [중요] 모듈 로드 시점이 아니라 실제 세션 사용 시점(sign/verify)에만 평가한다.
// 그래야 SESSION_SECRET 없이도 `next build`(정적 분석/프리렌더)가 성공한다.
let cachedSecret: string | null = null;

function resolveSecret(): string {
  if (cachedSecret !== null) return cachedSecret;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET 환경변수가 설정되지 않았습니다");
    }
    console.warn("[session] SESSION_SECRET 미설정 — 개발용 시크릿 사용 중 (프로덕션에서는 반드시 설정)");
    cachedSecret = "vibetime-dev-secret";
    return cachedSecret;
  }
  cachedSecret = secret;
  return cachedSecret;
}

function hmac(payload: string): string {
  return createHmac("sha256", resolveSecret()).update(payload).digest("hex");
}

function sign(userId: string, issuedAt: number): string {
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${hmac(payload)}`;
}

function verify(token: string | undefined): SessionInfo | null {
  if (!token) return null;
  const sigIdx = token.lastIndexOf(".");
  if (sigIdx < 0) return null;
  const payload = token.slice(0, sigIdx);
  const sig = token.slice(sigIdx + 1);

  const iatIdx = payload.lastIndexOf(".");
  if (iatIdx < 0) return null; // iat 없는 구(舊) 토큰 → 무효(재로그인 필요)
  const userId = payload.slice(0, iatIdx);
  const issuedAt = Number(payload.slice(iatIdx + 1));
  if (!userId || !Number.isFinite(issuedAt) || issuedAt <= 0) return null;

  const expected = hmac(payload);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  // 발급 시각 검증: 만료됐거나 미래 시각(시계 조작)이면 무효
  const age = Date.now() - issuedAt;
  if (age > MAX_TOKEN_AGE_MS) return null;
  if (age < -60_000) return null;

  return { userId, issuedAt };
}

export function setSession(userId: string): void {
  cookies().set(COOKIE_NAME, sign(userId, Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSession(): void {
  cookies().delete(COOKIE_NAME);
}

/** 서명·만료 검증을 통과한 세션 정보 (없으면 null) */
export function getSession(): SessionInfo | null {
  return verify(cookies().get(COOKIE_NAME)?.value);
}

export function getSessionUserId(): string | null {
  return getSession()?.userId ?? null;
}
