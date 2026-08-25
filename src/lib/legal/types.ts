// ===========================================================================
// 법적 문서(이용약관·개인정보처리방침) 구조 정의
// ---------------------------------------------------------------------------
// 본문을 문자열 덩어리가 아니라 구조화된 데이터로 관리한다.
//  - 조문 단위 앵커/목차 자동 생성
//  - 표(수집 항목·보유 기간·위탁 현황) 렌더링 일관성 확보
//  - 추후 관리자 편집기/버전 관리로 확장하기 쉬움
// ===========================================================================

export type LegalSlug = "terms" | "privacy";

export interface LegalTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export type LegalBlock =
  /** 일반 문단 */
  | { kind: "paragraph"; text: string }
  /** 항 번호(①②③)가 붙는 문단 묶음 */
  | { kind: "clauses"; items: string[] }
  /** 불릿 목록 */
  | { kind: "list"; items: string[] }
  /** 1. 2. 3. 번호 목록 */
  | { kind: "ordered"; items: string[] }
  /** 표 */
  | { kind: "table"; table: LegalTable }
  /** 강조 박스(주의·안내) */
  | { kind: "note"; title?: string; text: string };

export interface LegalArticle {
  /** 앵커 id. 예: "article-1" */
  id: string;
  /** 예: "제1조 (목적)" */
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: LegalSlug;
  /** 문서 제목 */
  title: string;
  /** 문서 부제 / 한 줄 설명 */
  description: string;
  /** 문서 버전. 동의 이력에 함께 기록된다. */
  version: string;
  /** 시행일 (YYYY-MM-DD) */
  effectiveDate: string;
  /** 직전 버전 시행일. 최초 제정이면 null */
  previousEffectiveDate: string | null;
  /** 상단 요약 카드에 노출할 핵심 3~5줄 */
  summary: string[];
  articles: LegalArticle[];
  /** 부칙 */
  addenda: string[];
}
