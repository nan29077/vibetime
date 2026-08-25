import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { termsDocument } from "@/lib/legal";

export const metadata: Metadata = {
  title: "이용약관",
  description: "VIBETIME 서비스 이용에 관한 회사와 회원 사이의 권리·의무 및 책임사항을 안내합니다.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "이용약관 · VIBETIME",
    description: "VIBETIME 서비스 이용약관 전문입니다.",
    url: "/terms",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalDocumentView doc={termsDocument} />;
}
