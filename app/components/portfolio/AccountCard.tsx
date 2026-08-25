// AccountCard.tsx — 계좌 목록의 개별 행. 토스식: 기관 유형별 컬러 아이콘 + 테두리 없는 카드 + 눌림 피드백
// D-193: D-175의 좌측 스와이프(SwipeableRow) 방식을 다시 없앴다 — 실기기에서 스와이프
// 제스처가 일반 탭과 자주 혼동돼 계좌 상세 진입 자체가 안 되는 문제가 반복 보고됨.
// D-175 이전의 "관리 모드 토글" 패턴(D-044/D-045)으로 되돌리되, 토글 버튼 위치만
// 헤더의 + 버튼 옆으로 이동(app/portfolio/page.tsx) — manageMode가 켜지면 카드는
// 더 이상 링크가 아니라 수정/삭제 아이콘 버튼 두 개로만 반응한다.
import Link from "next/link";
import { AccountResponse, AccountSummary, detailTypeLabel, InstitutionType } from "./types";
import { formatKrw, signed } from "./format";

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

function PencilIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
    </svg>
  );
}

function AccountCardBody({ account, summary }: { account: AccountResponse; summary?: AccountSummary }) {
  return (
    <>
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
    </>
  );
}

export function AccountCard({
  account,
  summary,
  manageMode = false,
  onRename,
  onDelete,
}: {
  account: AccountResponse;
  summary?: AccountSummary;
  manageMode?: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  if (manageMode) {
    return (
      <div className="card flex items-center gap-3 px-4 py-4">
        <AccountCardBody account={account} summary={summary} />
        <button
          type="button"
          onClick={onRename}
          aria-label="계좌 수정"
          className="pressable p-2 rounded-xl flex-shrink-0"
          style={{ color: "var(--text-sub)", background: "var(--surface-pressed)" }}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="계좌 삭제"
          className="pressable p-2 rounded-xl flex-shrink-0"
          style={{ color: "var(--error)", background: "var(--error-soft)" }}
        >
          <TrashIcon />
        </button>
      </div>
    );
  }

  return (
    <Link href={`/portfolio/accounts/${account.id}`} className="block">
      <div className="card pressable flex items-center gap-3 px-4 py-4">
        <AccountCardBody account={account} summary={summary} />
        <ChevronRightIcon />
      </div>
    </Link>
  );
}
