// AccountCard.tsx — 계좌 목록의 개별 행. D-044/D-045: 편집모드에서 삭제(휴지통) 버튼 노출.
import Link from "next/link";
import { AccountResponse, detailTypeLabel } from "./types";

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
      className="text-neutral-300"
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
    <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-100 px-4 py-4 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-neutral-800 truncate">
          {account.name}
        </p>
        {account.detailType !== "NORMAL" && (
          <span className="inline-block mt-1 text-[11px] font-medium text-blue-500 bg-blue-50 rounded-md px-1.5 py-0.5">
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
          className="flex-shrink-0 p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
