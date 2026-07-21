// app/components/portfolio/SortModal.tsx
// M7: D-054 — 보유자산 정렬 모달 팝업. 방향은 위/아래 화살표 아이콘.
// 계좌 상세 화면 전용으로 시작하지만 기능 중립적으로 작성 — 추후 다른 목록에도 재사용 가능.
"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/app/components/wizard/Ui";

export type HoldingSortKey = "value" | "profitRate" | "name";
export type SortDirection = "desc" | "asc";

const SORT_KEY_OPTIONS: { key: HoldingSortKey; label: string }[] = [
  { key: "value", label: "평가금액" },
  { key: "profitRate", label: "수익률" },
  { key: "name", label: "이름" },
];

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function SortModal({
  sortKey,
  sortDir,
  onApply,
  onClose,
}: {
  sortKey: HoldingSortKey;
  sortDir: SortDirection;
  onApply: (key: HoldingSortKey, dir: SortDirection) => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState<HoldingSortKey>(sortKey);
  const [dir, setDir] = useState<SortDirection>(sortDir);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ background: "rgba(16,16,19,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl p-6"
        style={{ background: "var(--surface)" }}
      >
        <p
          className="text-[16px] font-semibold mb-4"
          style={{ color: "var(--text-strong)" }}
        >
          정렬
        </p>

        <div className="space-y-1.5 mb-5">
          {SORT_KEY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setKey(opt.key)}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[14px] font-medium transition-colors"
              style={
                key === opt.key
                  ? { color: "var(--accent)", background: "var(--accent-soft)" }
                  : { color: "var(--text)" }
              }
            >
              {opt.label}
              {key === opt.key && <CheckIcon />}
            </button>
          ))}
        </div>

        <p
          className="text-[12px] font-semibold mb-2 px-1"
          style={{ color: "var(--text-sub)" }}
        >
          방향
        </p>
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setDir("desc")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
            style={
              dir === "desc"
                ? { color: "var(--accent)", background: "var(--accent-soft)" }
                : { color: "var(--text-sub)", background: "var(--surface-pressed)" }
            }
          >
            <ArrowDownIcon />
            내림차순
          </button>
          <button
            type="button"
            onClick={() => setDir("asc")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
            style={
              dir === "asc"
                ? { color: "var(--accent)", background: "var(--accent-soft)" }
                : { color: "var(--text-sub)", background: "var(--surface-pressed)" }
            }
          >
            <ArrowUpIcon />
            오름차순
          </button>
        </div>

        <div className="flex gap-2">
          <SecondaryButton onClick={onClose} className="flex-1">
            취소
          </SecondaryButton>
          <PrimaryButton
            onClick={() => onApply(key, dir)}
            className="flex-1"
          >
            적용
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
