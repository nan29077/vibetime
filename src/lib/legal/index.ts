// ===========================================================================
// 법적 문서 배럴 — 약관/방침 본문과 현재 버전 정보를 한 곳에서 노출한다.
// 서버 컴포넌트·클라이언트 컴포넌트 양쪽에서 사용 가능한 순수 데이터만 포함.
// ===========================================================================

export type { LegalArticle, LegalBlock, LegalDocument, LegalSlug, LegalTable } from "./types";
export { COMPANY, PRIVACY_CONTACT, PRIVACY_OFFICER, display, isPlaceholder } from "./company";
export { termsDocument, TERMS_VERSION, TERMS_EFFECTIVE_DATE } from "./terms";
export { privacyDocument, PRIVACY_VERSION, PRIVACY_EFFECTIVE_DATE } from "./privacy";

import { privacyDocument } from "./privacy";
import { termsDocument } from "./terms";
import type { LegalDocument, LegalSlug } from "./types";

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  terms: termsDocument,
  privacy: privacyDocument,
};

export const LEGAL_PATHS: Record<LegalSlug, string> = {
  terms: "/terms",
  privacy: "/privacy",
};

export function getLegalDocument(slug: LegalSlug): LegalDocument {
  return LEGAL_DOCUMENTS[slug];
}
