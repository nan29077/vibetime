// ===========================================================================
// 사업자 정보 · 법적 고지 단일 소스
// ---------------------------------------------------------------------------
// 이 파일의 값이 푸터, 이용약관, 개인정보처리방침에 모두 반영된다.
// 사업자 정보가 바뀌면 여기만 수정하면 된다.
// ===========================================================================

export interface CompanyInfo {
  /** 서비스명(브랜드) */
  serviceName: string;
  /** 법인명 (사업자등록증상 명칭) */
  legalName: string;
  /** 대표자 성명 */
  ceo: string;
  /** 사업자등록번호 */
  businessNumber: string;
  /** 대표 이메일 */
  email: string;
  /** 고객센터 전화번호 */
  phone: string;
}

export const COMPANY: CompanyInfo = {
  serviceName: "VIBETIME(바이브타임)",
  legalName: "주식회사 머니웹",
  ceo: "서영우",
  businessNumber: "420-81-02327",
  email: "slowtooven@gmail.com",
  phone: "02-6085-1113",
};

/** 개인정보 보호책임자 (개인정보 보호법 제31조에 따라 반드시 지정·공개해야 한다) */
export const PRIVACY_OFFICER = {
  name: COMPANY.ceo,
  title: "대표이사",
  email: COMPANY.email,
  phone: COMPANY.phone,
};

/** 푸터·법적 고지에 공통으로 노출하는 사업자 정보 항목 */
export const COMPANY_INFO_ENTRIES: Array<[label: string, value: string]> = [
  ["법인명", COMPANY.legalName],
  ["대표자", COMPANY.ceo],
  ["사업자등록번호", COMPANY.businessNumber],
  ["이메일", COMPANY.email],
  ["고객센터", COMPANY.phone],
];
