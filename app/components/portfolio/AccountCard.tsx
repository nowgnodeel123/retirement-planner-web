// AccountCard.tsx — 계좌 목록의 개별 행. D-044/D-045: 편집모드에서 삭제(휴지통) 버튼 노출.
// 토스식: 기관 유형별 컬러 아이콘 + 테두리 없는 카드 + 눌림 피드백
import Link from "next/link";
import { AccountResponse, detailTypeLabel, InstitutionType } from "./types";

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

function TrashIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7" />
    </svg>
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
  editing,
  onDelete,
}: {
  account: AccountResponse;
  editing: boolean;
  onDelete: () => void;
}) {
  const body = (
    <div
      className={`card flex items-center gap-3 px-4 py-4 ${editing ? "" : "pressable"}`}
    >
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

      {editing ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          aria-label={`${account.name} 삭제`}
          className="flex-shrink-0 p-2 rounded-xl transition-colors hover:text-red-500"
          style={{ color: "var(--text-sub)" }}
        >
          <TrashIcon />
        </button>
      ) : (
        <ChevronRightIcon />
      )}
    </div>
  );

  if (editing) return body;

  return (
    <Link href={`/portfolio/accounts/${account.id}`} className="block">
      {body}
    </Link>
  );
}
