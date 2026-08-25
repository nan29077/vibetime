// ===========================================================================
// 회원 동의 항목 정의 (서버·클라이언트 공용, 순수 데이터)
// ---------------------------------------------------------------------------
// 가입 화면의 체크박스와 signupAction 검증이 같은 정의를 사용한다.
// ===========================================================================

import type { UserAgreements } from "../schema";
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_VERSION,
} from "./versions";

export type ConsentKey = "terms" | "privacy" | "marketing";

export interface ConsentItem {
  key: ConsentKey;
  /** FormData 필드명 */
  field: string;
  label: string;
  /** 필수 동의 여부 */
  required: boolean;
  /** 전문 링크. 없으면 링크를 표시하지 않는다. */
  href?: string;
  /** 체크박스 아래 보조 설명 */
  hint?: string;
}

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: "terms",
    field: "agree_terms",
    label: "이용약관 동의",
    required: true,
    href: "/terms",
    hint: "서비스 이용 조건, 수익 정산 및 금지행위에 관한 내용입니다.",
  },
  {
    key: "privacy",
    field: "agree_privacy",
    label: "개인정보 수집·이용 동의",
    required: true,
    href: "/privacy",
    hint: "가입·정산에 필요한 최소한의 정보를 수집합니다.",
  },
  {
    key: "marketing",
    field: "agree_marketing",
    label: "마케팅 정보 수신 동의",
    required: false,
    hint: "이벤트·혜택 소식을 이메일로 받아봅니다. 동의하지 않아도 가입할 수 있습니다.",
  },
];

export const REQUIRED_CONSENT_FIELDS = CONSENT_ITEMS.filter((c) => c.required).map((c) => c.field);

/** 회원 프로필에 저장되는 동의 이력 (스키마 정의를 그대로 사용) */
export type ConsentRecord = UserAgreements;

/** 현재 시행 중인 문서 버전으로 동의 이력을 만든다. */
export function buildConsentRecord(marketingOptIn: boolean, at = new Date().toISOString()): ConsentRecord {
  return {
    terms_version: TERMS_VERSION,
    terms_agreed_at: at,
    privacy_version: PRIVACY_VERSION,
    privacy_agreed_at: at,
    marketing_opt_in: marketingOptIn,
    marketing_agreed_at: marketingOptIn ? at : null,
  };
}

export const CURRENT_LEGAL_VERSIONS = {
  terms: { version: TERMS_VERSION, effectiveDate: TERMS_EFFECTIVE_DATE },
  privacy: { version: PRIVACY_VERSION, effectiveDate: PRIVACY_EFFECTIVE_DATE },
};
