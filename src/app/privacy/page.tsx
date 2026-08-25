import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { privacyDocument } from "@/lib/legal";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "VIBETIME이 이용자의 개인정보를 어떻게 수집·이용·보관·파기하는지 안내합니다.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "개인정보처리방침 · VIBETIME",
    description: "VIBETIME 개인정보처리방침 전문입니다.",
    url: "/privacy",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalDocumentView doc={privacyDocument} />;
}
