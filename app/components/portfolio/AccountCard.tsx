// AccountCard.tsx — 계좌 목록의 개별 행. 토스식: 기관 유형별 컬러 아이콘 + 테두리 없는 카드 + 눌림 피드백
// D-175: 전체 목록을 "관리" 버튼으로 편집모드 전환하던 방식을 없애고, iOS 메일/설정
// 앱처럼 각 행을 좌측으로 스와이프하면 그 항목만 수정·삭제가 드러나는 방식으로 교체
// (SwipeableRow.tsx). 항상 탭하면 계좌 상세로 이동 — "편집 모드"라는 별도 화면 상태가
// 사라져 계좌 목록이 平상시엔 순수하게 조회 전용 리스트로 보인다.
import Link from "next/link";
import { AccountResponse, AccountSummary, detailTypeLabel, InstitutionType } from "./types";
import { formatKrw, signed } from "./format";
import { SwipeableRow } from "./SwipeableRow";

type IconStyle = { bg: string; color: string };

const institutionIconStyle: Record<InstitutionType, IconStyle> = {
  BANK: { bg: "rgba(52,199,123,0.12)", color: "#34c77b" },
  SECURITIES: { bg: "rgba(49,130,246,0.12)", color: "#3182f6" },
  EXCHANGE: { bg: "rgba(245,166,35,0.14)", color: "#f5a623" },
};

function InstitutionIcon({ type }: { type: InstitutionType }) {
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

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-faint)" }}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function AccountCard({
  account,
  summary,
  onRename,
  onDelete,
}: {
  account: AccountResponse;
  summary?: AccountSummary;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <SwipeableRow onEdit={onRename} onDelete={onDelete}>
      <Link href={`/portfolio/accounts/${account.id}`} className="block">
        <div className="card pressable flex items-center gap-3 px-4 py-4">
          <InstitutionIcon type={account.institutionType} />

          <div className="min-w-0 flex-1">
            <p
              className="text-[15px] font-semibold truncate"
              style={{ color: "var(--text-strong)" }}
            >
              {account.name}
            </p>
            {account.detailType !== "NORMAL" && (
              <span
                className="inline-block mt-0.5 text-[11px] font-medium rounded-md px-1.5 py-0.5"
                style={{ color: "var(--accent)", background: "var(--accent-soft)" }}
              >
                {detailTypeLabel[account.detailType]}
              </span>
            )}
          </div>

          {summary && (
            <div className="text-right flex-shrink-0">
              <p
                className="amount text-[14px] font-semibold"
                style={{ color: "var(--text-strong)" }}
              >
                {formatKrw(summary.totalKrw)}
              </p>
              <p
                className="amount text-[11px] mt-0.5"
                style={{ color: summary.profitKrw >= 0 ? "var(--gain)" : "var(--loss)" }}
              >
                {signed(summary.profitRate, `${Math.abs(summary.profitRate).toFixed(1)}%`)}
              </p>
            </div>
          )}

          <ChevronRightIcon />
        </div>
      </Link>
    </SwipeableRow>
  );
}
