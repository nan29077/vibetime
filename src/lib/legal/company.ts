// ===========================================================================
// 사업자 정보 · 법적 고지 단일 소스
// ---------------------------------------------------------------------------
// [TODO: 사업자 정보] 아래 PLACEHOLDER 표시 값은 실제 사업자등록증/통신판매업
// 신고증의 내용으로 반드시 교체해야 합니다. 교체하면 이용약관·개인정보처리방침·
// 푸터·고객센터 안내에 자동 반영됩니다.
// ===========================================================================

/** 아직 실제 값으로 교체되지 않은 항목 표시용 접두사 */
export const PLACEHOLDER = "●";

export interface CompanyInfo {
  /** 서비스명(브랜드) */
  serviceName: string;
  /** 법인/상호 (사업자등록증상 명칭) */
  legalName: string;
  /** 대표자 성명 */
  ceo: string;
  /** 사업자등록번호 */
  businessNumber: string;
  /** 통신판매업 신고번호 */
  mailOrderNumber: string;
  /** 사업장 주소 */
  address: string;
  /** 고객센터 대표 이메일 */
  email: string;
  /** 고객센터 대표 전화 */
  phone: string;
  /** 고객센터 운영시간 안내 문구 */
  supportHours: string;
  /** 서비스 도메인 (프로토콜 제외) */
  domain: string;
  /** 관할 법원 */
  court: string;
}

export const COMPANY: CompanyInfo = {
  serviceName: "VIBETIME(바이브타임)",
  legalName: `${PLACEHOLDER}주식회사 바이브타임`,
  ceo: `${PLACEHOLDER}대표자명`,
  businessNumber: `${PLACEHOLDER}000-00-00000`,
  mailOrderNumber: `${PLACEHOLDER}제0000-지역-0000호`,
  address: `${PLACEHOLDER}서울특별시 ○○구 ○○로 00, 0층`,
  email: "support@vibetime.com",
  phone: `${PLACEHOLDER}0000-0000`,
  supportHours: "평일 10:00~17:00 (점심 12:00~13:00 제외, 주말·공휴일 휴무)",
  domain: "vibetime.com",
  court: `${PLACEHOLDER}서울중앙지방법원`,
};

/** 개인정보 보호책임자 (개인정보 보호법 제31조) */
export const PRIVACY_OFFICER = {
  name: `${PLACEHOLDER}책임자명`,
  title: `${PLACEHOLDER}직위`,
  department: "개인정보보호팀",
  email: "privacy@vibetime.com",
  phone: `${PLACEHOLDER}0000-0000`,
};

/** 개인정보 보호 담당부서 (고충처리 창구) */
export const PRIVACY_CONTACT = {
  department: "고객지원팀",
  manager: `${PLACEHOLDER}담당자명`,
  email: "privacy@vibetime.com",
  phone: `${PLACEHOLDER}0000-0000`,
};

/** 값이 아직 플레이스홀더인지 여부 */
export function isPlaceholder(value: string): boolean {
  return value.includes(PLACEHOLDER);
}

/** 문서 본문에 넣을 때 플레이스홀더 접두사를 제거한 표기 */
export function display(value: string): string {
  return value.split(PLACEHOLDER).join("");
}
