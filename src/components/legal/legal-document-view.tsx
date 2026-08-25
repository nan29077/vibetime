import Link from "next/link";
import { COMPANY, PRIVACY_CONTACT, PRIVACY_OFFICER, display, isPlaceholder } from "@/lib/legal/company";
import type { LegalBlock, LegalDocument } from "@/lib/legal/types";
import { IconAlertCircle, IconChevronLeft, IconFileText, IconMail, IconShield } from "@/components/icons";

// ===========================================================================
// 이용약관 / 개인정보처리방침 공용 렌더러 (서버 컴포넌트)
// ===========================================================================

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫", "⑬", "⑭", "⑮"];

function circled(index: number): string {
  return CIRCLED[index] ?? `(${index + 1})`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-[15px] leading-7 text-gray-700">{block.text}</p>;

    case "clauses":
      return (
        <div className="space-y-2.5">
          {block.items.map((text, i) => (
            <p key={i} className="flex gap-2 text-[15px] leading-7 text-gray-700">
              <span className="shrink-0 font-semibold text-brand-purple">{circled(i)}</span>
              <span>{text}</span>
            </p>
          ))}
        </div>
      );

    case "ordered":
      return (
        <ol className="space-y-2">
          {block.items.map((text, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-7 text-gray-700">
              <span className="mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-50 text-[11px] font-bold text-brand-purple">
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      );

    case "list":
      return (
        <ul className="space-y-1.5">
          {block.items.map((text, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-7 text-gray-700">
              <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <figure className="space-y-2">
          {block.table.caption && (
            <figcaption className="text-[13px] font-semibold text-gray-600">{block.table.caption}</figcaption>
          )}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="bg-gray-50">
                  {block.table.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-gray-200 px-4 py-2.5 font-bold text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.table.rows.map((row, ri) => (
                  <tr key={ri} className="align-top even:bg-gray-50/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="border-b border-gray-100 px-4 py-2.5 leading-6 text-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );

    case "note":
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          {block.title && (
            <p className="mb-1.5 text-[13px] font-bold text-amber-900">{block.title}</p>
          )}
          <p className="text-[14px] leading-6 text-amber-900/90">{block.text}</p>
        </div>
      );

    default:
      return null;
  }
}

/** 아직 실제 값으로 교체되지 않은 사업자 정보 항목 (개발 환경에서만 노출) */
function pendingCompanyFields(): string[] {
  const entries: Array<[string, string]> = [
    ["상호", COMPANY.legalName],
    ["대표자", COMPANY.ceo],
    ["사업자등록번호", COMPANY.businessNumber],
    ["통신판매업 신고번호", COMPANY.mailOrderNumber],
    ["주소", COMPANY.address],
    ["대표전화", COMPANY.phone],
    ["관할 법원", COMPANY.court],
    ["개인정보 보호책임자", PRIVACY_OFFICER.name],
    ["보호책임자 직위", PRIVACY_OFFICER.title],
    ["보호책임자 연락처", PRIVACY_OFFICER.phone],
    ["고충처리 담당자", PRIVACY_CONTACT.manager],
  ];
  return entries.filter(([, value]) => isPlaceholder(value)).map(([label]) => label);
}

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const isPrivacy = doc.slug === "privacy";
  const otherHref = isPrivacy ? "/terms" : "/privacy";
  const otherLabel = isPrivacy ? "이용약관" : "개인정보처리방침";
  // 실제 사업자 정보로 교체되지 않은 항목은 개발 환경에서만 경고로 노출한다.
  const pending = process.env.NODE_ENV === "production" ? [] : pendingCompanyFields();

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 상단 바 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            <IconChevronLeft size={16} />
            <span className="vt-site-logo font-black tracking-tight">
              <span className="text-gray-900">VIBE</span><span className="text-brand-purple">TIME</span>
            </span>
          </Link>
          <Link href={otherHref} className="text-sm font-semibold text-brand-purple transition hover:underline">
            {otherLabel} 보기
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5">
        {/* 제목 영역 */}
        <div className="pt-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-purple">
            {isPrivacy ? <IconShield size={12} /> : <IconFileText size={12} />}
            {isPrivacy ? "Privacy" : "Terms"}
          </span>
          <h1 className="mt-3 text-[28px] font-black tracking-tight text-gray-900 sm:text-[32px]">{doc.title}</h1>
          <p className="mt-2.5 text-[15px] leading-7 text-gray-600">{doc.description}</p>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-gray-200 py-3 text-[13px] text-gray-500">
            <div className="flex gap-1.5">
              <dt className="font-semibold text-gray-700">버전</dt>
              <dd>v{doc.version}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold text-gray-700">시행일</dt>
              <dd>{formatDate(doc.effectiveDate)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold text-gray-700">직전 개정</dt>
              <dd>{doc.previousEffectiveDate ? formatDate(doc.previousEffectiveDate) : "해당 없음(최초 제정)"}</dd>
            </div>
          </dl>
        </div>

        {/* 개발 환경 전용: 미기재 사업자 정보 경고 */}
        {pending.length > 0 && (
          <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <IconAlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-bold text-red-800">공개 전 확인 필요 (개발 환경에서만 표시)</p>
              <p className="mt-1 text-[13px] leading-6 text-red-700">
                다음 항목이 아직 실제 사업자 정보로 교체되지 않았습니다 — {pending.join(", ")}.
                <br />
                <code className="rounded bg-red-100 px-1 py-0.5 text-[12px]">src/lib/legal/company.ts</code> 에서 값을 수정하세요.
              </p>
            </div>
          </div>
        )}

        {/* 핵심 요약 */}
        {doc.summary.length > 0 && (
          <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">한눈에 보기</h2>
            <p className="mt-1 text-[12.5px] text-gray-500">
              아래 요약은 이해를 돕기 위한 것으로, 실제 효력은 본문에 따릅니다.
            </p>
            <ul className="mt-3.5 space-y-2.5">
              {doc.summary.map((text, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-6 text-gray-700">
                  <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[11px] font-bold text-brand-purple">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 목차 */}
        <nav aria-label="목차" className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-bold text-gray-900">목차</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {doc.articles.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="text-[13.5px] leading-6 text-gray-600 transition hover:text-brand-purple hover:underline">
                  {a.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 본문 */}
        <div className="mt-10 space-y-10">
          {doc.articles.map((article) => (
            <section key={article.id} id={article.id} className="scroll-mt-20">
              <h2 className="text-[17px] font-bold text-gray-900">{article.title}</h2>
              <div className="mt-3 space-y-4">
                {article.blocks.map((block, i) => (
                  <Block key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 부칙 */}
        {doc.addenda.length > 0 && (
          <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-[15px] font-bold text-gray-900">부칙</h2>
            <ul className="mt-2.5 space-y-1.5">
              {doc.addenda.map((text, i) => (
                <li key={i} className="text-[14px] leading-6 text-gray-600">{text}</li>
              ))}
            </ul>
          </section>
        )}

        {/* 사업자 정보 */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-[15px] font-bold text-gray-900">사업자 정보</h2>
          <dl className="mt-3 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
            {[
              ["상호", display(COMPANY.legalName)],
              ["대표자", display(COMPANY.ceo)],
              ["사업자등록번호", display(COMPANY.businessNumber)],
              ["통신판매업 신고번호", display(COMPANY.mailOrderNumber)],
              ["주소", display(COMPANY.address)],
              ["대표전화", display(COMPANY.phone)],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="w-[112px] shrink-0 font-semibold text-gray-500">{label}</dt>
                <dd className="text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
          <a
            href={`mailto:${COMPANY.email}`}
            className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-purple transition hover:underline"
          >
            <IconMail size={14} />
            {COMPANY.email}
          </a>
          <p className="mt-1.5 text-[12.5px] text-gray-500">고객센터 운영시간 · {COMPANY.supportHours}</p>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-gray-500 transition hover:text-gray-900">
            ← 메인으로 돌아가기
          </Link>
          <Link href={otherHref} className="text-sm font-semibold text-brand-purple transition hover:underline">
            {otherLabel} 보기 →
          </Link>
        </div>
      </article>
    </main>
  );
}
