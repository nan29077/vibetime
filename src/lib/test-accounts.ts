import type { AdvertiserType, Role } from "./schema";

// ===========================================================================
// 개발/테스트 전용 고정 계정 정의 (서버·클라이언트 공용, 순수 데이터)
// ---------------------------------------------------------------------------
// - 실제 계정 생성은 src/lib/seed.ts + src/lib/db/json-provider.ts 에서 수행
// - 로그인 화면의 "테스트 계정 빠른 로그인" 버튼도 이 목록을 사용한다
// - 프로덕션(NODE_ENV=production)에서는 생성/노출 모두 비활성화된다
// ===========================================================================

export type TestAccountKey = "admin" | "creator" | "advertiser";

export interface TestAccountSpec {
  key: TestAccountKey;
  /** 신규 생성 시 사용할 고정 ID (이미 같은 이메일이 있으면 기존 계정을 유지) */
  seedId: string;
  label: string;
  email: string;
  password: string;
  name: string;
  phone: string | null;
  role: Role;
  advertiser_type: AdvertiserType | null;
  referral_code: string;
}

export const TEST_ACCOUNTS: TestAccountSpec[] = [
  {
    key: "admin",
    seedId: "seed-admin-test",
    label: "최고관리자",
    email: "admin@vibetime.com",
    password: "Admin1234!",
    name: "바이브타임 관리자",
    phone: null,
    role: "admin",
    advertiser_type: null,
    referral_code: "VTADMIN1",
  },
  {
    key: "creator",
    seedId: "seed-creator-test",
    label: "크리에이터",
    email: "creator@vibetime.com",
    password: "Test1234!",
    name: "테스트 크리에이터",
    phone: "010-1234-5678",
    role: "creator",
    advertiser_type: null,
    referral_code: "VTCRTOR1",
  },
  {
    key: "advertiser",
    seedId: "seed-advertiser-test",
    label: "광고주",
    email: "advertiser@vibetime.com",
    password: "Test1234!",
    name: "테스트 광고주 (실행사)",
    phone: "010-2345-6789",
    role: "advertiser",
    advertiser_type: "execution_company",
    referral_code: "VTADVER1",
  },
];

export function findTestAccount(key: TestAccountKey): TestAccountSpec {
  const found = TEST_ACCOUNTS.find((a) => a.key === key);
  if (!found) throw new Error(`알 수 없는 테스트 계정: ${key}`);
  return found;
}

/** 프로덕션에서는 테스트 계정 시드/빠른 로그인을 사용하지 않는다. */
export function testAccountsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
