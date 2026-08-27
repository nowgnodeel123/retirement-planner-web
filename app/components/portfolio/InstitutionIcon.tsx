// InstitutionIcon.tsx — 기관유형(은행/증권사/거래소)별 컬러 원형 아이콘.
// 계좌 카드에서 분리해 추출(계좌 목록 섹션 헤더가 사라진 뒤 기관 구분을 이 아이콘이 담당).
import { InstitutionType } from "./types";

type IconStyle = { bg: string; color: string };

const institutionIconStyle: Record<InstitutionType, IconStyle> = {
  BANK: { bg: "rgba(52,199,123,0.12)", color: "#34c77b" },
  SECURITIES: { bg: "rgba(49,130,246,0.12)", color: "#3182f6" },
  EXCHANGE: { bg: "rgba(245,166,35,0.14)", color: "#f5a623" },
};

export function InstitutionIcon({ type }: { type: InstitutionType }) {
  const s = institutionIconStyle[type];
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: s.bg, color: s.color }}
    >
      {type === "BANK" && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-6 9 6M5 9v10m14-10v10M3 19h18M9 13v3m6-3v3" />
        </svg>
      )}
      {type === "SECURITIES" && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l5-5 4 3 8-8" />
          <path d="M15 7h5v5" />
        </svg>
      )}
      {type === "EXCHANGE" && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 4v16M7 4h6.5a3.5 3.5 0 0 1 0 7H7m0 0h7a3.5 3.5 0 0 1 0 7H7" />
          <path d="M10 3v2.5M13 3v2.5M10 18.5V21M13 18.5V21" />
        </svg>
      )}
    </div>
  );
}
