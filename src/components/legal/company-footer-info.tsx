import { COMPANY, COMPANY_INFO_ENTRIES } from "@/lib/legal/company";

// ===========================================================================
// 푸터 사업자 정보 (어두운 배경 푸터용)
// 값은 src/lib/legal/company.ts 한 곳에서만 관리한다.
// ===========================================================================

export function CompanyFooterInfo({ className = "" }: { className?: string }) {
  return (
    <address className={`not-italic text-[11px] leading-5 text-gray-400 ${className}`}>
      <span className="font-semibold text-gray-300">{COMPANY.legalName}</span>
      <span className="ml-2 inline-flex flex-wrap gap-x-3 gap-y-0.5">
        {COMPANY_INFO_ENTRIES.filter(([label]) => label !== "법인명").map(([label, value]) => (
          <span key={label}>
            <span className="text-gray-500">{label}</span>{" "}
            {label === "이메일" ? (
              <a href={`mailto:${value}`} className="transition-colors hover:text-white">{value}</a>
            ) : label === "고객센터" ? (
              <a href={`tel:${value.replace(/-/g, "")}`} className="transition-colors hover:text-white">{value}</a>
            ) : (
              value
            )}
          </span>
        ))}
      </span>
    </address>
  );
}
